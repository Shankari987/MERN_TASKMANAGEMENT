const Task = require('../models/Task');
const User = require('../models/User');
const {
  sendTaskAssignmentEmail,
  sendTaskStatusUpdateEmail,
} = require('../services/emailService');

/**
 * @desc    Get tasks with search, filter, and pagination
 * @route   GET /api/tasks
 * @access  Private (Admin & Employee)
 */
const getTasks = async (req, res, next) => {
  try {
    const { search, status, priority } = req.query;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 10);
    const skip = (page - 1) * limit;

    const query = {};

    // Strict Role Enforcement: Employees can ONLY view their own assigned tasks
    if (req.user.role === 'employee') {
      query.assignedEmployee = req.user._id;
    }

    // Filter by status if provided
    if (status && ['Not Started', 'Pending', 'In Progress', 'Completed'].includes(status)) {
      query.status = status;
    }

    // Filter by priority if provided
    if (priority && ['High', 'Medium', 'Low'].includes(priority)) {
      query.priority = priority;
    }

    // Search functionality by task title or employee name
    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');

      if (req.user.role === 'admin') {
        // In admin mode, also find employees whose name matches the search query
        const matchingEmployees = await User.find({
          role: 'employee',
          name: searchRegex,
        }).select('_id');
        const employeeIds = matchingEmployees.map((e) => e._id);

        query.$or = [
          { title: searchRegex },
          { description: searchRegex },
          { assignedEmployee: { $in: employeeIds } },
        ];
      } else {
        // In employee mode, search only their own tasks by title/description
        query.$or = [{ title: searchRegex }, { description: searchRegex }];
      }
    }

    const totalTasks = await Task.countDocuments(query);
    const totalPages = Math.ceil(totalTasks / limit) || 1;

    const tasks = await Task.find(query)
      .populate('assignedEmployee', 'name email status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      tasks,
      currentPage: page,
      totalPages,
      totalTasks,
      limit,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new task and notify assigned employee
 * @route   POST /api/tasks
 * @access  Private (Admin only)
 */
const createTask = async (req, res, next) => {
  try {
    const { title, description, assignedEmployee, priority, status } = req.body;

    if (!title || !description || !assignedEmployee) {
      return res.status(400).json({
        success: false,
        message: 'Task title, description, and assigned employee are required',
      });
    }

    // Verify employee exists and is an active employee
    const employee = await User.findOne({
      _id: assignedEmployee,
      role: 'employee',
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Assigned employee not found or is not an active employee',
      });
    }

    const task = await Task.create({
      title: title.trim(),
      description: description.trim(),
      assignedEmployee: employee._id,
      priority: priority || 'Medium',
      status: status || 'Not Started',
    });

    const populatedTask = await Task.findById(task._id).populate(
      'assignedEmployee',
      'name email status'
    );

    // Dispatch assignment email notification to employee
    sendTaskAssignmentEmail({
      employeeEmail: employee.email,
      employeeName: employee.name,
      taskTitle: populatedTask.title,
      taskDescription: populatedTask.description,
      priority: populatedTask.priority,
      status: populatedTask.status,
      createdDate: populatedTask.createdAt,
      adminName: req.user.name,
    }).catch((err) => {
      console.error('[TaskController] Email dispatch error:', err.message);
    });

    res.status(201).json({
      success: true,
      message: 'Task created and assigned successfully',
      task: populatedTask,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single task details
 * @route   GET /api/tasks/:id
 * @access  Private (Admin & Employee assigned to this task)
 */
const getTaskById = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id).populate(
      'assignedEmployee',
      'name email status'
    );

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    // Role check: Employee can only view their own assigned task
    if (
      req.user.role === 'employee' &&
      task.assignedEmployee._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot view tasks assigned to other employees',
      });
    }

    res.status(200).json({
      success: true,
      task,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update task details (title, description, employee, priority, status)
 * @route   PUT /api/tasks/:id
 * @access  Private (Admin only)
 */
const updateTask = async (req, res, next) => {
  try {
    const { title, description, assignedEmployee, priority, status } = req.body;

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    const previousEmployeeId = task.assignedEmployee.toString();

    if (title) task.title = title.trim();
    if (description) task.description = description.trim();
    if (priority) task.priority = priority;
    if (status) task.status = status;

    let newEmployee = null;
    if (assignedEmployee && assignedEmployee !== previousEmployeeId) {
      newEmployee = await User.findOne({
        _id: assignedEmployee,
        role: 'employee',
      });
      if (!newEmployee) {
        return res.status(404).json({
          success: false,
          message: 'Assigned employee not found',
        });
      }
      task.assignedEmployee = newEmployee._id;
    }

    await task.save();

    const populatedTask = await Task.findById(task._id).populate(
      'assignedEmployee',
      'name email status'
    );

    // If assigned to a new employee, notify them via email
    if (newEmployee) {
      sendTaskAssignmentEmail({
        employeeEmail: newEmployee.email,
        employeeName: newEmployee.name,
        taskTitle: populatedTask.title,
        taskDescription: populatedTask.description,
        priority: populatedTask.priority,
        status: populatedTask.status,
        createdDate: populatedTask.updatedAt,
        adminName: req.user.name,
      }).catch((err) => {
        console.error('[TaskController] Reassignment email error:', err.message);
      });
    }

    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      task: populatedTask,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete task
 * @route   DELETE /api/tasks/:id
 * @access  Private (Admin only)
 */
const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    await Task.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update task status (Employee or Admin) & notify Admin
 * @route   PUT /api/tasks/:id/status
 * @access  Private (Employee assigned to this task OR Admin)
 */
const updateTaskStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    const validStatuses = ['Not Started', 'Pending', 'In Progress', 'Completed'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const task = await Task.findById(req.params.id).populate(
      'assignedEmployee',
      'name email'
    );

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    // Role verification: If employee, verify the task belongs to them
    if (
      req.user.role === 'employee' &&
      task.assignedEmployee._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot update status of tasks assigned to other employees',
      });
    }

    const previousStatus = task.status;
    task.status = status;
    await task.save();

    // Send email notification to Admin when employee updates status
    if (req.user.role === 'employee') {
      sendTaskStatusUpdateEmail({
        adminEmail: process.env.ADMIN_EMAIL || 'admin@example.com',
        employeeName: req.user.name,
        taskTitle: task.title,
        previousStatus,
        newStatus: status,
        updatedDate: task.updatedAt,
      }).catch((err) => {
        console.error('[TaskController] Status update email error:', err.message);
      });
    }

    res.status(200).json({
      success: true,
      message: `Task status updated to '${status}' successfully`,
      task,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTasks,
  createTask,
  getTaskById,
  updateTask,
  deleteTask,
  updateTaskStatus,
};
