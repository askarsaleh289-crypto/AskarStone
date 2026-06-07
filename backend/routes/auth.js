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

//
// ===================== REGISTER =====================
//
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        error: "Name, email, and password are required"
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        error: "Passwords do not match"
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: "Password must be at least 6 characters"
      });
    }

    // Check if user exists
    const [existing] = await db.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existing.length) {
      return res.status(400).json({
        error: "Email already registered"
      });
    }

    // Hash password
    const hash = await bcrypt.hash(password, 10);

    // Generate email verification token (6 digit code + timestamp)
    const verifyToken = Math.random().toString().slice(2, 8);
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Insert user
    const [result] = await db.query(
      "INSERT INTO users (name, email, password, verify_token, verify_token_expiry, is_verified) VALUES (?, ?, ?, ?, ?, 0)",
      [name, email, hash, verifyToken, tokenExpiry]
    );

    // Send verification email
    const verifyLink = `${getFrontendUrl(req)}/verify-email?token=${verifyToken}&email=${encodeURIComponent(email)}`;
    
    const emailHtml = `
      <div style="font-family:Arial, sans-serif;color:#222;">
        <div style="max-width:600px;margin:0 auto;padding:20px;">
          <h2 style="color:#1f1f1f">Welcome to Askar Stone</h2>
          <p>Hi ${name},</p>
          <p>Thank you for registering! Please verify your email to activate your account.</p>
          
          <p style="margin:24px 0;">
            <a href="${verifyLink}" style="display:inline-block;background:#007bff;color:white;padding:12px 24px;text-decoration:none;border-radius:4px;font-weight:bold;">
              Verify Email
            </a>
          </p>
          
          <p style="color:#666;font-size:14px;">Or use this code: <strong>${verifyToken}</strong></p>
          <p style="color:#666;font-size:14px;">This link expires in 24 hours.</p>
        </div>
      </div>
    `;

    await sendEmail(
      email,
      "Verify your email - Askar Stone",
      emailHtml
    );

    res.status(201).json({
      message: "Registration successful. Please check your email to verify your account.",
      userId: result.insertId
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Registration failed" });
  }
});

//
// ===================== VERIFY EMAIL =====================
//
router.post("/verify-email", async (req, res) => {
  try {
    const { token, email } = req.body;

    if (!token || !email) {
      return res.status(400).json({
        error: "Token and email are required"
      });
    }

    const [rows] = await db.query(
      "SELECT * FROM users WHERE email = ? AND verify_token = ?",
      [email, token]
    );

    if (!rows.length) {
      return res.status(400).json({
        error: "Invalid verification token"
      });
    }

    const user = rows[0];

    // Check token expiry
    if (new Date() > user.verify_token_expiry) {
      return res.status(400).json({
        error: "Verification token has expired"
      });
    }

    // Mark as verified
    await db.query(
      "UPDATE users SET is_verified = 1, verify_token = NULL, verify_token_expiry = NULL WHERE id = ?",
      [user.id]
    );

    // Create JWT
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
      message: "Email verified successfully",
      token: jwtToken,
      user: publicUser(user)
    });
  } catch (err) {
    console.error("Verify email error:", err);
    res.status(500).json({ error: "Email verification failed" });
  }
});

//
// ===================== LOGIN =====================
//
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required"
      });
    }

    // Get user
    const [rows] = await db.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (!rows.length) {
      return res.status(401).json({
        error: "Invalid email or password"
      });
    }

    const user = rows[0];

    // Check if verified
    if (!user.is_verified) {
      return res.status(401).json({
        error: "Please verify your email before logging in"
      });
    }

    // Check password
    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return res.status(401).json({
        error: "Invalid email or password"
      });
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

    res.json({
      message: "Login successful",
      token,
      user: publicUser(user)
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

//
// ===================== FORGOT PASSWORD =====================
//
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: "Email is required"
      });
    }

    const [rows] = await db.query(
      "SELECT id, name FROM users WHERE email = ?",
      [email]
    );

    if (!rows.length) {
      // Don't reveal whether email exists for security
      return res.json({
        message: "If this email exists, you will receive a password reset link"
      });
    }

    const user = rows[0];

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");
    const tokenExpiry = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

    // Store token hash
    await db.query(
      "UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?",
      [tokenHash, tokenExpiry, user.id]
    );

    // Send reset email
    const resetLink = `${getFrontendUrl(req)}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    const emailHtml = `
      <div style="font-family:Arial, sans-serif;color:#222;">
        <div style="max-width:600px;margin:0 auto;padding:20px;">
          <h2 style="color:#1f1f1f">Password Reset Request</h2>
          <p>Hi ${user.name},</p>
          <p>We received a request to reset your password. Click the link below to set a new password.</p>
          
          <p style="margin:24px 0;">
            <a href="${resetLink}" style="display:inline-block;background:#007bff;color:white;padding:12px 24px;text-decoration:none;border-radius:4px;font-weight:bold;">
              Reset Password
            </a>
          </p>
          
          <p style="color:#666;font-size:14px;">This link expires in 1 hour.</p>
          <p style="color:#666;font-size:14px;">If you didn't request a password reset, please ignore this email.</p>
        </div>
      </div>
    `;

    await sendEmail(
      email,
      "Reset your password - Askar Stone",
      emailHtml
    );

    res.json({
      message: "If this email exists, you will receive a password reset link"
    });
  } catch (err) {
    console.error("Forgot password error:", err.message, err.stack);
    res.status(500).json({ 
      error: "Failed to process password reset request",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

//
// ===================== RESET PASSWORD =====================
//
router.post("/reset-password", async (req, res) => {
  try {
    const { token, email, password, confirmPassword } = req.body;

    if (!token || !email || !password) {
      return res.status(400).json({
        error: "Token, email, and new password are required"
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        error: "Passwords do not match"
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: "Password must be at least 6 characters"
      });
    }

    // Hash the token to compare
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const [rows] = await db.query(
      "SELECT * FROM users WHERE email = ? AND reset_token = ?",
      [email, tokenHash]
    );

    if (!rows.length) {
      return res.status(400).json({
        error: "Invalid or expired password reset token"
      });
    }

    const user = rows[0];

    // Check token expiry
    if (new Date() > user.reset_token_expiry) {
      return res.status(400).json({
        error: "Password reset token has expired"
      });
    }

    // Hash new password
    const hash = await bcrypt.hash(password, 10);

    // Update password and clear token
    await db.query(
      "UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?",
      [hash, user.id]
    );

    res.json({
      message: "Password reset successful. Please login with your new password."
    });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ error: "Password reset failed" });
  }
});

//
// ===================== RESEND VERIFICATION EMAIL =====================
//
router.post("/resend-verify", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: "Email is required"
      });
    }

    const [rows] = await db.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (!rows.length) {
      return res.status(404).json({
        error: "User not found"
      });
    }

    const user = rows[0];

    if (user.is_verified) {
      return res.status(400).json({
        error: "Email is already verified"
      });
    }

    // Generate new verification token
    const verifyToken = Math.random().toString().slice(2, 8);
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await db.query(
      "UPDATE users SET verify_token = ?, verify_token_expiry = ? WHERE id = ?",
      [verifyToken, tokenExpiry, user.id]
    );

    // Send verification email
    const verifyLink = `${getFrontendUrl(req)}/verify-email?token=${verifyToken}&email=${encodeURIComponent(email)}`;

    const emailHtml = `
      <div style="font-family:Arial, sans-serif;color:#222;">
        <div style="max-width:600px;margin:0 auto;padding:20px;">
          <h2 style="color:#1f1f1f">Verify Your Email</h2>
          <p>Hi ${user.name},</p>
          <p>Please verify your email to activate your account.</p>
          
          <p style="margin:24px 0;">
            <a href="${verifyLink}" style="display:inline-block;background:#007bff;color:white;padding:12px 24px;text-decoration:none;border-radius:4px;font-weight:bold;">
              Verify Email
            </a>
          </p>
          
          <p style="color:#666;font-size:14px;">Or use this code: <strong>${verifyToken}</strong></p>
          <p style="color:#666;font-size:14px;">This link expires in 24 hours.</p>
        </div>
      </div>
    `;

    await sendEmail(
      email,
      "Verify your email - Askar Stone",
      emailHtml
    );

    res.json({
      message: "Verification email sent successfully"
    });
  } catch (err) {
    console.error("Resend verify error:", err);
    res.status(500).json({ error: "Failed to resend verification email" });
  }
});

export default router;