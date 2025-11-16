// backend/routes/me.js
const express = require('express');
const router = express.Router();
const User = require('../models/User'); // adjust path if needed
const auth = require('../middleware/auth');
const bcrypt = require('bcryptjs');

// GET /api/me - return current user (no password)
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('-password');
    if (!user) return res.status(404).json({ msg: 'User not found' });
    return res.json({ user });
  } catch (err) {
    console.error('GET /api/me error', err);
    return res.status(500).json({ msg: 'Server error' });
  }
});

// POST /api/me/password - change password (requires old password)
router.post('/password', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) return res.status(400).json({ msg: 'oldPassword and newPassword are required' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    // verify old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Old password is incorrect' });

    // hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    return res.json({ success: true, msg: 'Password updated' });
  } catch (err) {
    console.error('POST /api/me/password error', err);
    return res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
