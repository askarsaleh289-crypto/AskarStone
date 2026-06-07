import db from "../db.js";
import dotenv from "dotenv";

dotenv.config();

const migrations = [
  {
    name: "Add verify_token column",
    sql: `ALTER TABLE users ADD COLUMN verify_token VARCHAR(20) NULL`
  },
  {
    name: "Add verify_token_expiry column",
    sql: `ALTER TABLE users ADD COLUMN verify_token_expiry DATETIME NULL`
  },
  {
    name: "Add reset_token column",
    sql: `ALTER TABLE users ADD COLUMN reset_token VARCHAR(255) NULL`
  },
  {
    name: "Add reset_token_expiry column",
    sql: `ALTER TABLE users ADD COLUMN reset_token_expiry DATETIME NULL`
  },
  {
    name: "Add is_verified column",
    sql: `ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT 0`
  }
];

async function runMigrations() {
  try {
    console.log("Starting database migrations...");
    
    for (const migration of migrations) {
      try {
        console.log(`Running: ${migration.name}`);
        await db.query(migration.sql);
        console.log(`✓ ${migration.name}`);
      } catch (err) {
        // Column might already exist - check error message
        if (err.message.includes("Duplicate column")) {
          console.log(`⚠ ${migration.name} - Column already exists`);
        } else {
          throw err;
        }
      }
    }
    
    console.log("✓ All migrations completed");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

runMigrations();
