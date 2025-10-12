
import Favorite from "../models/Favorite.js";
import protect from "../../middleware/authMiddleware.js";

import { Router } from "express";
const router = Router();

// ✅ Add Recipe to Favorites
router.post("/add", protect, async (req, res) => {
  try {
    const { recipeId, title, image } = req.body;

    const exists = await Favorite.findOne({ userId: req.user._id, recipeId });
    if (exists) {
      return res.status(400).json({ message: "Recipe already in favorites" });
    }

    const favorite = await Favorite.create({
      userId: req.user._id,
      recipeId,
      title,
      image,
    });

    res.status(201).json({ message: "Added to favorites", favorite });
  } catch (error) {
    res.status(500).json({ message: "Failed to add", error: error.message });
  }
});

// ✅ Get All Favorites for a User
router.get("/", protect, async (req, res) => {
  try {
    const favorites = await Favorite.find({ userId: req.user._id });
    res.json(favorites);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch favorites", error: error.message });
  }
});

// ✅ Remove Favorite
router.delete("/:id", protect, async (req, res) => {
  try {
    const deleted = await Favorite.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!deleted) {
      return res.status(404).json({ message: "Favorite not found" });
    }

    res.json({ message: "Favorite removed" });
  } catch (error) {
    res.status(500).json({ message: "Failed to remove", error: error.message });
  }
});

export default router;
