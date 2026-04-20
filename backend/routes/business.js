const express = require('express');
const { getDb } = require('../db/schema');
const { authenticate, requireRole } = require('../middleware/auth');
const { createNotification } = require('./notifications');

const router = express.Router();
router.use(authenticate);
router.use(requireRole('business', 'admin'));

function ownershipFilter(req) {
  if (req.user.role === 'admin') return { condition: '', params: [] };
  return { condition: 'AND p_owner.created_by = ?', params: [req.user.id] };
}

router.get('/orders', (req, res) => {
  const { page = 1, limit = 20, status, channel, search, date_from, date_to } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const db = getDb();
  try {
    const conditions = [];
    const params = [];

    if (req.user.role !== 'admin') {
      conditions.push(`o.id IN (SELECT DISTINCT oi2.order_id FROM order_items oi2 JOIN products p2 ON oi2.product_id = p2.id WHERE p2.created_by = ?)`);
      params.push(req.user.id);
    }

    if (status) { conditions.push('o.status = ?'); params.push(status); }
    if (channel) { conditions.push('o.channel = ?'); params.push(channel); }
    if (search) {
      conditions.push('(o.order_number LIKE ? OR u.email LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ?)');
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }
    if (date_from) { conditions.push('o.created_at >= ?'); params.push(date_from); }
    if (date_to) { conditions.push('o.created_at <= ?'); params.push(date_to + ' 23:59:59'); }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRow = db.prepare(`
      SELECT COUNT(*) as total FROM orders o JOIN users u ON o.user_id = u.id ${whereClause}
    `).get(...params);

    const orders = db.prepare(`
      SELECT o.*, u.email as customer_email, u.first_name as customer_first_name,
             u.last_name as customer_last_name, u.phone as customer_phone
      FROM orders o JOIN users u ON o.user_id = u.id
      ${whereClause}
      ORDER BY o.created_at DESC LIMIT ? OFFSET ?
    `).all(...params, parseInt(limit), offset);

    const orderIds = orders.map(o => o.id);
    let allItems = [];
    if (orderIds.length > 0) {
      const placeholders = orderIds.map(() => '?').join(',');
      allItems = db.prepare(`SELECT * FROM order_items WHERE order_id IN (${placeholders})`).all(...orderIds);
    }

    res.json({
      orders: orders.map(o => ({ ...o, items: allItems.filter(i => i.order_id === o.id) })),
      pagination: { total: countRow.total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(countRow.total / parseInt(limit)) }
    });
  } finally { db.close(); }
});

router.get('/orders/:id', (req, res) => {
  const db = getDb();
  try {
    const order = db.prepare(`
      SELECT o.*, u.email as customer_email, u.first_name as customer_first_name,
             u.last_name as customer_last_name, u.phone as customer_phone, u.address as customer_address
      FROM orders o JOIN users u ON o.user_id = u.id WHERE o.id = ?
    `).get(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (req.user.role !== 'admin') {
      const hasOwnProduct = db.prepare(
        'SELECT 1 FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ? AND p.created_by = ?'
      ).get(order.id, req.user.id);
      if (!hasOwnProduct) return res.status(403).json({ error: 'Access denied' });
    }

    const items = db.prepare(`
      SELECT oi.*, p.stock_quantity as current_stock, p.status as product_status
      FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?
    `).all(order.id);
    const invoice = db.prepare('SELECT * FROM invoices WHERE order_id = ?').get(order.id);
    const returns = db.prepare('SELECT * FROM returns WHERE order_id = ?').all(order.id);

    const validation = {
      has_valid_address: !!(order.shipping_address && order.shipping_city && order.shipping_state && order.shipping_zip),
      has_valid_payment: order.payment_status === 'paid',
      all_items_in_stock: items.every(i => i.current_stock >= 0),
      all_items_active: items.every(i => i.product_status === 'active')
    };

    res.json({ order, items, invoice, returns, validation });
  } finally { db.close(); }
});

router.put('/orders/:id/status', (req, res) => {
  const { status, tracking_number, notes } = req.body;
  const validStatuses = ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status' });

  const db = getDb();
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (req.user.role !== 'admin') {
      const hasOwn = db.prepare('SELECT 1 FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ? AND p.created_by = ?').get(order.id, req.user.id);
      if (!hasOwn) return res.status(403).json({ error: 'Access denied' });
    }

    const updates = ['status = ?', 'updated_at = CURRENT_TIMESTAMP'];
    const updateParams = [status];
    if (tracking_number) { updates.push('tracking_number = ?'); updateParams.push(tracking_number); }
    if (notes) { updates.push('notes = ?'); updateParams.push(notes); }
    if (status === 'shipped') updates.push('shipped_at = CURRENT_TIMESTAMP');
    if (status === 'delivered') updates.push('delivered_at = CURRENT_TIMESTAMP');

    updateParams.push(req.params.id);
    db.prepare(`UPDATE orders SET ${updates.join(', ')} WHERE id = ?`).run(...updateParams);

    createNotification(db, order.user_id, 'order_status', 'Order Status Updated',
      `Your order ${order.order_number} status changed to ${status.replace(/_/g, ' ')}.`, '/orders');

    const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    res.json({ order: updated, message: `Order status updated to ${status}` });
  } finally { db.close(); }
});

router.post('/orders/batch-status', (req, res) => {
  const { order_ids, status, tracking_prefix } = req.body;
  if (!order_ids?.length || !status) return res.status(400).json({ error: 'Order IDs and status are required' });

  const db = getDb();
  try {
    let updated = 0;
    const updateStmt = db.prepare(`
      UPDATE orders SET status = ?, tracking_number = COALESCE(?, tracking_number),
        shipped_at = CASE WHEN ? = 'shipped' THEN CURRENT_TIMESTAMP ELSE shipped_at END,
        delivered_at = CASE WHEN ? = 'delivered' THEN CURRENT_TIMESTAMP ELSE delivered_at END,
        updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `);

    order_ids.forEach((id, idx) => {
      const tracking = tracking_prefix ? `${tracking_prefix}-${String(idx + 1).padStart(4, '0')}` : null;
      const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
      if (order) {
        updateStmt.run(status, tracking, status, status, id);
        updated++;
        createNotification(db, order.user_id, 'order_status', 'Order Status Updated',
          `Your order ${order.order_number} status changed to ${status.replace(/_/g, ' ')}.`, '/orders');
      }
    });

    res.json({ message: `${updated} orders updated to ${status}` });
  } finally { db.close(); }
});

router.get('/invoices', (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const db = getDb();
  try {
    const conditions = [];
    const params = [];

    if (req.user.role !== 'admin') {
      conditions.push(`o.id IN (SELECT DISTINCT oi2.order_id FROM order_items oi2 JOIN products p2 ON oi2.product_id = p2.id WHERE p2.created_by = ?)`);
      params.push(req.user.id);
    }
    if (status) { conditions.push('i.status = ?'); params.push(status); }
    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const total = db.prepare(`SELECT COUNT(*) as total FROM invoices i JOIN orders o ON i.order_id = o.id ${whereClause}`).get(...params).total;
    const invoices = db.prepare(`
      SELECT i.*, o.order_number, o.user_id, u.email as customer_email,
             u.first_name as customer_first_name, u.last_name as customer_last_name
      FROM invoices i JOIN orders o ON i.order_id = o.id JOIN users u ON o.user_id = u.id
      ${whereClause} ORDER BY i.created_at DESC LIMIT ? OFFSET ?
    `).all(...params, parseInt(limit), offset);

    res.json({ invoices, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) } });
  } finally { db.close(); }
});

router.get('/returns', (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const db = getDb();
  try {
    const conditions = [];
    const params = [];

    if (req.user.role !== 'admin') {
      conditions.push(`r.order_id IN (SELECT DISTINCT oi2.order_id FROM order_items oi2 JOIN products p2 ON oi2.product_id = p2.id WHERE p2.created_by = ?)`);
      params.push(req.user.id);
    }
    if (status) { conditions.push('r.status = ?'); params.push(status); }
    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const total = db.prepare(`SELECT COUNT(*) as total FROM returns r ${whereClause}`).get(...params).total;
    const returns = db.prepare(`
      SELECT r.*, o.order_number, u.email as customer_email,
             u.first_name as customer_first_name, u.last_name as customer_last_name
      FROM returns r JOIN orders o ON r.order_id = o.id JOIN users u ON r.user_id = u.id
      ${whereClause} ORDER BY r.created_at DESC LIMIT ? OFFSET ?
    `).all(...params, parseInt(limit), offset);

    for (const ret of returns) {
      ret.items = db.prepare(`
        SELECT ri.*, oi.product_name, oi.product_image, oi.unit_price
        FROM return_items ri JOIN order_items oi ON ri.order_item_id = oi.id WHERE ri.return_id = ?
      `).all(ret.id);
    }

    res.json({ returns, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) } });
  } finally { db.close(); }
});

router.put('/returns/:id/status', (req, res) => {
  const { status, notes } = req.body;
  const validStatuses = ['approved', 'received', 'inspected', 'refunded', 'rejected'];
  if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid return status' });

  const db = getDb();
  try {
    const ret = db.prepare('SELECT * FROM returns WHERE id = ?').get(req.params.id);
    if (!ret) return res.status(404).json({ error: 'Return not found' });

    db.prepare('UPDATE returns SET status = ?, notes = COALESCE(?, notes), updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(status, notes || null, req.params.id);

    if (status === 'refunded') {
      db.prepare("UPDATE orders SET payment_status = 'refunded', status = 'refunded', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(ret.order_id);
      db.prepare("UPDATE invoices SET status = 'cancelled' WHERE order_id = ?").run(ret.order_id);
    }

    createNotification(db, ret.user_id, 'return_status', 'Return Status Updated',
      `Your return ${ret.return_number} status changed to ${status}.`, '/orders');

    res.json({ message: `Return status updated to ${status}` });
  } finally { db.close(); }
});

router.get('/analytics/overview', (req, res) => {
  const db = getDb();
  try {
    const isAdmin = req.user.role === 'admin';
    const productFilter = isAdmin ? '' : "AND o.id IN (SELECT DISTINCT oi2.order_id FROM order_items oi2 JOIN products p2 ON oi2.product_id = p2.id WHERE p2.created_by = " + req.user.id + ")";
    const productCountFilter = isAdmin ? "WHERE status = 'active'" : `WHERE status = 'active' AND created_by = ${req.user.id}`;

    const totalOrders = db.prepare(`SELECT COUNT(*) as count FROM orders o WHERE 1=1 ${productFilter}`).get().count;
    const totalRevenue = db.prepare(`SELECT COALESCE(SUM(total), 0) as sum FROM orders o WHERE payment_status = 'paid' ${productFilter}`).get().sum;
    const totalCustomers = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'customer'").get().count;
    const totalProducts = db.prepare(`SELECT COUNT(*) as count FROM products ${productCountFilter}`).get().count;
    const pendingOrders = db.prepare(`SELECT COUNT(*) as count FROM orders o WHERE status IN ('pending', 'confirmed', 'processing') ${productFilter}`).get().count;
    const pendingReturns = db.prepare(`SELECT COUNT(*) as count FROM returns r WHERE status IN ('requested', 'approved') ${isAdmin ? '' : `AND r.order_id IN (SELECT DISTINCT oi2.order_id FROM order_items oi2 JOIN products p2 ON oi2.product_id = p2.id WHERE p2.created_by = ${req.user.id})`}`).get().count;
    const avgOrderValue = db.prepare(`SELECT COALESCE(AVG(total), 0) as avg FROM orders o WHERE payment_status = 'paid' ${productFilter}`).get().avg;

    const lowStockProducts = db.prepare(`SELECT COUNT(*) as count FROM products ${productCountFilter} AND stock_quantity < 30 AND stock_quantity > 0`).get().count;

    res.json({
      total_orders: totalOrders,
      total_revenue: Math.round(totalRevenue * 100) / 100,
      total_customers: totalCustomers,
      total_products: totalProducts,
      pending_orders: pendingOrders,
      pending_returns: pendingReturns,
      avg_order_value: Math.round(avgOrderValue * 100) / 100,
      low_stock_products: lowStockProducts
    });
  } finally { db.close(); }
});

router.get('/analytics/sales', (req, res) => {
  const { period = '30' } = req.query;
  const db = getDb();
  try {
    const days = parseInt(period);
    const isAdmin = req.user.role === 'admin';
    const productFilter = isAdmin ? '' : `AND oi.product_id IN (SELECT id FROM products WHERE created_by = ${req.user.id})`;
    const orderFilter = isAdmin ? '' : `AND o.id IN (SELECT DISTINCT oi2.order_id FROM order_items oi2 JOIN products p2 ON oi2.product_id = p2.id WHERE p2.created_by = ${req.user.id})`;

    const salesByDay = db.prepare(`
      SELECT DATE(created_at) as date, COUNT(*) as order_count, SUM(total) as revenue, SUM(discount) as total_discounts
      FROM orders o WHERE created_at >= datetime('now', '-${days} days') AND payment_status = 'paid' ${orderFilter}
      GROUP BY DATE(created_at) ORDER BY date ASC
    `).all();

    const topProducts = db.prepare(`
      SELECT oi.product_name, SUM(oi.quantity) as total_sold, SUM(oi.total_price) as total_revenue
      FROM order_items oi JOIN orders o ON oi.order_id = o.id
      WHERE o.created_at >= datetime('now', '-${days} days') AND o.payment_status = 'paid' ${productFilter}
      GROUP BY oi.product_id ORDER BY total_revenue DESC LIMIT 10
    `).all();

    const ordersByStatus = db.prepare(`SELECT status, COUNT(*) as count FROM orders o WHERE 1=1 ${orderFilter} GROUP BY status`).all();
    const ordersByChannel = db.prepare(`SELECT channel, COUNT(*) as count, SUM(total) as revenue FROM orders o WHERE payment_status = 'paid' ${orderFilter} GROUP BY channel`).all();

    const revenueByCategory = db.prepare(`
      SELECT c.name as category, SUM(oi.total_price) as revenue, SUM(oi.quantity) as units_sold
      FROM order_items oi JOIN orders o ON oi.order_id = o.id JOIN products p ON oi.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE o.payment_status = 'paid' ${productFilter}
      GROUP BY c.id ORDER BY revenue DESC
    `).all();

    res.json({ sales_by_day: salesByDay, top_products: topProducts, orders_by_status: ordersByStatus, orders_by_channel: ordersByChannel, revenue_by_category: revenueByCategory });
  } finally { db.close(); }
});

router.get('/products', (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const db = getDb();
  try {
    const isAdmin = req.user.role === 'admin';
    const whereClause = isAdmin ? '' : 'WHERE p.created_by = ?';
    const params = isAdmin ? [] : [req.user.id];

    const total = db.prepare(`SELECT COUNT(*) as total FROM products p ${whereClause}`).get(...params).total;
    const products = db.prepare(`
      SELECT p.*, c.name as category_name, b.name as brand_name
      FROM products p LEFT JOIN categories c ON p.category_id = c.id LEFT JOIN brands b ON p.brand_id = b.id
      ${whereClause} ORDER BY p.created_at DESC LIMIT ? OFFSET ?
    `).all(...params, parseInt(limit), offset);

    res.json({ products, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) } });
  } finally { db.close(); }
});

router.put('/products/:id', (req, res) => {
  const { name, description, price, compare_at_price, stock_quantity, status, is_deal, deal_discount, image_url, images } = req.body;
  const db = getDb();
  try {
    const whereClause = req.user.role === 'admin' ? 'WHERE id = ?' : 'WHERE id = ? AND created_by = ?';
    const whereParams = req.user.role === 'admin' ? [req.params.id] : [req.params.id, req.user.id];
    const product = db.prepare(`SELECT * FROM products ${whereClause}`).get(...whereParams);
    if (!product) return res.status(404).json({ error: 'Product not found or access denied' });

    const oldPrice = product.price;
    const oldDiscount = product.deal_discount;

    let imagesJson = null;
    if (images !== undefined) {
      imagesJson = Array.isArray(images) ? JSON.stringify(images) : images;
    } else if (image_url && image_url !== product.image_url) {
      // Primary image changed but caller didn't send a full gallery update.
      // Keep the gallery in sync so product detail reflects the new photo.
      let existing = [];
      try { existing = product.images ? JSON.parse(product.images) : []; } catch { existing = []; }
      const nextList = [image_url, ...existing.filter(u => u && u !== product.image_url && u !== image_url)];
      imagesJson = JSON.stringify(nextList);
    }

    db.prepare(`
      UPDATE products SET name = COALESCE(?, name), description = COALESCE(?, description),
        price = COALESCE(?, price), compare_at_price = COALESCE(?, compare_at_price),
        stock_quantity = COALESCE(?, stock_quantity), status = COALESCE(?, status),
        is_deal = COALESCE(?, is_deal), deal_discount = COALESCE(?, deal_discount),
        image_url = COALESCE(?, image_url), images = COALESCE(?, images),
        updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(name, description, price, compare_at_price, stock_quantity, status, is_deal, deal_discount, image_url || null, imagesJson, req.params.id);

    const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);

    const newEffective = updated.is_deal && updated.deal_discount > 0 ? updated.price * (1 - updated.deal_discount / 100) : updated.price;
    const oldEffective = product.is_deal && oldDiscount > 0 ? oldPrice * (1 - oldDiscount / 100) : oldPrice;
    if (newEffective < oldEffective) {
      const cartUsers = db.prepare('SELECT DISTINCT user_id FROM cart_items WHERE product_id = ?').all(product.id);
      for (const cu of cartUsers) {
        createNotification(db, cu.user_id, 'price_drop', 'Price Drop!',
          `"${updated.name}" in your cart dropped from $${oldEffective.toFixed(2)} to $${newEffective.toFixed(2)}!`, `/products/${updated.slug}`);
      }
    }

    if (updated.stock_quantity < 30 && updated.stock_quantity > 0 && product.stock_quantity >= 30) {
      createNotification(db, product.created_by, 'low_stock', 'Low Stock Alert',
        `"${updated.name}" is running low (${updated.stock_quantity} left).`, '/business');
    }

    res.json(updated);
  } finally { db.close(); }
});

router.delete('/products/:id', (req, res) => {
  const db = getDb();
  try {
    const whereClause = req.user.role === 'admin' ? 'WHERE id = ?' : 'WHERE id = ? AND created_by = ?';
    const whereParams = req.user.role === 'admin' ? [req.params.id] : [req.params.id, req.user.id];
    const product = db.prepare(`SELECT * FROM products ${whereClause}`).get(...whereParams);
    if (!product) return res.status(404).json({ error: 'Product not found or access denied' });

    db.prepare("UPDATE products SET status = 'archived', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(req.params.id);
    res.json({ message: 'Product removed successfully' });
  } finally { db.close(); }
});

router.post('/products/:id/restore', (req, res) => {
  const db = getDb();
  try {
    const whereClause = req.user.role === 'admin' ? 'WHERE id = ?' : 'WHERE id = ? AND created_by = ?';
    const whereParams = req.user.role === 'admin' ? [req.params.id] : [req.params.id, req.user.id];
    const product = db.prepare(`SELECT * FROM products ${whereClause}`).get(...whereParams);
    if (!product) return res.status(404).json({ error: 'Product not found or access denied' });
    if (product.status !== 'archived') {
      return res.status(400).json({ error: 'Only archived products can be restored' });
    }

    db.prepare("UPDATE products SET status = 'active', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(req.params.id);
    res.json({ message: 'Product restored to active listings' });
  } finally { db.close(); }
});

router.delete('/products/:id/permanent', (req, res) => {
  const db = getDb();
  try {
    const whereClause = req.user.role === 'admin' ? 'WHERE id = ?' : 'WHERE id = ? AND created_by = ?';
    const whereParams = req.user.role === 'admin' ? [req.params.id] : [req.params.id, req.user.id];
    const product = db.prepare(`SELECT * FROM products ${whereClause}`).get(...whereParams);
    if (!product) return res.status(404).json({ error: 'Product not found or access denied' });
    if (product.status !== 'archived') {
      return res.status(400).json({ error: 'Only archived products can be permanently deleted. Archive it first.' });
    }

    const orderCount = db.prepare('SELECT COUNT(*) as c FROM order_items WHERE product_id = ?').get(req.params.id).c;
    if (orderCount > 0) {
      db.prepare("UPDATE products SET status = 'archived' WHERE id = ?").run(req.params.id);
      db.prepare('DELETE FROM cart_items WHERE product_id = ?').run(req.params.id);
      db.prepare('DELETE FROM reviews WHERE product_id = ?').run(req.params.id);
      db.prepare('DELETE FROM product_variants WHERE product_id = ?').run(req.params.id);
      return res.json({ message: 'Product retained as archived because it has order history. Related data cleared.' });
    }

    db.prepare('DELETE FROM cart_items WHERE product_id = ?').run(req.params.id);
    db.prepare('DELETE FROM reviews WHERE product_id = ?').run(req.params.id);
    db.prepare('DELETE FROM product_variants WHERE product_id = ?').run(req.params.id);
    db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
    res.json({ message: 'Product permanently deleted' });
  } finally { db.close(); }
});

function generateSlug(name) {
  const base = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${base}-${suffix}`;
}

function generateSku(prefix = 'NEW') {
  return `${prefix.toUpperCase()}-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 900) + 100}`;
}

router.post('/products', (req, res) => {
  const {
    name, description, price, compare_at_price, stock_quantity = 0,
    category_id, brand_id, image_url, images,
    is_deal = 0, deal_discount = 0, release_date, sku
  } = req.body;

  if (!name || price === undefined || price === null || price < 0) {
    return res.status(400).json({ error: 'Name and a valid price are required' });
  }

  const db = getDb();
  try {
    let slug = generateSlug(name);
    while (db.prepare('SELECT 1 FROM products WHERE slug = ?').get(slug)) {
      slug = generateSlug(name);
    }

    let finalSku = sku || generateSku('PRD');
    while (db.prepare('SELECT 1 FROM products WHERE sku = ?').get(finalSku)) {
      finalSku = generateSku('PRD');
    }

    const imagesJson = images
      ? (Array.isArray(images) ? JSON.stringify(images.filter(Boolean)) : images)
      : (image_url ? JSON.stringify([image_url]) : null);

    const createdBy = req.user.role === 'admin' && req.body.created_by
      ? parseInt(req.body.created_by)
      : req.user.id;

    const result = db.prepare(`
      INSERT INTO products (
        name, slug, description, price, compare_at_price, sku, stock_quantity,
        category_id, brand_id, image_url, images,
        is_deal, deal_discount, release_date, status, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)
    `).run(
      name, slug, description || null, price, compare_at_price || null,
      finalSku, stock_quantity, category_id || null, brand_id || null,
      image_url || null, imagesJson, is_deal ? 1 : 0, deal_discount || 0,
      release_date || new Date().toISOString().split('T')[0],
      createdBy
    );

    const newProduct = db.prepare(`
      SELECT p.*, c.name as category_name, b.name as brand_name
      FROM products p LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id WHERE p.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json(newProduct);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally { db.close(); }
});

module.exports = router;
