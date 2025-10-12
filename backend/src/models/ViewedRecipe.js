// models/ViewedRecipe.js
import mongoose from "mongoose";

const viewedRecipeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recipeId: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      default: "",
    },
    viewedAt: {
      type: Date,
      default: Date.now,
    }
  },
  { timestamps: true }
);

const ViewedRecipe = mongoose.model("ViewedRecipe", viewedRecipeSchema);
export default ViewedRecipe;
