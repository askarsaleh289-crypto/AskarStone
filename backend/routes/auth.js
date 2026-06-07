import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
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
// ===================== GOOGLE LOGIN START =====================
//
router.get("/google", (req, res) => {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    if (!clientId || !redirectUri) {
      return res.status(500).json({
        error: "Google OAuth not configured",
      });
    }

    const url = new URL(
      "https://accounts.google.com/o/oauth2/v2/auth"
    );

    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", "openid email profile");
    url.searchParams.set("access_type", "offline");
    url.searchParams.set("prompt", "consent");

    res.redirect(url.toString());
  } catch (err) {
    console.error("Google login error:", err);
    res.status(500).json({ error: "Google login failed" });
  }
});

//
// ===================== GOOGLE CALLBACK =====================
//
router.get("/google-callback", async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({ error: "Missing code" });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      return res.status(500).json({
        error: "Google OAuth not configured properly",
      });
    }

    // Exchange code for tokens
    const tokenParams = new URLSearchParams();
    tokenParams.append("code", code);
    tokenParams.append("client_id", clientId);
    tokenParams.append("client_secret", clientSecret);
    tokenParams.append("redirect_uri", redirectUri);
    tokenParams.append("grant_type", "authorization_code");

    const response = await fetch(
      "https://oauth2.googleapis.com/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
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

    // Verify user info
    const infoRes = await fetch(
      `https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${tokenData.id_token}`
    );

    const profile = await infoRes.json();

    if (!infoRes.ok || !profile.email) {
      return res.status(401).json({
        error: "Failed to get Google profile",
      });
    }

    const { email, name } = profile;

    // Check user
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

    // Create JWT
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

    // Redirect frontend with token
    return res.redirect(
      `${getFrontendUrl(req)}/auth-success?token=${token}`
    );
  } catch (err) {
    console.error("Google callback error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;