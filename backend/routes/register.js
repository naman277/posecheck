// backend/routes/register.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // adjust path if your User model is elsewhere

// ensure you have a .env value for JWT_SECRET or replace process.env.JWT_SECRET with a string (not recommended)
const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret_in_prod';

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) return res.status(400).json({ msg: 'Email and password required' });

    // check duplicate
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) return res.status(400).json({ msg: 'User already exists' });

    // hash password
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const user = new User({
      email: email.toLowerCase().trim(),
      password: hashed,
      name: name || email.split('@')[0]
    });

    await user.save();

    // sign token
    const payload = { user: { id: user._id } };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });

    // return token + user basic data
    return res.json({ token, user: { id: user._id, email: user.email, name: user.name, createdAt: user.createdAt } });
  } catch (err) {
    console.error('POST /api/auth/register error', err);
    return res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
