const express = require('express');
const { getDb } = require('../db/schema');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { createNotification } = require('./notifications');

const router = express.Router();

router.get('/', (req, res) => {
  const db = getDb();
  try {
    const shops = db.prepare(`
      SELECT u.id, u.company_name, u.first_name, u.last_name, u.created_at,
             COUNT(DISTINCT p.id) as product_count,
             (SELECT COUNT(*) FROM shop_follows sf WHERE sf.business_id = u.id) as follower_count,
             (SELECT COALESCE(AVG(rating), 0) FROM shop_reviews sr WHERE sr.business_id = u.id) as rating,
             (SELECT COUNT(*) FROM shop_reviews sr WHERE sr.business_id = u.id) as review_count
      FROM users u
      LEFT JOIN products p ON p.created_by = u.id AND p.status = 'active'
      WHERE u.role = 'business'
      GROUP BY u.id ORDER BY product_count DESC
    `).all();
    res.json(shops);
  } finally { db.close(); }
});

router.get('/:id', optionalAuth, (req, res) => {
  const db = getDb();
  try {
    const shop = db.prepare(`
      SELECT u.id, u.company_name, u.first_name, u.last_name, u.created_at,
             COUNT(DISTINCT p.id) as product_count,
             (SELECT COUNT(*) FROM shop_follows sf WHERE sf.business_id = u.id) as follower_count,
             (SELECT COALESCE(AVG(rating), 0) FROM shop_reviews sr WHERE sr.business_id = u.id) as rating,
             (SELECT COUNT(*) FROM shop_reviews sr WHERE sr.business_id = u.id) as review_count
      FROM users u
      LEFT JOIN products p ON p.created_by = u.id AND p.status = 'active'
      WHERE u.id = ? AND u.role = 'business'
      GROUP BY u.id
    `).get(req.params.id);
    if (!shop) return res.status(404).json({ error: 'Shop not found' });

    let is_following = false;
    let can_review = false;
    let has_reviewed = false;
    if (req.user) {
      const follow = db.prepare('SELECT 1 FROM shop_follows WHERE user_id = ? AND business_id = ?').get(req.user.id, req.params.id);
      is_following = !!follow;

      const purchased = db.prepare(`
        SELECT 1 FROM orders o
        JOIN order_items oi ON oi.order_id = o.id
        JOIN products p ON oi.product_id = p.id
        WHERE o.user_id = ? AND p.created_by = ? AND o.status IN ('delivered', 'shipped', 'out_for_delivery')
        LIMIT 1
      `).get(req.user.id, req.params.id);
      can_review = !!purchased;

      const reviewed = db.prepare('SELECT 1 FROM shop_reviews WHERE user_id = ? AND business_id = ?').get(req.user.id, req.params.id);
      has_reviewed = !!reviewed;
    }

    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const products = db.prepare(`
      SELECT p.*, c.name as category_name, c.slug as category_slug, b.name as brand_name, b.slug as brand_slug
      FROM products p LEFT JOIN categories c ON p.category_id = c.id LEFT JOIN brands b ON p.brand_id = b.id
      WHERE p.created_by = ? AND p.status = 'active'
      ORDER BY p.created_at DESC LIMIT ? OFFSET ?
    `).all(req.params.id, parseInt(limit), offset);

    res.json({
      shop: { ...shop, is_following, can_review, has_reviewed },
      products: products.map(p => ({ ...p, images: p.images ? JSON.parse(p.images) : [] }))
    });
  } finally { db.close(); }
});

router.post('/:id/follow', authenticate, (req, res) => {
  const db = getDb();
  try {
    const shop = db.prepare("SELECT id FROM users WHERE id = ? AND role = 'business'").get(req.params.id);
    if (!shop) return res.status(404).json({ error: 'Shop not found' });

    const existing = db.prepare('SELECT 1 FROM shop_follows WHERE user_id = ? AND business_id = ?').get(req.user.id, req.params.id);
    if (existing) return res.status(409).json({ error: 'Already following' });

    db.prepare('INSERT INTO shop_follows (user_id, business_id) VALUES (?, ?)').run(req.user.id, req.params.id);
    res.json({ message: 'Now following this shop' });
  } finally { db.close(); }
});

router.delete('/:id/follow', authenticate, (req, res) => {
  const db = getDb();
  try {
    db.prepare('DELETE FROM shop_follows WHERE user_id = ? AND business_id = ?').run(req.user.id, req.params.id);
    res.json({ message: 'Unfollowed' });
  } finally { db.close(); }
});

router.get('/me/following', authenticate, (req, res) => {
  const db = getDb();
  try {
    const following = db.prepare(`
      SELECT u.id, u.company_name, u.first_name, u.last_name,
             COUNT(DISTINCT p.id) as product_count,
             (SELECT COUNT(*) FROM shop_follows sf WHERE sf.business_id = u.id) as follower_count,
             sf.created_at as followed_at
      FROM shop_follows sf
      JOIN users u ON sf.business_id = u.id
      LEFT JOIN products p ON p.created_by = u.id AND p.status = 'active'
      WHERE sf.user_id = ?
      GROUP BY u.id ORDER BY sf.created_at DESC
    `).all(req.user.id);
    res.json(following);
  } finally { db.close(); }
});

router.get('/:id/reviews', (req, res) => {
  const db = getDb();
  try {
    const reviews = db.prepare(`
      SELECT sr.*, u.first_name, u.last_name
      FROM shop_reviews sr
      JOIN users u ON sr.user_id = u.id
      WHERE sr.business_id = ?
      ORDER BY sr.created_at DESC
    `).all(req.params.id);

    const agg = db.prepare(`
      SELECT COALESCE(AVG(rating), 0) as avg_rating, COUNT(*) as count
      FROM shop_reviews WHERE business_id = ?
    `).get(req.params.id);

    const breakdown = db.prepare(`
      SELECT rating, COUNT(*) as count FROM shop_reviews
      WHERE business_id = ? GROUP BY rating
    `).all(req.params.id);

    res.json({ reviews, avg_rating: agg.avg_rating, count: agg.count, breakdown });
  } finally { db.close(); }
});

router.post('/:id/reviews', authenticate, (req, res) => {
  const { rating, comment } = req.body;
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }

  const db = getDb();
  try {
    const shop = db.prepare("SELECT id, company_name, first_name FROM users WHERE id = ? AND role = 'business'").get(req.params.id);
    if (!shop) return res.status(404).json({ error: 'Shop not found' });

    const purchased = db.prepare(`
      SELECT o.id FROM orders o
      JOIN order_items oi ON oi.order_id = o.id
      JOIN products p ON oi.product_id = p.id
      WHERE o.user_id = ? AND p.created_by = ? AND o.status IN ('delivered', 'shipped', 'out_for_delivery')
      ORDER BY o.created_at DESC LIMIT 1
    `).get(req.user.id, req.params.id);
    if (!purchased) {
      return res.status(403).json({ error: 'You can only review shops after purchasing from them' });
    }

    const existing = db.prepare('SELECT id FROM shop_reviews WHERE user_id = ? AND business_id = ?').get(req.user.id, req.params.id);
    if (existing) {
      return res.status(409).json({ error: 'You have already reviewed this shop. Reviews cannot be modified once submitted.' });
    }

    const result = db.prepare(
      'INSERT INTO shop_reviews (business_id, user_id, order_id, rating, comment) VALUES (?, ?, ?, ?, ?)'
    ).run(req.params.id, req.user.id, purchased.id, rating, comment || null);

    createNotification(db, shop.id, 'shop_review', 'New Shop Review',
      `You received a ${rating}-star shop review.`, `/shops/${shop.id}`);

    res.status(201).json({ message: 'Review submitted', id: result.lastInsertRowid });
  } finally { db.close(); }
});

router.delete('/:id/reviews/mine', authenticate, (_req, res) => {
  res.status(403).json({ error: 'Reviews are final and cannot be deleted once submitted.' });
});

module.exports = router;
