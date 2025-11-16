// backend/routes/sessions.js
const express = require('express');
const router = express.Router();
const Session = require('../models/Session');
const auth = require('../middleware/auth'); // adjust if your project has auth middleware
const { Parser } = require('json2csv');

// Create session (authenticated)
router.post('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { exercise, reps = 0, duration = 0, score = 0, details = {}, perRep = [] } = req.body;

    // Normalize perRep timestamps to Date objects if strings
    const normalizedPerRep = Array.isArray(perRep) ? perRep.map(p => ({
      timestamp: p.timestamp ? new Date(p.timestamp) : new Date(),
      score: p.score ?? 0,
      meta: p.meta ?? {}
    })) : [];

    const session = new Session({
      user: userId,
      exercise,
      reps,
      durationSeconds: duration,
      score,
      perRep: normalizedPerRep,
      details
    });

    await session.save();
    res.json({ success: true, session });
  } catch (err) {
    console.error('POST /api/sessions error', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// List sessions for current user
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const sessions = await Session.find({ user: userId }).sort({ createdAt: -1 }).limit(200);
    res.json({ success: true, sessions });
  } catch (err) {
    console.error('GET /api/sessions error', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Export CSV of sessions (for authenticated user)
router.get('/csv', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const sessions = await Session.find({ user: userId }).sort({ createdAt: -1 }).lean();

    // prepare flat rows: one row per session
    const rows = sessions.map(s => ({
      id: s._id.toString(),
      exercise: s.exercise,
      reps: s.reps,
      durationSeconds: s.durationSeconds,
      score: s.score,
      createdAt: s.createdAt.toISOString(),
      perRepCount: (s.perRep || []).length
    }));

    const parser = new Parser();
    const csv = parser.parse(rows);

    res.header('Content-Type', 'text/csv');
    res.attachment(`sessions_${userId}.csv`);
    res.send(csv);
  } catch (err) {
    console.error('GET /api/sessions/csv error', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Add inside backend/routes/sessions.js (after the GET / handler)
router.get('/:id', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const sessionId = req.params.id;
    const session = await Session.findOne({ _id: sessionId, user: userId }).lean();
    if (!session) return res.status(404).json({ success: false, msg: 'Session not found' });
    res.json({ success: true, session });
  } catch (err) {
    console.error('GET /api/sessions/:id error', err);
    res.status(500).json({ msg: 'Server error' });
  }
});


module.exports = router;
