
import CustomRecipe from "../src/models/CustomRecipe.js";

// ✅ Create a custom recipe
export const createCustomRecipe = async (req, res) => {
  try {
    const { title, ingredients, instructions } = req.body;
    const recipe = await CustomRecipe.create({
      userId: req.user.id,
      title,
      ingredients,
      instructions,
    });
    res.status(201).json(recipe);
  } catch (error) {
    res.status(500).json({ message: "Error creating recipe", error });
  }
};

// ✅ Get all custom recipes by logged-in user
export const getCustomRecipes = async (req, res) => {
  try {
    const recipes = await CustomRecipe.find({ userId: req.user.id });
    res.json(recipes);
  } catch (error) {
    res.status(500).json({ message: "Error fetching recipes", error });
  }
};

// ✅ Delete a recipe
export const deleteCustomRecipe = async (req, res) => {
  try {
    await CustomRecipe.findByIdAndDelete(req.params.id);
    res.json({ message: "Recipe deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting recipe", error });
  }
};

