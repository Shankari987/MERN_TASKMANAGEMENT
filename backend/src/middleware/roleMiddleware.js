// Role authorization middleware
const adminMiddleware = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: Admin access required',
    });
  }
};

const employeeMiddleware = (req, res, next) => {
  if (req.user && req.user.role === 'employee') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: Employee access required',
    });
  }
};

module.exports = {
  adminMiddleware,
  employeeMiddleware,
};
