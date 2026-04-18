const express = require('express');
const { getDb } = require('../db/schema');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', optionalAuth, (req, res) => {
  const db = getDb();
  try {
    const {
      page = 1, limit = 20, search, category, brand, min_rating, max_price,
      min_price, sort = 'popular', release_filter, deals_only
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const conditions = ["p.status = 'active'"];
    const params = [];

    if (search) {
      conditions.push("(p.name LIKE ? OR p.description LIKE ? OR b.name LIKE ?)");
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    if (category) {
      conditions.push("(c.slug = ? OR c.id = ?)");
      params.push(category, parseInt(category) || 0);
    }

    if (brand) {
      conditions.push("(b.slug = ? OR b.id = ?)");
      params.push(brand, parseInt(brand) || 0);
    }

    if (min_rating) {
      conditions.push("p.rating >= ?");
      params.push(parseFloat(min_rating));
    }

    if (min_price) {
      conditions.push("p.price >= ?");
      params.push(parseFloat(min_price));
    }

    if (max_price) {
      conditions.push("p.price <= ?");
      params.push(parseFloat(max_price));
    }

    if (deals_only === 'true') {
      conditions.push("p.is_deal = 1");
    }

    if (release_filter) {
      const now = new Date();
      switch (release_filter) {
        case 'last_30_days': {
          const d = new Date(now); d.setDate(d.getDate() - 30);
          conditions.push("p.release_date >= ? AND p.release_date <= ?");
          params.push(d.toISOString().split('T')[0], now.toISOString().split('T')[0]);
          break;
        }
        case 'last_90_days': {
          const d = new Date(now); d.setDate(d.getDate() - 90);
          conditions.push("p.release_date >= ? AND p.release_date <= ?");
          params.push(d.toISOString().split('T')[0], now.toISOString().split('T')[0]);
          break;
        }
        case 'coming_soon':
          conditions.push("p.release_date > ?");
          params.push(now.toISOString().split('T')[0]);
          break;
      }
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    let orderBy;
    switch (sort) {
      case 'price_asc': orderBy = 'p.price ASC'; break;
      case 'price_desc': orderBy = 'p.price DESC'; break;
      case 'rating': orderBy = 'p.rating DESC'; break;
      case 'newest': orderBy = 'p.release_date DESC'; break;
      case 'name_asc': orderBy = 'p.name ASC'; break;
      case 'name_desc': orderBy = 'p.name DESC'; break;
      default: orderBy = 'p.purchase_count DESC';
    }

    const countRow = db.prepare(`
      SELECT COUNT(*) as total FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      ${whereClause}
    `).get(...params);

    const products = db.prepare(`
      SELECT p.*, c.name as category_name, c.slug as category_slug,
             b.name as brand_name, b.slug as brand_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `).all(...params, parseInt(limit), offset);

    res.json({
      products: products.map(p => ({ ...p, images: p.images ? JSON.parse(p.images) : [] })),
      pagination: {
        total: countRow.total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(countRow.total / parseInt(limit))
      }
    });
  } finally {
    db.close();
  }
});

router.get('/categories', (req, res) => {
  const db = getDb();
  try {
    const categories = db.prepare(`
      SELECT c.*, COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id AND p.status = 'active'
      GROUP BY c.id ORDER BY c.name
    `).all();
    res.json(categories);
  } finally {
    db.close();
  }
});

router.get('/brands', (req, res) => {
  const db = getDb();
  try {
    const brands = db.prepare(`
      SELECT b.*, COUNT(p.id) as product_count
      FROM brands b
      LEFT JOIN products p ON p.brand_id = b.id AND p.status = 'active'
      GROUP BY b.id ORDER BY b.name
    `).all();
    res.json(brands);
  } finally {
    db.close();
  }
});

router.get('/:slug', optionalAuth, (req, res) => {
  const db = getDb();
  try {
    const product = db.prepare(`
      SELECT p.*, c.name as category_name, c.slug as category_slug,
             b.name as brand_name, b.slug as brand_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE p.slug = ? OR p.id = ?
    `).get(req.params.slug, parseInt(req.params.slug) || 0);

    if (!product) return res.status(404).json({ error: 'Product not found' });

    product.images = product.images ? JSON.parse(product.images) : [];

    const variants = db.prepare('SELECT * FROM product_variants WHERE product_id = ?').all(product.id);
    variants.forEach(v => { v.attributes = v.attributes ? JSON.parse(v.attributes) : {}; });

    const reviews = db.prepare(`
      SELECT r.*, u.first_name, u.last_name
      FROM reviews r JOIN users u ON r.user_id = u.id
      WHERE r.product_id = ? ORDER BY r.created_at DESC
    `).all(product.id);

    const related = db.prepare(`
      SELECT p.id, p.name, p.slug, p.price, p.compare_at_price, p.image_url, p.rating, p.review_count,
             p.is_deal, p.deal_discount, b.name as brand_name
      FROM products p
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE p.category_id = ? AND p.id != ? AND p.status = 'active'
      ORDER BY p.purchase_count DESC LIMIT 6
    `).all(product.category_id, product.id);

    let shop = null;
    if (product.created_by) {
      shop = db.prepare("SELECT id, company_name, first_name, last_name FROM users WHERE id = ? AND role = 'business'").get(product.created_by);
    }

    res.json({ product, variants, reviews, related, shop });
  } finally {
    db.close();
  }
});

module.exports = router;
