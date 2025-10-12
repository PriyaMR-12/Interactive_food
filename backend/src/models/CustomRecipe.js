// models/CustomRecipe.js
import mongoose from "mongoose";

const customRecipeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    ingredients: [
      {
        type: String,
        required: true,
      }
    ],
    instructions: {
      type: String,
      required: true,
    },
    image: {
      type: String, // Optional - URL or base64
      default: "",
    }
  },
  { timestamps: true }
);

const CustomRecipe = mongoose.model("CustomRecipe", customRecipeSchema);
export default CustomRecipe;
