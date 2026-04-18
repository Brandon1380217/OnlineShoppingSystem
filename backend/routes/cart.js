const express = require('express');
const { getDb } = require('../db/schema');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

router.get('/', (req, res) => {
  const db = getDb();
  try {
    const items = db.prepare(`
      SELECT ci.*, p.name, p.slug, p.price, p.compare_at_price, p.image_url, p.stock_quantity,
             p.is_deal, p.deal_discount, b.name as brand_name,
             pv.name as variant_name, pv.price as variant_price, pv.attributes as variant_attributes
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN product_variants pv ON ci.variant_id = pv.id
      WHERE ci.user_id = ?
      ORDER BY ci.created_at DESC
    `).all(req.user.id);

    items.forEach(i => {
      if (i.variant_attributes) i.variant_attributes = JSON.parse(i.variant_attributes);
    });

    const effectivePrice = (item) => {
      let price = item.variant_price || item.price;
      if (item.is_deal && item.deal_discount > 0) {
        price = price * (1 - item.deal_discount / 100);
      }
      return price;
    };

    const subtotal = items.reduce((sum, i) => sum + effectivePrice(i) * i.quantity, 0);

    res.json({
      items,
      summary: {
        item_count: items.reduce((sum, i) => sum + i.quantity, 0),
        subtotal: Math.round(subtotal * 100) / 100
      }
    });
  } finally {
    db.close();
  }
});

router.post('/add', (req, res) => {
  const { product_id, variant_id, quantity = 1 } = req.body;
  if (!product_id) return res.status(400).json({ error: 'Product ID is required' });

  const db = getDb();
  try {
    const product = db.prepare('SELECT * FROM products WHERE id = ? AND status = ?').get(product_id, 'active');
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const existing = db.prepare(
      'SELECT * FROM cart_items WHERE user_id = ? AND product_id = ? AND (variant_id = ? OR (variant_id IS NULL AND ? IS NULL))'
    ).get(req.user.id, product_id, variant_id || null, variant_id || null);

    if (existing) {
      db.prepare('UPDATE cart_items SET quantity = quantity + ? WHERE id = ?').run(quantity, existing.id);
    } else {
      db.prepare('INSERT INTO cart_items (user_id, product_id, variant_id, quantity) VALUES (?, ?, ?, ?)')
        .run(req.user.id, product_id, variant_id || null, quantity);
    }

    res.json({ message: 'Item added to cart' });
  } finally {
    db.close();
  }
});

router.put('/:id', (req, res) => {
  const { quantity } = req.body;
  if (!quantity || quantity < 1) return res.status(400).json({ error: 'Valid quantity is required' });

  const db = getDb();
  try {
    const item = db.prepare('SELECT * FROM cart_items WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!item) return res.status(404).json({ error: 'Cart item not found' });

    db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?').run(quantity, req.params.id);
    res.json({ message: 'Cart updated' });
  } finally {
    db.close();
  }
});

router.delete('/:id', (req, res) => {
  const db = getDb();
  try {
    const result = db.prepare('DELETE FROM cart_items WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Cart item not found' });
    res.json({ message: 'Item removed from cart' });
  } finally {
    db.close();
  }
});

router.delete('/', (req, res) => {
  const db = getDb();
  try {
    db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(req.user.id);
    res.json({ message: 'Cart cleared' });
  } finally {
    db.close();
  }
});

module.exports = router;
