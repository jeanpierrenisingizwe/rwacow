const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../database/db');

/* ── helpers ── */
const signToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

/* ─────────────────────────────────────────────
   REGISTER
───────────────────────────────────────────── */
const register = async (req, res) => {
  const { full_name, email, phone, password, role } = req.body;
  if (!full_name || !email || !password) {
    return res.status(400).json({ error: 'full_name, email and password are required' });
  }
  if (role === 'admin') {
    return res.status(403).json({ error: 'Admin accounts must be created by an existing administrator' });
  }
  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    const password_hash = await bcrypt.hash(password, 12);
    const id = crypto.randomUUID();
    await pool.query(
      `INSERT INTO users (id, full_name, email, phone, password_hash, role)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, full_name, email, phone || null, password_hash, role || 'farmer']
    );
    const userRow = await pool.query(
      'SELECT id, full_name, email, phone, role, created_at FROM users WHERE id = ?', [id]
    );
    const user = userRow.rows[0];
    const token = signToken(user);
    res.status(201).json({ user, token });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
};

/* ─────────────────────────────────────────────
   LOGIN
───────────────────────────────────────────── */
const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = ? AND is_active = 1', [email]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = signToken(user);
    const { password_hash, reset_token, reset_token_expiry, ...userOut } = user;
    res.json({ user: userOut, token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
};

/* ─────────────────────────────────────────────
   GET ME
───────────────────────────────────────────── */
const getMe = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, full_name, email, phone, role, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

/* ─────────────────────────────────────────────
   FORGOT PASSWORD
───────────────────────────────────────────── */
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  try {
    const result = await pool.query(
      'SELECT id, full_name FROM users WHERE email = ? AND is_active = 1', [email]
    );
    if (result.rows.length === 0) {
      return res.json({ message: 'If that email exists, a reset link has been sent.' });
    }
    const user = result.rows[0];
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiry = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    await pool.query(
      `UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?`,
      [tokenHash, expiry, user.id]
    );

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${rawToken}`;
    console.log(`\n🔑 Password reset link for ${email}:\n${resetUrl}\n`);

    if (process.env.NODE_ENV !== 'production') {
      return res.json({
        message: 'Reset link generated. Check server console.',
        dev_reset_url: resetUrl,
      });
    }
    res.json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Failed to process request' });
  }
};

/* ─────────────────────────────────────────────
   RESET PASSWORD
───────────────────────────────────────────── */
const resetPassword = async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) {
    return res.status(400).json({ error: 'Token and new password are required' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }
  try {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const result = await pool.query(
      `SELECT id FROM users WHERE reset_token = ? AND reset_token_expiry > datetime('now') AND is_active = 1`,
      [tokenHash]
    );
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Reset link is invalid or has expired' });
    }
    const userId = result.rows[0].id;
    const password_hash = await bcrypt.hash(password, 12);
    await pool.query(
      `UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expiry = NULL, updated_at = datetime('now') WHERE id = ?`,
      [password_hash, userId]
    );
    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Failed to reset password' });
  }
};

module.exports = { register, login, getMe, forgotPassword, resetPassword };
