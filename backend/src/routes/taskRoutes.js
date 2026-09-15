const express = require('express');
const router = express.Router();
const {
  getTasks,
  createTask,
  getTaskById,
  updateTask,
  deleteTask,
  updateTaskStatus,
} = require('../controllers/taskController');
const authMiddleware = require('../middleware/authMiddleware');
const { adminMiddleware } = require('../middleware/roleMiddleware');

// All task routes require authentication
router.use(authMiddleware);

// Employee & Admin routes
router.get('/', getTasks);
router.get('/:id', getTaskById);
router.put('/:id/status', updateTaskStatus);

// Admin-only task operations
router.post('/', adminMiddleware, createTask);
router.put('/:id', adminMiddleware, updateTask);
router.delete('/:id', adminMiddleware, deleteTask);

module.exports = router;
