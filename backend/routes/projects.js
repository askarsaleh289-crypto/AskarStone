import express from "express";
import multer from "multer";
import path from "path";
import db from "../db.js";
import { verifyToken, isAdmin } from "../middleware/auth.js";

const router = express.Router();
const UPLOAD_DIR = path.join(process.cwd(), "uploads","projects");
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "_"))
});
const upload = multer({ storage });

router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM projects ORDER BY id DESC");
    res.json(rows);
  } catch (err) {
    console.error("Get projects error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/", verifyToken, isAdmin, upload.single("image"), async (req, res) => {
  try {
    const { title, description } = req.body;
    const image = req.file ? req.file.filename : null;
    await db.query("INSERT INTO projects (title, description, image) VALUES (?,?,?)", [title, description || null, image]);
    res.json({ message: "Project added" });
  } catch (err) {
    console.error("Add project error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/:id", verifyToken, isAdmin, upload.single("image"), async (req, res) => {
  try {
    const { title, description } = req.body;
    const image = req.file ? req.file.filename : null;
    if (image) await db.query("UPDATE projects SET title=?, description=?, image=? WHERE id=?", [title, description || null, image, req.params.id]);
    else await db.query("UPDATE projects SET title=?, description=? WHERE id=?", [title, description || null, req.params.id]);
    res.json({ message: "Project updated" });
  } catch (err) {
    console.error("Update project error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    await db.query("DELETE FROM projects WHERE id = ?", [req.params.id]);
    res.json({ message: "Project deleted" });
  } catch (err) {
    console.error("Delete project error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;


