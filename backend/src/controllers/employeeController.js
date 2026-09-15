const User = require('../models/User');
const Task = require('../models/Task');

/**
 * @desc    Get all employees with task statistics
 * @route   GET /api/employees
 * @access  Private (Admin only)
 */
const getEmployees = async (req, res, next) => {
  try {
    const employees = await User.find({ role: 'employee' })
      .select('-password')
      .sort({ createdAt: -1 });

    // Attach task count per employee
    const employeesWithCounts = await Promise.all(
      employees.map(async (emp) => {
        const totalTasks = await Task.countDocuments({ assignedEmployee: emp._id });
        const completedTasks = await Task.countDocuments({
          assignedEmployee: emp._id,
          status: 'Completed',
        });
        const pendingTasks = await Task.countDocuments({
          assignedEmployee: emp._id,
          status: { $in: ['Pending', 'In Progress', 'Not Started'] },
        });

        return {
          ...emp.toObject(),
          stats: {
            totalTasks,
            completedTasks,
            pendingTasks,
          },
        };
      })
    );

    res.status(200).json({
      success: true,
      count: employeesWithCounts.length,
      employees: employeesWithCounts,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new employee
 * @route   POST /api/employees
 * @access  Private (Admin only)
 */
const createEmployee = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'A user with this email address already exists',
      });
    }

    // Role is strictly set to 'employee'
    const employee = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: 'employee',
      status: 'Active',
    });

    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      employee: {
        _id: employee._id,
        name: employee.name,
        email: employee.email,
        role: employee.role,
        status: employee.status,
        createdAt: employee.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single employee details by ID
 * @route   GET /api/employees/:id
 * @access  Private (Admin only)
 */
const getEmployeeById = async (req, res, next) => {
  try {
    const employee = await User.findOne({
      _id: req.params.id,
      role: 'employee',
    }).select('-password');

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    // Fetch employee's tasks
    const tasks = await Task.find({ assignedEmployee: employee._id }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      employee,
      tasks,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update employee information
 * @route   PUT /api/employees/:id
 * @access  Private (Admin only)
 */
const updateEmployee = async (req, res, next) => {
  try {
    const { name, email, status, password } = req.body;

    const employee = await User.findOne({
      _id: req.params.id,
      role: 'employee',
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    // If updating email, check for uniqueness
    if (email && email.toLowerCase().trim() !== employee.email) {
      const emailExists = await User.findOne({
        email: email.toLowerCase().trim(),
        _id: { $ne: employee._id },
      });
      if (emailExists) {
        return res.status(409).json({
          success: false,
          message: 'An employee with this email already exists',
        });
      }
      employee.email = email.toLowerCase().trim();
    }

    if (name) employee.name = name.trim();
    if (status) employee.status = status;
    if (password && password.trim().length >= 6) {
      employee.password = password; // Pre-save hook will hash it
    }

    await employee.save();

    res.status(200).json({
      success: true,
      message: 'Employee updated successfully',
      employee: {
        _id: employee._id,
        name: employee.name,
        email: employee.email,
        role: employee.role,
        status: employee.status,
        updatedAt: employee.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete employee & clean up/unassign tasks
 * @route   DELETE /api/employees/:id
 * @access  Private (Admin only)
 */
const deleteEmployee = async (req, res, next) => {
  try {
    const employee = await User.findOne({
      _id: req.params.id,
      role: 'employee',
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    // Delete associated tasks or delete employee
    await Task.deleteMany({ assignedEmployee: employee._id });
    await User.findByIdAndDelete(employee._id);

    res.status(200).json({
      success: true,
      message: 'Employee and assigned tasks deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEmployees,
  createEmployee,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
};
