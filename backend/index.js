import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import db from "./db.js";
import stoneAIRoute from "./routes/stoneAI.js";


import authRoutes from "./routes/auth.js";
import productRoutes from "./routes/products.js";
import projectRoutes from "./routes/projects.js";
import orderRoutes from "./routes/orders.js";
import messageRoutes from "./routes/messages.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/invoices", express.static(path.join(__dirname, "invoices")));
app.use("/assets", express.static(path.join(__dirname, "assets")));
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/stone-ai", stoneAIRoute);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));





