const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  // Expect header: Authorization: Bearer <token>
  const authHeader = req.header('Authorization') || req.header('authorization');
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user; // { id: ... }
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};
