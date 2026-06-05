import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import db from "../db.js";
import { verifyToken, isAdmin } from "../middleware/auth.js";

const router = express.Router();


const UPLOAD_DIR = path.join(process.cwd(), "uploads", "products");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "_")),
});

const upload = multer({ storage });


router.get("/", async (req, res) => {
  try {
    const [products] = await db.query(
      "SELECT * FROM products ORDER BY id DESC"
    );

    for (let p of products) {
      const [variants] = await db.query(
        "SELECT * FROM product_variants WHERE product_id = ?",
        [p.id]
      );

      p.variants = variants.map(v => ({
        ...v,
        imageUrl: v.image
          ? `http://localhost:5000/uploads/products/${v.image}`
          : null,
      }));
    }

    res.json(products);
  } catch (err) {
    console.error("Get products error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


router.get("/:id", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM products WHERE id = ?",
      [req.params.id]
    );

    if (!rows.length)
      return res.status(404).json({ message: "Product not found" });

    const product = rows[0];

    const [variants] = await db.query(
      "SELECT * FROM product_variants WHERE product_id = ?",
      [product.id]
    );

    product.variants = variants.map(v => ({
      ...v,
      imageUrl: v.image
        ? `http://localhost:5000/uploads/products/${v.image}`
        : null,
    }));

    res.json(product);
  } catch (err) {
    console.error("Get product error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


router.post(
  "/",
  verifyToken,
  isAdmin,
  upload.any(), 
  async (req, res) => {
    try {
      const { name, description, variants } = req.body;

      if (!name) {
        return res.status(400).json({ message: "Missing product name" });
      }

      const [result] = await db.query(
        "INSERT INTO products (name, description) VALUES (?, ?)",
        [name, description || null]
      );

      const productId = result.insertId;
      const parsed = variants ? JSON.parse(variants) : [];

      const filesMap = new Map(
        (req.files || []).map(f => [f.fieldname, f.filename])
      );

      for (let v of parsed) {
        const image = v.imageKey
          ? filesMap.get(v.imageKey) || null
          : null;

        const qty = parseInt(v.quantity, 10) || 0;

        await db.query(
          `INSERT INTO product_variants
           (product_id, size, price, image, quantity)
           VALUES (?,?,?,?,?)`,
          [productId, v.size, v.price, image, qty]
        );
      }

      res.json({ message: "✅ Product created successfully" });
    } catch (err) {
      console.error("Create product error:", err);
      res.status(500).json({ message: err.message });
    }
  }
);


router.put(
  "/:id",
  verifyToken,
  isAdmin,
  upload.any(),
  async (req, res) => {
    try {
      const { name, description, variants } = req.body;
      const productId = req.params.id;

      await db.query(
        "UPDATE products SET name=?, description=? WHERE id=?",
        [name, description || null, productId]
      );

      const parsed = variants ? JSON.parse(variants) : [];

      const filesMap = new Map(
        (req.files || []).map(f => [f.fieldname, f.filename])
      );

      for (let v of parsed) {
        const imageFilename = v.imageKey
          ? filesMap.get(v.imageKey) || null
          : null;

        const qty = parseInt(v.quantity, 10) || 0;

        if (v.id) {
          if (imageFilename) {
            await db.query(
              `UPDATE product_variants
               SET size=?, price=?, image=?, quantity=?
               WHERE id=? AND product_id=?`,
              [v.size, v.price, imageFilename, qty, v.id, productId]
            );
          } else {
            await db.query(
              `UPDATE product_variants
               SET size=?, price=?, quantity=?
               WHERE id=? AND product_id=?`,
              [v.size, v.price, qty, v.id, productId]
            );
          }
        } else {
          await db.query(
            `INSERT INTO product_variants
             (product_id, size, price, image, quantity)
             VALUES (?,?,?,?,?)`,
            [productId, v.size, v.price, imageFilename, qty]
          );
        }
      }

      res.json({ message: "✅ Product updated successfully" });
    } catch (err) {
      console.error("Update product error:", err);
      res.status(500).json({ message: err.message });
    }
  }
);


router.delete("/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    await db.query("DELETE FROM products WHERE id = ?", [req.params.id]);
    res.json({ message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.delete(
  "/variant/:variantId",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      await db.query(
        "DELETE FROM product_variants WHERE id = ?",
        [req.params.variantId]
      );
      res.json({ message: "Variant deleted" });
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  }
);

export default router;
