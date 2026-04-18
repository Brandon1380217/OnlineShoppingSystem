const express = require('express');
const { getDb } = require('../db/schema');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

function createNotification(db, userId, type, title, message, link) {
  return db.prepare(
    'INSERT INTO notifications (user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?)'
  ).run(userId, type, title, message, link || null);
}

function notifyBusinessUsersForProduct(db, productId, type, title, message, link) {
  const product = db.prepare('SELECT created_by FROM products WHERE id = ?').get(productId);
  if (product?.created_by) {
    createNotification(db, product.created_by, type, title, message, link);
  }
}

function notifyFollowers(db, businessId, type, title, message, link) {
  const followers = db.prepare('SELECT user_id FROM shop_follows WHERE business_id = ?').all(businessId);
  const stmt = db.prepare('INSERT INTO notifications (user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?)');
  for (const f of followers) {
    stmt.run(f.user_id, type, title, message, link || null);
  }
}

router.get('/', (req, res) => {
  const { page = 1, limit = 20, unread_only } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const db = getDb();
  try {
    let whereClause = 'WHERE user_id = ?';
    const params = [req.user.id];
    if (unread_only === 'true') {
      whereClause += ' AND is_read = 0';
    }

    const total = db.prepare(`SELECT COUNT(*) as total FROM notifications ${whereClause}`).get(...params).total;
    const unread = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0').get(req.user.id).count;
    const notifications = db.prepare(`
      SELECT * FROM notifications ${whereClause}
      ORDER BY created_at DESC LIMIT ? OFFSET ?
    `).all(...params, parseInt(limit), offset);

    res.json({
      notifications,
      unread_count: unread,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) }
    });
  } finally {
    db.close();
  }
});

router.put('/:id/read', (req, res) => {
  const db = getDb();
  try {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    res.json({ message: 'Marked as read' });
  } finally {
    db.close();
  }
});

router.put('/read-all', (req, res) => {
  const db = getDb();
  try {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.user.id);
    res.json({ message: 'All marked as read' });
  } finally {
    db.close();
  }
});

module.exports = router;
module.exports.createNotification = createNotification;
module.exports.notifyBusinessUsersForProduct = notifyBusinessUsersForProduct;
module.exports.notifyFollowers = notifyFollowers;
