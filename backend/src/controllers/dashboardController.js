const User = require('../models/User');
const Task = require('../models/Task');

/**
 * @desc    Get dashboard metrics & statistics for Admin or Employee
 * @route   GET /api/dashboard/stats
 * @access  Private (Admin & Employee)
 */
const getDashboardStats = async (req, res, next) => {
  try {
    if (req.user.role === 'admin') {
      // Aggregations for Admin Dashboard
      const [
        totalEmployees,
        totalTasks,
        notStarted,
        pendingOrInProgress,
        completed,
        recentTasks,
      ] = await Promise.all([
        User.countDocuments({ role: 'employee' }),
        Task.countDocuments(),
        Task.countDocuments({ status: 'Not Started' }),
        Task.countDocuments({ status: { $in: ['Pending', 'In Progress'] } }),
        Task.countDocuments({ status: 'Completed' }),
        Task.find()
          .populate('assignedEmployee', 'name email')
          .sort({ createdAt: -1 })
          .limit(5),
      ]);

      return res.status(200).json({
        success: true,
        role: 'admin',
        stats: {
          totalEmployees,
          totalTasks,
          notStarted,
          pendingOrInProgress,
          completed,
        },
        recentTasks,
      });
    } else {
      // Aggregations for Employee Dashboard
      const employeeId = req.user._id;

      const [
        totalTasks,
        notStarted,
        pendingOrInProgress,
        completed,
        recentTasks,
      ] = await Promise.all([
        Task.countDocuments({ assignedEmployee: employeeId }),
        Task.countDocuments({ assignedEmployee: employeeId, status: 'Not Started' }),
        Task.countDocuments({
          assignedEmployee: employeeId,
          status: { $in: ['Pending', 'In Progress'] },
        }),
        Task.countDocuments({ assignedEmployee: employeeId, status: 'Completed' }),
        Task.find({ assignedEmployee: employeeId })
          .sort({ updatedAt: -1 })
          .limit(5),
      ]);

      return res.status(200).json({
        success: true,
        role: 'employee',
        stats: {
          totalTasks,
          notStarted,
          pendingOrInProgress,
          completed,
        },
        recentTasks,
      });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
};
