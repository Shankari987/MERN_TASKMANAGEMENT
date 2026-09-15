const express = require('express');
const router = express.Router();
const {
  getEmployees,
  createEmployee,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
} = require('../controllers/employeeController');
const authMiddleware = require('../middleware/authMiddleware');
const { adminMiddleware } = require('../middleware/roleMiddleware');

// All employee management routes require Admin privileges
router.use(authMiddleware);
router.use(adminMiddleware);

router.route('/').get(getEmployees).post(createEmployee);
router.route('/:id').get(getEmployeeById).put(updateEmployee).delete(deleteEmployee);

module.exports = router;
