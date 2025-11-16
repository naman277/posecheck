const Session = require('../models/Session');

exports.createSession = async (req, res) => {
  try {
    const { exercise, reps, duration, score, details } = req.body;
    const session = new Session({
      user: req.user.id,
      exercise,
      reps: reps || 0,
      duration: duration || 0,
      score: score || 0,
      details: details || {}
    });
    await session.save();
    res.json(session);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.getSessions = async (req, res) => {
  try {
    const sessions = await Session.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(sessions);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.getSessionById = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ msg: 'Session not found' });
    if (session.user.toString() !== req.user.id) return res.status(401).json({ msg: 'Not authorized' });
    res.json(session);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};
