// middleware/checkRole.js
import userModel from '../model/User.js';

const checkRole = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      const email = req.email || req.headers['email'];

      const user = await userModel.findOne({ email });

      if (!user) {
        return res.status(404).json({ status: 'Failed', message: 'User not found' });
      }

      const userRole = user.role || 'user'; // single string

      const hasRole = allowedRoles.includes(userRole); // ✅ fixed logic for string role

      if (!hasRole) {
        return res.status(403).json({ status: 'Failed', message: 'Forbidden: You do not have permission' });
      }

      req.userRole = userRole;
      next();
    } catch (error) {
      res.status(500).json({ status: 'Failed', message: error.message });
    }
  };
};

export default checkRole;