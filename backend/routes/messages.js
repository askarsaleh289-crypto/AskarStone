import express from "express";
import multer from "multer";
import path from "path";
import db from "../db.js";
import { verifyToken, isAdmin } from "../middleware/auth.js";
import sendEmail from "../utils/sendEmail.js";


const router = express.Router();
const UPLOAD_DIR = path.join(process.cwd(), "uploads","contact");
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "_"))
});
const upload = multer({ storage });

router.post("/", verifyToken, upload.single("image"), async (req, res) => {
  try {
    const { message } = req.body;
    const image = req.file ? req.file.filename : null;
    await db.query("INSERT INTO messages (user_id, message, image) VALUES (?,?,?)", [req.user.id, message || null, image]);
    res.json({ message: "Message sent" });
  } catch (err) {
    console.error("Send message error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/", verifyToken, isAdmin, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT m.id, m.user_id, m.message, m.image, m.created_at, u.name AS user_name
      FROM messages m
      LEFT JOIN users u ON m.user_id = u.id
      ORDER BY m.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error("Get messages error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


router.post("/send-email", verifyToken, isAdmin, async (req, res) => {
  try {
    const { userId, subject, message } = req.body;

    const [[user]] = await db.query(
      "SELECT email, name FROM users WHERE id = ?",
      [userId]
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

   await sendEmail(
  user.email,
  subject || "Message from Askar Stone",
  `
  <div style="font-family:Arial;padding:20px">
    <h3>Askar Stone</h3>
    <p>Hello ${user.name},</p>
    <p>${message}</p>
    <hr/>
    <small>This email was sent from Admin Panel</small>
  </div>
  `
);

    res.json({ message: "Email sent successfully" });

  } catch (err) {
    console.error("Admin send email error:", err);
    res.status(500).json({ message: "Server error" });
  }
});
router.get("/ping", (req, res) => {
  res.json({ ok: true });
});


export default router;
