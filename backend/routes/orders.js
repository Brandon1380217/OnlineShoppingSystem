const express = require('express');
const { getDb } = require('../db/schema');
const { authenticate } = require('../middleware/auth');
const { createNotification, notifyBusinessUsersForProduct } = require('./notifications');

const router = express.Router();
router.use(authenticate);

function generateOrderNumber() {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 900000) + 100000;
  return `ORD-${year}-${random}`;
}

router.get('/', (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const db = getDb();
  try {
    let whereClause = 'WHERE o.user_id = ?';
    const params = [req.user.id];
    if (status) { whereClause += ' AND o.status = ?'; params.push(status); }

    const countRow = db.prepare(`SELECT COUNT(*) as total FROM orders o ${whereClause}`).get(...params);
    const orders = db.prepare(`SELECT o.* FROM orders o ${whereClause} ORDER BY o.created_at DESC LIMIT ? OFFSET ?`).all(...params, parseInt(limit), offset);

    const orderIds = orders.map(o => o.id);
    let allItems = [];
    if (orderIds.length > 0) {
      const placeholders = orderIds.map(() => '?').join(',');
      allItems = db.prepare(`SELECT oi.* FROM order_items oi WHERE oi.order_id IN (${placeholders})`).all(...orderIds);
    }

    res.json({
      orders: orders.map(o => ({ ...o, items: allItems.filter(i => i.order_id === o.id) })),
      pagination: { total: countRow.total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(countRow.total / parseInt(limit)) }
    });
  } finally { db.close(); }
});

router.get('/:id', (req, res) => {
  const db = getDb();
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
    const invoice = db.prepare('SELECT * FROM invoices WHERE order_id = ?').get(order.id);
    const returns = db.prepare('SELECT * FROM returns WHERE order_id = ?').all(order.id);

    res.json({ order, items, invoice, returns });
  } finally { db.close(); }
});

router.post('/checkout', (req, res) => {
  const {
    shipping_method = 'standard',
    shipping_address, shipping_city, shipping_state, shipping_zip, shipping_country = 'US',
    payment_method = 'credit_card'
  } = req.body;

  if (!shipping_address || !shipping_city || !shipping_state || !shipping_zip) {
    return res.status(400).json({ error: 'Shipping address is required' });
  }

  const db = getDb();
  try {
    const cartItems = db.prepare(`
      SELECT ci.*, p.name, p.price, p.image_url, p.stock_quantity, p.is_deal, p.deal_discount, p.created_by,
             pv.name as variant_name, pv.price as variant_price
      FROM cart_items ci JOIN products p ON ci.product_id = p.id
      LEFT JOIN product_variants pv ON ci.variant_id = pv.id WHERE ci.user_id = ?
    `).all(req.user.id);

    if (cartItems.length === 0) return res.status(400).json({ error: 'Cart is empty' });

    for (const item of cartItems) {
      if (item.quantity > item.stock_quantity) {
        return res.status(400).json({ error: `Insufficient stock for ${item.name}` });
      }
    }

    const subtotal = cartItems.reduce((sum, item) => {
      let price = item.variant_price || item.price;
      if (item.is_deal && item.deal_discount > 0) price = price * (1 - item.deal_discount / 100);
      return sum + price * item.quantity;
    }, 0);

    const shippingCosts = { standard: 5.99, express: 12.99, overnight: 24.99, free: 0 };
    const shipping_cost = subtotal >= 50 ? 0 : (shippingCosts[shipping_method] || 5.99);
    const tax = Math.round(subtotal * 0.08 * 100) / 100;
    const discount = cartItems.reduce((sum, item) => {
      if (item.is_deal && item.deal_discount > 0) {
        return sum + ((item.variant_price || item.price) * item.deal_discount / 100) * item.quantity;
      }
      return sum;
    }, 0);
    const total = Math.round((subtotal + shipping_cost + tax) * 100) / 100;
    const orderNumber = generateOrderNumber();

    const orderResult = db.prepare(`
      INSERT INTO orders (order_number, user_id, status, subtotal, shipping_cost, tax, discount, total,
        shipping_method, shipping_address, shipping_city, shipping_state, shipping_zip, shipping_country,
        payment_method, payment_status, channel)
      VALUES (?, ?, 'confirmed', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'paid', 'web')
    `).run(orderNumber, req.user.id, Math.round(subtotal * 100) / 100, shipping_cost, tax,
      Math.round(discount * 100) / 100, total, shipping_method,
      shipping_address, shipping_city, shipping_state, shipping_zip, shipping_country, payment_method);

    const orderId = orderResult.lastInsertRowid;
    const insertItem = db.prepare('INSERT INTO order_items (order_id, product_id, variant_id, product_name, product_image, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    const updateStock = db.prepare('UPDATE products SET stock_quantity = stock_quantity - ?, purchase_count = purchase_count + ? WHERE id = ?');

    const notifiedBusinesses = new Set();
    for (const item of cartItems) {
      let price = item.variant_price || item.price;
      if (item.is_deal && item.deal_discount > 0) price = price * (1 - item.deal_discount / 100);
      const productName = item.variant_name ? `${item.name} - ${item.variant_name}` : item.name;
      insertItem.run(orderId, item.product_id, item.variant_id, productName, item.image_url, item.quantity, Math.round(price * 100) / 100, Math.round(price * item.quantity * 100) / 100);
      updateStock.run(item.quantity, item.quantity, item.product_id);

      if (item.created_by && !notifiedBusinesses.has(item.created_by)) {
        createNotification(db, item.created_by, 'new_order', 'New Order Received',
          `New order ${orderNumber} - $${total.toFixed(2)}`, '/business');
        notifiedBusinesses.add(item.created_by);
      }

      const updatedProduct = db.prepare('SELECT stock_quantity, name, created_by FROM products WHERE id = ?').get(item.product_id);
      if (updatedProduct && updatedProduct.stock_quantity < 30 && updatedProduct.stock_quantity > 0 && updatedProduct.created_by) {
        createNotification(db, updatedProduct.created_by, 'low_stock', 'Low Stock Alert',
          `"${updatedProduct.name}" is running low (${updatedProduct.stock_quantity} left).`, '/business');
      }
    }

    const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 900000) + 100000}`;
    const dueDate = new Date(); dueDate.setDate(dueDate.getDate() + 30);
    db.prepare('INSERT INTO invoices (invoice_number, order_id, amount, status, due_date, paid_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)')
      .run(invoiceNumber, orderId, total, 'paid', dueDate.toISOString().split('T')[0]);

    db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(req.user.id);

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId);

    res.status(201).json({ order, items, message: 'Order placed successfully!' });
  } finally { db.close(); }
});

router.post('/:id/confirm-received', (req, res) => {
  const db = getDb();
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.status !== 'delivered') {
      return res.status(400).json({ error: 'Only delivered orders can be confirmed as received' });
    }

    db.prepare("UPDATE orders SET received_confirmed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(order.id);

    const orderItems = db.prepare('SELECT oi.product_id FROM order_items oi WHERE oi.order_id = ?').all(order.id);
    const notifiedBusinesses = new Set();
    for (const item of orderItems) {
      const product = db.prepare('SELECT created_by FROM products WHERE id = ?').get(item.product_id);
      if (product?.created_by && !notifiedBusinesses.has(product.created_by)) {
        createNotification(db, product.created_by, 'receive_confirmed', 'Delivery Confirmed',
          `Customer confirmed receipt of order ${order.order_number}.`, '/business');
        notifiedBusinesses.add(product.created_by);
      }
    }

    res.json({ message: 'Receive confirmed. Thank you!' });
  } finally { db.close(); }
});

router.post('/:id/cancel', (req, res) => {
  const db = getDb();
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({ error: 'Only pending or confirmed orders can be cancelled' });
    }

    db.prepare("UPDATE orders SET status = 'cancelled', payment_status = 'refunded', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(order.id);
    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
    const restoreStock = db.prepare('UPDATE products SET stock_quantity = stock_quantity + ?, purchase_count = purchase_count - ? WHERE id = ?');
    items.forEach(item => restoreStock.run(item.quantity, item.quantity, item.product_id));

    res.json({ message: 'Order cancelled successfully' });
  } finally { db.close(); }
});

router.post('/:id/return', (req, res) => {
  const { reason, items: returnItems } = req.body;
  const db = getDb();
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.status !== 'delivered') {
      return res.status(400).json({ error: 'Only delivered orders can be returned' });
    }

    const returnNumber = `RET-${new Date().getFullYear()}-${Math.floor(Math.random() * 900000) + 100000}`;
    const result = db.prepare(`
      INSERT INTO returns (return_number, order_id, user_id, status, reason, refund_amount)
      VALUES (?, ?, ?, 'requested', ?, ?)
    `).run(returnNumber, order.id, req.user.id, reason || 'No reason provided', order.total);

    const returnId = result.lastInsertRowid;
    const orderItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
    const insertReturnItem = db.prepare('INSERT INTO return_items (return_id, order_item_id, quantity, condition) VALUES (?, ?, ?, ?)');

    if (returnItems?.length > 0) {
      returnItems.forEach(ri => insertReturnItem.run(returnId, ri.order_item_id, ri.quantity, ri.condition || 'opened'));
    } else {
      orderItems.forEach(oi => insertReturnItem.run(returnId, oi.id, oi.quantity, 'opened'));
    }

    db.prepare("UPDATE orders SET status = 'returned', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(order.id);

    const notifiedBusinesses = new Set();
    for (const oi of orderItems) {
      const product = db.prepare('SELECT created_by FROM products WHERE id = ?').get(oi.product_id);
      if (product?.created_by && !notifiedBusinesses.has(product.created_by)) {
        createNotification(db, product.created_by, 'return_request', 'New Return Request',
          `Return request ${returnNumber} for order ${order.order_number}.`, '/business');
        notifiedBusinesses.add(product.created_by);
      }
    }

    res.status(201).json({ message: 'Return request submitted', return_number: returnNumber });
  } finally { db.close(); }
});

module.exports = router;
