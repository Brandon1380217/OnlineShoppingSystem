const express = require('express');
const { getDb } = require('../db/schema');
const { authenticate } = require('../middleware/auth');
const { createNotification } = require('./notifications');

const router = express.Router();
router.use(authenticate);

const PRESET_QUESTIONS = [
  'Is this product still in stock?',
  'How long does shipping take?',
  'Do you offer international shipping?',
  'What is your return policy?',
  'Are there any ongoing promotions or discounts?',
  'Can I get a bulk order discount?',
  'Is this product authentic / under warranty?',
  'Can you recommend a similar product?'
];

router.get('/presets', (_req, res) => {
  res.json({ presets: PRESET_QUESTIONS });
});

router.get('/', (req, res) => {
  const db = getDb();
  try {
    const isBusiness = req.user.role === 'business' || req.user.role === 'admin';
    const column = isBusiness ? 'business_id' : 'customer_id';
    const otherColumn = isBusiness ? 'customer_id' : 'business_id';

    const conversations = db.prepare(`
      SELECT c.*,
             u.id as other_id, u.first_name as other_first_name, u.last_name as other_last_name,
             u.company_name as other_company_name, u.role as other_role,
             (SELECT message FROM chat_messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message,
             (SELECT created_at FROM chat_messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message_at,
             (SELECT COUNT(*) FROM chat_messages m WHERE m.conversation_id = c.id AND m.sender_id != ? AND m.is_read = 0) as unread_count
      FROM chat_conversations c
      JOIN users u ON u.id = c.${otherColumn}
      WHERE c.${column} = ?
      ORDER BY COALESCE(last_message_at, c.created_at) DESC
    `).all(req.user.id, req.user.id);

    res.json({ conversations });
  } finally { db.close(); }
});

router.post('/shop/:shopId', (req, res) => {
  const db = getDb();
  try {
    const shop = db.prepare("SELECT id FROM users WHERE id = ? AND role = 'business'").get(req.params.shopId);
    if (!shop) return res.status(404).json({ error: 'Shop not found' });

    if (req.user.role === 'business' && req.user.id === shop.id) {
      return res.status(400).json({ error: "You can't chat with yourself" });
    }

    const customerId = req.user.role === 'business' ? parseInt(req.body.customer_id) : req.user.id;
    if (!customerId) return res.status(400).json({ error: 'Customer is required' });

    const businessId = shop.id;
    let conv = db.prepare('SELECT * FROM chat_conversations WHERE customer_id = ? AND business_id = ?')
      .get(customerId, businessId);

    if (!conv) {
      const result = db.prepare('INSERT INTO chat_conversations (customer_id, business_id) VALUES (?, ?)')
        .run(customerId, businessId);
      conv = db.prepare('SELECT * FROM chat_conversations WHERE id = ?').get(result.lastInsertRowid);
    }

    res.json({ conversation: conv });
  } finally { db.close(); }
});

function ensureAccess(db, conv, user) {
  if (!conv) return { ok: false, status: 404, error: 'Conversation not found' };
  if (user.role === 'admin') return { ok: true };
  if (user.role === 'business' && conv.business_id === user.id) return { ok: true };
  if (user.role === 'customer' && conv.customer_id === user.id) return { ok: true };
  return { ok: false, status: 403, error: 'Access denied' };
}

router.get('/:id/messages', (req, res) => {
  const { since } = req.query;
  const db = getDb();
  try {
    const conv = db.prepare('SELECT * FROM chat_conversations WHERE id = ?').get(req.params.id);
    const check = ensureAccess(db, conv, req.user);
    if (!check.ok) return res.status(check.status).json({ error: check.error });

    let messages;
    if (since) {
      messages = db.prepare(`
        SELECT m.*, u.first_name, u.last_name, u.company_name
        FROM chat_messages m JOIN users u ON m.sender_id = u.id
        WHERE m.conversation_id = ? AND m.id > ?
        ORDER BY m.created_at ASC
      `).all(req.params.id, parseInt(since) || 0);
    } else {
      messages = db.prepare(`
        SELECT m.*, u.first_name, u.last_name, u.company_name
        FROM chat_messages m JOIN users u ON m.sender_id = u.id
        WHERE m.conversation_id = ?
        ORDER BY m.created_at ASC
      `).all(req.params.id);
    }

    db.prepare('UPDATE chat_messages SET is_read = 1 WHERE conversation_id = ? AND sender_id != ?')
      .run(req.params.id, req.user.id);

    const other = db.prepare(`
      SELECT id, first_name, last_name, company_name, role FROM users WHERE id = ?
    `).get(req.user.role === 'business' || req.user.role === 'admin' ? conv.customer_id : conv.business_id);

    res.json({ conversation: conv, messages, other });
  } finally { db.close(); }
});

router.post('/:id/messages', (req, res) => {
  const { message } = req.body;
  if (!message || !message.trim()) return res.status(400).json({ error: 'Message is required' });

  const db = getDb();
  try {
    const conv = db.prepare('SELECT * FROM chat_conversations WHERE id = ?').get(req.params.id);
    const check = ensureAccess(db, conv, req.user);
    if (!check.ok) return res.status(check.status).json({ error: check.error });

    const senderRole = (req.user.role === 'business' || req.user.role === 'admin') ? 'business' : 'customer';

    const result = db.prepare(`
      INSERT INTO chat_messages (conversation_id, sender_id, sender_role, message)
      VALUES (?, ?, ?, ?)
    `).run(req.params.id, req.user.id, senderRole, message.trim());

    db.prepare('UPDATE chat_conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(req.params.id);

    const recipientId = senderRole === 'business' ? conv.customer_id : conv.business_id;
    const senderName = req.user.role === 'business' || req.user.role === 'admin' ? 'a shop' : 'a customer';
    const existingUnread = db.prepare(
      "SELECT id FROM notifications WHERE user_id = ? AND type = 'chat_message' AND link = ? AND is_read = 0"
    ).get(recipientId, `/chat/${req.params.id}`);
    if (!existingUnread) {
      createNotification(db, recipientId, 'chat_message', 'New Chat Message',
        `You have a new message from ${senderName}.`, `/chat/${req.params.id}`);
    }

    const newMsg = db.prepare(`
      SELECT m.*, u.first_name, u.last_name, u.company_name
      FROM chat_messages m JOIN users u ON m.sender_id = u.id
      WHERE m.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json(newMsg);
  } finally { db.close(); }
});

module.exports = router;
