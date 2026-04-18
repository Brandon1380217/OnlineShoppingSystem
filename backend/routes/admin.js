const express = require('express');
const bcrypt = require('bcryptjs');
const { getDb } = require('../db/schema');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);
router.use(requireRole('admin'));

router.get('/users', (req, res) => {
  const { page = 1, limit = 20, role, search } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const db = getDb();
  try {
    const conditions = [];
    const params = [];

    if (role) { conditions.push('role = ?'); params.push(role); }
    if (search) {
      conditions.push('(email LIKE ? OR first_name LIKE ? OR last_name LIKE ? OR company_name LIKE ?)');
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }
    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const total = db.prepare(`SELECT COUNT(*) as total FROM users ${whereClause}`).get(...params).total;
    const users = db.prepare(`
      SELECT id, email, first_name, last_name, phone, address, city, state, zip_code, country, role, company_name, created_at, updated_at
      FROM users ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?
    `).all(...params, parseInt(limit), offset);

    res.json({ users, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) } });
  } finally { db.close(); }
});

router.get('/users/:id', (req, res) => {
  const db = getDb();
  try {
    const user = db.prepare('SELECT id, email, first_name, last_name, phone, address, city, state, zip_code, country, role, company_name, created_at, updated_at FROM users WHERE id = ?').get(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const orderCount = db.prepare('SELECT COUNT(*) as count FROM orders WHERE user_id = ?').get(user.id).count;
    const totalSpent = db.prepare("SELECT COALESCE(SUM(total), 0) as sum FROM orders WHERE user_id = ? AND payment_status = 'paid'").get(user.id).sum;

    res.json({ user, stats: { order_count: orderCount, total_spent: Math.round(totalSpent * 100) / 100 } });
  } finally { db.close(); }
});

router.put('/users/:id', (req, res) => {
  const { role, first_name, last_name, email, phone, company_name } = req.body;
  const db = getDb();
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.id === req.user.id && role && role !== user.role) {
      return res.status(400).json({ error: 'Cannot change your own role' });
    }

    db.prepare(`
      UPDATE users SET role = COALESCE(?, role), first_name = COALESCE(?, first_name),
        last_name = COALESCE(?, last_name), email = COALESCE(?, email),
        phone = COALESCE(?, phone), company_name = COALESCE(?, company_name),
        updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(role, first_name, last_name, email, phone, company_name, req.params.id);

    const updated = db.prepare('SELECT id, email, first_name, last_name, phone, role, company_name, created_at, updated_at FROM users WHERE id = ?').get(req.params.id);
    res.json(updated);
  } finally { db.close(); }
});

router.post('/users', (req, res) => {
  const { email, password, first_name, last_name, role, phone, company_name } = req.body;
  if (!email || !password || !first_name || !last_name) {
    return res.status(400).json({ error: 'Email, password, first name, and last name are required' });
  }

  const db = getDb();
  try {
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) return res.status(409).json({ error: 'Email already exists' });

    const hashedPassword = bcrypt.hashSync(password, 10);
    const result = db.prepare('INSERT INTO users (email, password, first_name, last_name, phone, role, company_name) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(email, hashedPassword, first_name, last_name, phone || null, role || 'customer', company_name || null);

    const user = db.prepare('SELECT id, email, first_name, last_name, role, company_name, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(user);
  } finally { db.close(); }
});

router.delete('/users/:id', (req, res) => {
  const db = getDb();
  try {
    if (parseInt(req.params.id) === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    const user = db.prepare('SELECT id FROM users WHERE id = ?').get(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
    res.json({ message: 'User deleted' });
  } finally { db.close(); }
});

router.get('/stats', (req, res) => {
  const db = getDb();
  try {
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const customerCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'customer'").get().count;
    const businessCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'business'").get().count;
    const adminCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'admin'").get().count;
    const totalOrders = db.prepare('SELECT COUNT(*) as count FROM orders').get().count;
    const totalRevenue = db.prepare("SELECT COALESCE(SUM(total), 0) as sum FROM orders WHERE payment_status = 'paid'").get().sum;
    const totalProducts = db.prepare("SELECT COUNT(*) as count FROM products WHERE status = 'active'").get().count;

    res.json({
      total_users: totalUsers, customer_count: customerCount,
      business_count: businessCount, admin_count: adminCount,
      total_orders: totalOrders, total_revenue: Math.round(totalRevenue * 100) / 100,
      total_products: totalProducts
    });
  } finally { db.close(); }
});

module.exports = router;
