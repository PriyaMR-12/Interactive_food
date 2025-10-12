
import protect from "../../middleware/authMiddleware.js";
import ViewedRecipe from "../models/ViewedRecipe.js";

import { Router } from "express";
const router = Router();

// ✅ Add a viewed recipe
router.post("/add", protect, async (req, res) => {
  try {
    const { recipeId, title, image } = req.body;

    const viewed = await ViewedRecipe.create({
      userId: req.user._id,
      recipeId,
      title,
      image,
    });

    res.status(201).json({ message: "Recipe added to history", viewed });
  } catch (error) {
    res.status(500).json({ message: "Failed to add history", error: error.message });
  }
});

// ✅ Get viewed recipes
router.get("/", protect, async (req, res) => {
  try {
    const viewedRecipes = await ViewedRecipe.find({ userId: req.user._id })
      .sort({ viewedAt: -1 }); // latest first
    res.json(viewedRecipes);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch", error: error.message });
  }
});

// ✅ Clear a specific viewed recipe
router.delete("/:id", protect, async (req, res) => {
  try {
    const deleted = await ViewedRecipe.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!deleted) {
      return res.status(404).json({ message: "Not found" });
    }

    res.json({ message: "Removed from history" });
  } catch (error) {
    res.status(500).json({ message: "Failed to remove", error: error.message });
  }
});

// ✅ Clear all history
router.delete("/", protect, async (req, res) => {
  try {
    await ViewedRecipe.deleteMany({ userId: req.user._id });
    res.json({ message: "All viewed recipes cleared" });
  } catch (error) {
    res.status(500).json({ message: "Failed to clear history", error: error.message });
  }
});

export default router;
