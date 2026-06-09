import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import fetch from "node-fetch";
import db from "../db.js";
import dotenv from "dotenv";
import sendEmail from "../utils/sendEmail.js";

dotenv.config();

const router = express.Router();

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    is_admin: user.is_admin,
    is_verified: user.is_verified,
  };
}

function getFrontendUrl(req) {
  return (
    process.env.FRONTEND_URL ||
    req.headers.origin ||
    "http://localhost:3000"
  ).replace(/\/+$/, "");
}

//
// ===================== GOOGLE LOGIN =====================
//
router.get("/google", (req, res) => {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    if (!clientId || !redirectUri) {
      return res.status(500).json({ error: "Google OAuth not configured" });
    }

    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");

    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", "openid email profile");
    url.searchParams.set("access_type", "offline");
    url.searchParams.set("prompt", "consent");

    res.redirect(url.toString());
  } catch (err) {
    res.status(500).json({ error: "Google login failed" });
  }
});

//
// ===================== GOOGLE CALLBACK =====================
//
router.get("/google-callback", async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) return res.status(400).json({ error: "Missing code" });

    const tokenParams = new URLSearchParams();
    tokenParams.append("code", code);
    tokenParams.append("client_id", process.env.GOOGLE_CLIENT_ID);
    tokenParams.append("client_secret", process.env.GOOGLE_CLIENT_SECRET);
    tokenParams.append("redirect_uri", process.env.GOOGLE_REDIRECT_URI);
    tokenParams.append("grant_type", "authorization_code");

    const response = await fetch(
      "https://oauth2.googleapis.com/token",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: tokenParams.toString(),
      }
    );

    const tokenData = await response.json();

    if (!response.ok || !tokenData.id_token) {
      return res.status(401).json({
        error: "Google token exchange failed",
        details: tokenData,
      });
    }

    const infoRes = await fetch(
      `https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${tokenData.id_token}`
    );

    const profile = await infoRes.json();

    if (!infoRes.ok || !profile.email) {
      return res.status(401).json({ error: "Google profile failed" });
    }

    const { email, name } = profile;

    const [rows] = await db.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    let user;

    if (rows.length) {
      user = rows[0];
    } else {
      const hash = await bcrypt.hash(
        crypto.randomBytes(16).toString("hex"),
        10
      );

      await db.query(
        "INSERT INTO users (name, email, password, is_verified) VALUES (?, ?, ?, 1)",
        [name || email.split("@")[0], email, hash]
      );

      const [newUser] = await db.query(
        "SELECT * FROM users WHERE email = ?",
        [email]
      );

      user = newUser[0];
    }

    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        is_admin: user.is_admin,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.redirect(
      `${getFrontendUrl(req)}/auth-success?token=${token}`
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

//
// ===================== REGISTER =====================
//
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ error: "Missing fields" });

    if (password !== confirmPassword)
      return res.status(400).json({ error: "Passwords do not match" });

    if (password.length < 6)
      return res.status(400).json({ error: "Password too short" });

    const [existing] = await db.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existing.length)
      return res.status(400).json({ error: "Email already exists" });

    const hash = await bcrypt.hash(password, 10);

    const verifyToken = crypto.randomInt(100000, 999999).toString();
    const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const [result] = await db.query(
      `INSERT INTO users (name, email, password, verify_token, verify_token_expiry, is_verified)
       VALUES (?, ?, ?, ?, ?, 0)`,
      [name, email, hash, verifyToken, expiry]
    );

    const verifyLink = `${getFrontendUrl(req)}/VerifyEmail?token=${verifyToken}&email=${encodeURIComponent(email)}`;

    await sendEmail(
      email,
      "Verify your email",
      `<h2>Your code: ${verifyToken}</h2><a href="${verifyLink}">Verify</a>`
    );

    res.status(201).json({
      message: "Check your email",
      userId: result.insertId,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Register failed" });
  }
});

//
// ===================== VERIFY EMAIL =====================
//
router.post("/verify-email", async (req, res) => {
  try {
    const { token, email } = req.body;

    const [rows] = await db.query(
      "SELECT * FROM users WHERE email = ? AND verify_token = ?",
      [email, token]
    );

    if (!rows.length)
      return res.status(400).json({ error: "Invalid token" });

    const user = rows[0];

    if (new Date() > user.verify_token_expiry)
      return res.status(400).json({ error: "Token expired" });

    await db.query(
      `UPDATE users 
       SET is_verified = 1, verify_token = NULL, verify_token_expiry = NULL 
       WHERE id = ?`,
      [user.id]
    );

    user.is_verified = 1;

    const jwtToken = jwt.sign(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        is_admin: user.is_admin,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Verified",
      token: jwtToken,
      user: publicUser(user),
    });
  } catch (err) {
    res.status(500).json({ error: "Verify failed" });
  }
});

//
// ===================== LOGIN =====================
//
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const [rows] = await db.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (!rows.length)
      return res.status(400).json({ error: "Invalid credentials" });

    const user = rows[0];

    if (!user.is_verified)
      return res.status(403).json({ error: "Verify email first" });

    const match = await bcrypt.compare(password, user.password);

    if (!match)
      return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        is_admin: user.is_admin,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ token, user: publicUser(user) });
  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
});

//
// ===================== FORGOT PASSWORD =====================
//
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    const [rows] = await db.query(
      "SELECT id, name FROM users WHERE email = ?",
      [email]
    );

    if (!rows.length)
      return res.json({ message: "If email exists, reset sent" });

    const user = rows[0];

    const resetToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");
    const expiry = new Date(Date.now() + 60 * 60 * 1000);

    await db.query(
      "UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?",
      [tokenHash, expiry, user.id]
    );

    const link = `${getFrontendUrl(req)}/reset-password?token=${resetToken}&email=${email}`;

    await sendEmail(
      email,
      "Reset Password",
      `<a href="${link}">Reset Password</a>`
    );

    res.json({ message: "Check email" });
  } catch (err) {
    res.status(500).json({ error: "Forgot failed" });
  }
});

//
// ===================== RESET PASSWORD =====================
//
router.post("/reset-password", async (req, res) => {
  try {
    const { token, email, password, confirmPassword } = req.body;

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const [rows] = await db.query(
      "SELECT * FROM users WHERE email = ? AND reset_token = ?",
      [email, tokenHash]
    );

    if (!rows.length)
      return res.status(400).json({ error: "Invalid token" });

    const user = rows[0];

    if (new Date() > user.reset_token_expiry)
      return res.status(400).json({ error: "Token expired" });

    const hash = await bcrypt.hash(password, 10);

    await db.query(
      "UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?",
      [hash, user.id]
    );

    res.json({ message: "Password updated" });
  } catch (err) {
    res.status(500).json({ error: "Reset failed" });
  }
});

//
// ===================== RESEND VERIFY =====================
//
router.post("/resend-verify", async (req, res) => {
  try {
    const { email } = req.body;

    const [rows] = await db.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (!rows.length)
      return res.status(404).json({ error: "User not found" });

    const user = rows[0];

    if (user.is_verified)
      return res.status(400).json({ error: "Already verified" });

    const verifyToken = crypto.randomInt(100000, 999999).toString();
    const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await db.query(
      "UPDATE users SET verify_token = ?, verify_token_expiry = ? WHERE id = ?",
      [verifyToken, expiry, user.id]
    );

    const link = `${getFrontendUrl(req)}/verify-email?token=${verifyToken}&email=${encodeURIComponent(email)}`;

    await sendEmail(
      email,
      "Verify email",
      `<h2>${verifyToken}</h2><a href="${link}">Verify</a>`
    );

    res.json({ message: "Sent" });
  } catch (err) {
    res.status(500).json({ error: "Resend failed" });
  }
});

export default router;