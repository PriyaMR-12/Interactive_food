// middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import User from "../src/models/User.js";
import BlacklistedToken from "../src/models/BlacklistedToken.js";

const protect = async (req, res, next) => {
  let token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  const isBlacklisted = await BlacklistedToken.findOne({ token });
  if (isBlacklisted) {
    return res.status(401).json({ message: "Token logged out, login again" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};

export default protect;

