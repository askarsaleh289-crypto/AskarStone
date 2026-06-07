import express from "express";
import db from "../db.js";
import { verifyToken, isAdmin } from "../middleware/auth.js";
import fs from "fs";
import path from "path";
import { generateInvoice } from "../utils/generateInvoice.js";
import sendEmail from "../utils/sendEmail.js";

const router = express.Router();
const DELIVERY_WINDOW = "2-5 business days after admin confirmation";

async function restoreOrderStock(conn, orderId) {
  const [items] = await conn.query(
    `SELECT variant_id, quantity
     FROM order_items
     WHERE order_id = ?`,
    [orderId]
  );

  for (const item of items) {
    await conn.query(
      `UPDATE product_variants
       SET quantity = quantity + ?
       WHERE id = ?`,
      [item.quantity, item.variant_id]
    );
  }
}

async function sendConfirmedOrderInvoice(orderId, transactionId) {
  const [[order]] = await db.query(
    "SELECT * FROM orders WHERE id = ?",
    [orderId]
  );

  if (!order) {
    throw new Error("Order not found");
  }

  const [items] = await db.query(`
    SELECT 
      p.name AS product_name,
      oi.quantity,
      oi.size,
      v.price
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    JOIN product_variants v ON oi.variant_id = v.id
    WHERE oi.order_id = ?
  `, [orderId]);

  const itemsHtml = items.map(i => `
    <tr>
      <td>${i.product_name}</td>
      <td>${i.size || "-"}</td>
      <td>${i.quantity}</td>
      <td>$${i.price}</td>
      <td>$${(i.price * i.quantity).toFixed(2)}</td>
    </tr>
  `).join("");

  const invoicesDir = path.join(process.cwd(), "invoices");
  if (!fs.existsSync(invoicesDir)) fs.mkdirSync(invoicesDir);

  const templatePath = path.join(invoicesDir, "invoice.html");
  let html = fs.readFileSync(templatePath, "utf8");
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const logoUrl = `${frontendUrl.replace(/\/+$/, "")}/assets/logo.png`;
  const signatureUrl = `${frontendUrl.replace(/\/+$/, "")}/assets/signature.png`;

  html = html
    .replace(/{{invoice}}/g, "INV-" + order.id)
    .replace(/{{date}}/g, new Date().toLocaleDateString())
    .replace(/{{name}}/g, order.customer_name)
    .replace(/{{email}}/g, order.customer_email)
    .replace(/{{phone}}/g, order.customer_phone)
    .replace(/{{address}}/g, order.customer_address)
    .replace(/{{total}}/g, order.total)
    .replace(/{{items}}/g, itemsHtml)
    .replace(/{{logo}}/g, logoUrl)
    .replace(/{{signature}}/g, signatureUrl);

  const pdfPath = path.join(invoicesDir, `invoice-${order.id}.pdf`);
  await generateInvoice(html, pdfPath);

  const emailHtml = `
    <div style="font-family:Arial, sans-serif;color:#222;">
      <div style="max-width:720px;margin:0 auto;padding:20px;">
        <div style="display:flex;align-items:center;gap:16px;margin-bottom:18px;">
          <img src="${logoUrl}" alt="Askar Stone" style="height:56px;object-fit:contain;border-radius:8px;" />
          <div>
            <h2 style="margin:0;color:#1f1f1f">Order Confirmed</h2>
            <p style="margin:0;color:#555">Thank you for your purchase. Below are your order details.</p>
          </div>
        </div>

        <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
          <thead>
            <tr>
              <th style="text-align:left;padding:8px 6px;border-bottom:1px solid #e6e6e6">Item</th>
              <th style="text-align:left;padding:8px 6px;border-bottom:1px solid #e6e6e6">Size</th>
              <th style="text-align:right;padding:8px 6px;border-bottom:1px solid #e6e6e6">Qty</th>
              <th style="text-align:right;padding:8px 6px;border-bottom:1px solid #e6e6e6">Unit</th>
              <th style="text-align:right;padding:8px 6px;border-bottom:1px solid #e6e6e6">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <p style="font-weight:700">Order total: $${order.total}</p>
        <p style="margin:6px 0"><strong>Confirmation reference:</strong> ${transactionId}</p>
        <p style="margin:6px 0"><strong>Estimated delivery:</strong> ${DELIVERY_WINDOW}</p>

        <p style="color:#666">If you have any questions, reply to this email or contact our support team.</p>

        <div style="margin-top:22px;display:flex;align-items:center;gap:12px">
          <img src="${signatureUrl}" alt="Signature" style="height:48px;object-fit:contain;border-radius:6px;" />
          <div style="font-size:14px;color:#333">
            <div style="font-weight:700">Askar Stone</div>
            <div style="color:#666">Quality Stone Materials • sales@askarstone.com</div>
          </div>
        </div>
      </div>
    </div>
  `;

  await sendEmail(
    order.customer_email,
    `Your order is confirmed - Askar Stone (INV-${order.id})`,
    emailHtml,
    [
      {
        filename: `invoice-${order.id}.pdf`,
        content: fs.readFileSync(pdfPath),
        contentType: "application/pdf"
      }
    ]
  );
}

router.post("/", verifyToken, async (req, res) => {
  const conn = await db.getConnection();

  try {
    const { cart, total, phone, address } = req.body;
    if (!cart || !cart.length) {
      return res.status(400).json({ message: "Cart empty" });
    }

    const [[user]] = await conn.query(
      "SELECT name, email FROM users WHERE id = ?",
      [req.user.id]
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await conn.beginTransaction();

    for (const item of cart) {
      const [[variant]] = await conn.query(
        "SELECT quantity FROM product_variants WHERE id = ? FOR UPDATE",
        [item.variantId]
      );

      if (!variant) throw new Error("Variant not found");
      if (variant.quantity < (item.quantity || 1)) {
        throw new Error("Not enough stock");
      }
    }

    const [result] = await conn.query(
      `INSERT INTO orders
       (user_id, customer_name, customer_email, customer_phone, customer_address, total, status)
       VALUES (?,?,?,?,?, ?, 'pending')`,
      [
        req.user.id,
        user.name,
        user.email,
        phone,
        address,
        total
      ]
    );

    const orderId = result.insertId;

    for (const item of cart) {
      const qty = item.quantity || 1;

      await conn.query(
        `INSERT INTO order_items
         (order_id, product_id, variant_id, quantity, size)
         VALUES (?,?,?,?,?)`,
        [
          orderId,
          item.productId,
          item.variantId,
          qty,
          item.size || null
        ]
      );

      await conn.query(
        `UPDATE product_variants
         SET quantity = quantity - ?
         WHERE id = ?`,
        [qty, item.variantId]
      );
    }

    await conn.commit();
    res.json({
      message: "Order request submitted. Waiting for admin confirmation.",
      orderId,
      estimatedDelivery: DELIVERY_WINDOW
    });
  } catch (err) {
    await conn.rollback();
    console.error("Create order error:", err);
    res.status(400).json({ message: err.message });
  } finally {
    conn.release();
  }
});

router.get("/", verifyToken, isAdmin, async (req, res) => {
  try {
    const [orders] = await db.query(`
      SELECT *
      FROM orders
      ORDER BY created_at DESC
    `);

    for (const o of orders) {
      const [items] = await db.query(`
        SELECT 
          oi.quantity,
          oi.size,
          p.name AS product_name,
          v.price,
          v.image
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        JOIN product_variants v ON oi.variant_id = v.id
        WHERE oi.order_id = ?
      `, [o.id]);

      o.items = items;
      o.estimatedDelivery = DELIVERY_WINDOW;
    }

    res.json(orders);
  } catch (err) {
    console.error("Get orders error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/:id/confirm", verifyToken, isAdmin, async (req, res) => {
  try {
    const orderId = req.params.id;
    const trx = "CONF-" + Date.now();
    const [[order]] = await db.query(
      "SELECT status FROM orders WHERE id=?",
      [orderId]
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status !== "pending") {
      return res.status(400).json({ message: "Only pending orders can be confirmed" });
    }

    await db.query(
      "UPDATE orders SET status='confirmed', transaction_id=? WHERE id=?",
      [trx, orderId]
    );
    await sendConfirmedOrderInvoice(orderId, trx);

    res.json({
      message: "Order confirmed",
      transaction_id: trx,
      estimatedDelivery: DELIVERY_WINDOW
    });
  } catch (err) {
    console.error("Confirm order error:", err);
    res.status(500).json({ message: err.message });
  }
});

router.post("/:id/cancel", verifyToken, isAdmin, async (req, res) => {
  const conn = await db.getConnection();

  try {
    const orderId = req.params.id;
    await conn.beginTransaction();

    const [[order]] = await conn.query(
      "SELECT status FROM orders WHERE id = ? FOR UPDATE",
      [orderId]
    );

    if (!order) {
      await conn.rollback();
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status !== "pending") {
      await conn.rollback();
      return res.status(400).json({ message: "Only pending orders can be cancelled" });
    }

    await restoreOrderStock(conn, orderId);
    await conn.query(
      "UPDATE orders SET status='cancelled' WHERE id=?",
      [orderId]
    );

    await conn.commit();
    res.json({ message: "Order cancelled and stock restored" });
  } catch (err) {
    await conn.rollback();
    console.error("Cancel order error:", err);
    res.status(500).json({ message: err.message });
  } finally {
    conn.release();
  }
});

router.delete("/:id", verifyToken, isAdmin, async (req, res) => {
  const conn = await db.getConnection();

  try {
    const orderId = req.params.id;

    await conn.beginTransaction();
    await conn.query(
      "DELETE FROM order_items WHERE order_id = ?",
      [orderId]
    );
    await conn.query(
      "DELETE FROM orders WHERE id = ?",
      [orderId]
    );
    await conn.commit();

    res.json({ message: "Order deleted successfully" });
  } catch (err) {
    await conn.rollback();
    console.error("Delete order error:", err);
    res.status(500).json({ message: err.message });
  } finally {
    conn.release();
  }
});

router.get("/:id/status", verifyToken, async (req, res) => {
  try {
    const orderId = req.params.id;
    const [[order]] = await db.query(
      "SELECT status, transaction_id FROM orders WHERE id = ?",
      [orderId]
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({
      status: order.status,
      transaction_id: order.transaction_id,
      estimatedDelivery: DELIVERY_WINDOW
    });
  } catch (err) {
    console.error("Order status error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/:id/expire", verifyToken, async (req, res) => {
  const conn = await db.getConnection();

  try {
    const orderId = req.params.id;
    await conn.beginTransaction();

    const [[order]] = await conn.query(
      "SELECT status FROM orders WHERE id = ? FOR UPDATE",
      [orderId]
    );

    if (!order) {
      await conn.rollback();
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status !== "pending") {
      await conn.rollback();
      return res.json({ message: "Order already finalized" });
    }

    await restoreOrderStock(conn, orderId);
    await conn.query(
      "UPDATE orders SET status='expired' WHERE id=?",
      [orderId]
    );

    await conn.commit();
    res.json({ message: "Order expired and stock restored" });
  } catch (err) {
    await conn.rollback();
    console.error("Expire order error:", err);
    res.status(500).json({ message: "Server error" });
  } finally {
    conn.release();
  }
});

export default router;
