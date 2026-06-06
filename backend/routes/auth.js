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
  return (process.env.FRONTEND_URL || req.headers.origin || "http://localhost:3000").replace(/\/+$/, "");
}

// ===================== REGISTER =====================
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: "Missing fields" });

    const [exists] = await db.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (exists.length)
      return res.status(400).json({ message: "Email already registered" });

    const hash = await bcrypt.hash(password, 10);

    await db.query(
      "INSERT INTO users (name, email, password, is_verified) VALUES (?,?,?,0)",
      [name, email, hash]
    );

    // create verification token
    const token = crypto.randomBytes(32).toString("hex");
    const expire = new Date(Date.now() + 60 * 60 * 1000)
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");

    await db.query(
      "UPDATE users SET verification_token=?, verification_expire=? WHERE email=?",
      [token, expire, email]
    );

    const frontendUrl = getFrontendUrl(req);
    const link = `${frontendUrl}/verify-email/${token}`;
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>Verify your email</title>
        </head>
        <body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td align="center" style="padding:20px;">
                <table width="600" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border-radius:12px;overflow:hidden;">
                  <tr>
                    <td style="padding:32px;color:#333;">
                      <h2 style="margin:0 0 16px;font-size:24px;color:#111;">Verify your email</h2>
                      <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#555;">
                        Thank you for registering with Askar Stone.
                      </p>
                      <p style="margin:0 0 28px;">
                        <a href="${link}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:14px 24px;background:#c9a24d;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:700;">
                          Verify your account
                        </a>
                      </p>
                      <p style="margin:0 0 10px;font-size:14px;line-height:1.6;color:#777;">
                        If the button does not work, copy and paste this URL into your browser:
                      </p>
                      <p style="margin:0;font-size:14px;line-height:1.6;word-break:break-all;">
                        <a href="${link}" target="_blank" rel="noopener noreferrer" style="color:#c9a24d;word-break:break-all;">${link}</a>
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    try {
      await sendEmail(
        email,
        "Verify your account",
        html,
        [],
        `Verify your email by visiting the following link: ${link}`
      );

      res.json({ message: "Registered successfully. Check your email." });
    } catch (emailErr) {
      // email failed but user is already created - return OK but inform about email failure
      console.error("Verification email error:", emailErr);
      res.json({ message: "Registered successfully. Verification email could not be sent; contact support to verify your account." });
    }

  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// ===================== VERIFY EMAIL =====================
router.get("/verify-email/:token", async (req, res) => {
  try {
    const { token } = req.params;

    const [rows] = await db.query(
      "SELECT * FROM users WHERE verification_token=? AND verification_expire > NOW()",
      [token]
    );

    if (!rows.length)
      return res.status(400).json({ message: "Invalid or expired token" });

    await db.query(
      "UPDATE users SET is_verified=1, verification_token=NULL, verification_expire=NULL WHERE id=?",
      [rows[0].id]
    );

    res.json({ message: "Email verified successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


// ===================== LOGIN =====================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "Missing fields" });

    const [rows] = await db.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (!rows.length)
      return res.status(400).json({ message: "Invalid credentials" });

    const user = rows[0];

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(400).json({ message: "Invalid credentials" });

    // BLOCK if not verified
    if (!user.is_verified)
      return res.status(403).json({ message: "Please verify your email first" });

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
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// ===================== FORGOT PASSWORD =====================
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email)
      return res.status(400).json({ message: "Email is required" });

    const [rows] = await db.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (!rows.length)
      return res.json({ message: "If account exists, email sent" });

    const user = rows[0];

    const token = crypto.randomBytes(32).toString("hex");
    const expire = new Date(Date.now() + 15 * 60 * 1000)
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");

    await db.query(
      "UPDATE users SET reset_token=?, reset_token_expire=? WHERE id=?",
      [token, expire, user.id]
    );

    const frontendUrl = getFrontendUrl(req);
    const link = `${frontendUrl}/reset-password/${token}`;

    await sendEmail(
      email,
      "Reset Password",
      `<h2>Reset Password</h2>
       <a href="${link}">Click here</a>`,
      [],
      `Reset your password by visiting: ${link}`
    );

    res.json({ message: "Reset link sent" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


// ===================== RESET PASSWORD =====================
router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword)
      return res.status(400).json({ message: "Missing fields" });

    const [rows] = await db.query(
      "SELECT * FROM users WHERE reset_token=? AND reset_token_expire > NOW()",
      [token]
    );

    if (!rows.length)
      return res.status(400).json({ message: "Invalid or expired token" });

    const hashed = await bcrypt.hash(newPassword, 10);

    await db.query(
      "UPDATE users SET password=?, reset_token=NULL, reset_token_expire=NULL WHERE id=?",
      [hashed, rows[0].id]
    );

    res.json({ message: "Password reset successful" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


// ===================== GOOGLE OAUTH =====================
router.post("/google-login", async (req, res) => {
  try {
    const { token: googleToken } = req.body;

    if (!googleToken)
      return res.status(400).json({ message: "Google token is required" });

    // Verify the Google token
    let decodedToken;
    try {
      const response = await fetch(
        `https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${googleToken}`
      );
      if (!response.ok) {
        throw new Error("Invalid Google token");
      }
      decodedToken = await response.json();
    } catch (err) {
      console.error("Google token verification error:", err);
      return res.status(401).json({ message: "Invalid Google token" });
    }

    const { email, name } = decodedToken;

    if (!email)
      return res.status(400).json({ message: "Unable to get email from Google" });

    // Check if user exists
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);

    let user;
    if (rows.length) {
      // User exists
      user = rows[0];
    } else {
      // Create new user (auto-verified for Google OAuth)
      const hash = await bcrypt.hash(crypto.randomBytes(16).toString("hex"), 10);
      await db.query(
        "INSERT INTO users (name, email, password, is_verified) VALUES (?, ?, ?, 1)",
        [name || email.split("@")[0], email, hash]
      );
      const [newUser] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
      user = newUser[0];
    }

    // Generate JWT token
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

    res.json({ token: jwtToken, user: publicUser(user) });

  } catch (err) {
    console.error("Google login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Exchange Google authorization code for tokens
router.post("/google-callback", async (req, res) => {
  try {
    const { code } = req.body;

    if (!code)
      return res.status(400).json({ error: "Authorization code is required" });

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${getFrontendUrl(req)}/auth/google-callback`;

    if (!clientId || !clientSecret) {
      console.error("Google OAuth credentials not configured");
      return res.status(500).json({ error: "Google OAuth not configured" });
    }

    // Exchange authorization code for tokens using form-encoded payload
    const tokenParams = new URLSearchParams();
    tokenParams.append("code", code);
    tokenParams.append("client_id", clientId);
    tokenParams.append("client_secret", clientSecret);
    tokenParams.append("redirect_uri", redirectUri);
    tokenParams.append("grant_type", "authorization_code");

    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: tokenParams.toString(),
    });

    const tokenText = await response.text();
    let tokenData;
    try {
      tokenData = JSON.parse(tokenText);
    } catch {
      tokenData = { raw: tokenText };
    }

    if (!response.ok) {
      console.error("Google token exchange error:", response.status, tokenData);
      return res.status(401).json({
        error: "Failed to exchange code for tokens",
        details: tokenData,
      });
    }

    // Ensure the ID token is present for verification
    const idToken = tokenData.id_token;
    if (!idToken) {
      console.error("Google token exchange response missing id_token:", tokenData);
      return res.status(401).json({
        error: "Failed to obtain ID token from Google",
        details: tokenData,
      });
    }

    // Verify ID token to get user info
    const tokenInfoResponse = await fetch(
      `https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${encodeURIComponent(idToken)}`
    );
    const tokenInfo = await tokenInfoResponse.json();

    if (!tokenInfoResponse.ok || !tokenInfo.email) {
      console.error("Google token info error:", tokenInfo);
      return res.status(401).json({ error: "Failed to get user info from Google" });
    }

    const { email, name } = tokenInfo;

    // Check if user exists
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);

    let user;
    if (rows.length) {
      user = rows[0];
    } else {
      // Create new user (auto-verified for Google OAuth)
      const hash = await bcrypt.hash(crypto.randomBytes(16).toString("hex"), 10);
      await db.query(
        "INSERT INTO users (name, email, password, is_verified) VALUES (?, ?, ?, 1)",
        [name || email.split("@")[0], email, hash]
      );
      const [newUser] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
      user = newUser[0];
    }

    // Generate JWT token
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

    res.json({ token: jwtToken, user: publicUser(user) });

  } catch (err) {
    console.error("Google callback error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
