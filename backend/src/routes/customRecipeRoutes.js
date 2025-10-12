import express from "express";
import authMiddleware from "../../middleware/authMiddleware.js";
import {
  createCustomRecipe,
  getCustomRecipes,
  deleteCustomRecipe,
} from "../../controllers/customRecipeController.js";

const router = express.Router();

router.post("/", authMiddleware, createCustomRecipe);
router.get("/", authMiddleware, getCustomRecipes);
router.delete("/:id", authMiddleware, deleteCustomRecipe);

export default router;
