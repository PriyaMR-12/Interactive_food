// models/BlacklistedToken.js
import mongoose from "mongoose";

const blacklistedTokenSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    }
  },
  { timestamps: true }
);

blacklistedTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const BlacklistedToken = mongoose.model("BlacklistedToken", blacklistedTokenSchema);
export default BlacklistedToken;
