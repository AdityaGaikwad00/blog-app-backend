const jwt = require("jsonwebtoken");

// Protects a route: the request must send  Authorization: Bearer <token>
function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Please log in first." });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    res.status(401).json({ message: "Session expired. Please log in again." });
  }
}

module.exports = requireAuth;
