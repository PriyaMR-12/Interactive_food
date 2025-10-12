import express from "express";
import {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  deleteAccount,
} from "../../controllers/authController.js";
import authMiddleware from "../../middleware/authMiddleware.js";

const router = express.Router();

// ✅ Auth Routes
router.post("/signup", registerUser);
router.post("/login", loginUser);

// ✅ User Profile Routes
router.get("/profile", authMiddleware, getProfile);
router.put("/profile", authMiddleware, updateProfile);
router.delete("/delete", authMiddleware, deleteAccount);

export default router;
