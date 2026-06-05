import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const db = await mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
});

try {
  await db.query("SELECT 1");
  console.log("✅ MySQL Connected");
} catch (err) {
  console.error("❌ DB Connection Error:", err.message);
}

export default db;
