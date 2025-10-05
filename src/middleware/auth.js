// authMiddleware.js
import jwt from 'jsonwebtoken';

const authMiddleware = (req, res, next) => {
  const token = req.headers['token'];

  if (!token) {
    return res.status(401).json({ status: 'Unauthorized', message: 'Token missing' });
  }  

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ status: 'Unauthorized' });
    }
    
    req.headers.email = decoded.data;
    req.user = decoded;
    next();
  });
};

export default authMiddleware;
