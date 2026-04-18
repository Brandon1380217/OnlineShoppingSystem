const express = require('express');
const bcrypt = require('bcryptjs');
const { getDb } = require('../db/schema');
const { generateToken, authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/register', (req, res) => {
  const { email, password, first_name, last_name, phone, role, company_name } = req.body;

  if (!email || !password || !first_name || !last_name) {
    return res.status(400).json({ error: 'Email, password, first name, and last name are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const db = getDb();
  try {
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const userRole = role === 'business' ? 'business' : 'customer';

    const result = db.prepare(`
      INSERT INTO users (email, password, first_name, last_name, phone, role, company_name)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(email, hashedPassword, first_name, last_name, phone || null, userRole, company_name || null);

    const user = db.prepare('SELECT id, email, first_name, last_name, role, company_name FROM users WHERE id = ?').get(result.lastInsertRowid);
    const token = generateToken(user);

    res.status(201).json({ user, token });
  } finally {
    db.close();
  }
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const db = getDb();
  try {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user);
    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword, token });
  } finally {
    db.close();
  }
});

router.get('/me', authenticate, (req, res) => {
  const db = getDb();
  try {
    const user = db.prepare('SELECT id, email, first_name, last_name, phone, address, city, state, zip_code, country, role, company_name, created_at FROM users WHERE id = ?').get(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } finally {
    db.close();
  }
});

router.put('/me', authenticate, (req, res) => {
  const { first_name, last_name, phone, address, city, state, zip_code, country } = req.body;
  const db = getDb();
  try {
    db.prepare(`
      UPDATE users SET first_name = COALESCE(?, first_name), last_name = COALESCE(?, last_name),
        phone = COALESCE(?, phone), address = COALESCE(?, address), city = COALESCE(?, city),
        state = COALESCE(?, state), zip_code = COALESCE(?, zip_code), country = COALESCE(?, country),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(first_name, last_name, phone, address, city, state, zip_code, country, req.user.id);

    const user = db.prepare('SELECT id, email, first_name, last_name, phone, address, city, state, zip_code, country, role, company_name FROM users WHERE id = ?').get(req.user.id);
    res.json(user);
  } finally {
    db.close();
  }
});

module.exports = router;
