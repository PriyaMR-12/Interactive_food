import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import mongoose from "mongoose";

dotenv.config();
const app = express();

// ✅ Security Middleware
app.use(helmet());

// ✅ CORS MUST COME BEFORE ROUTES
app.use(
  cors({
    origin: ["http://localhost:5500", "http://127.0.0.1:5500"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// ✅ Handle preflight requests
app.options("*", cors());

// ✅ Body parsing must come before routes
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ✅ Connect DB
import connectDB from "../config/db.js";
connectDB();

// ✅ Load routes *after CORS + JSON parsing*
import authRoutes from "./routes/authRoutes.js";
app.use("/api/auth", authRoutes);

import favoriteRoutes from "./routes/favoriteRoutes.js";
app.use("/api/favorites", favoriteRoutes);

import viewedRoutes from "./routes/viewedRoutes.js";
app.use("/api/viewed", viewedRoutes);

import customRecipeRoutes from "./routes/customRecipeRoutes.js";
app.use("/api/custom-recipes", customRecipeRoutes);

// ✅ Test route
app.get("/", (req, res) => {
  res.send("Backend is running securely");
});

// ✅ Start Server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
