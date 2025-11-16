// backend/models/Session.js
const mongoose = require('mongoose');

const PerRepSchema = new mongoose.Schema({
  timestamp: { type: Date, required: true },
  score: { type: Number, default: 0 },
  meta: { type: Object, default: {} } // optional: store angle, elbow, etc.
}, { _id: false });

const SessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  exercise: { type: String, required: true },
  reps: { type: Number, default: 0 },
  durationSeconds: { type: Number, default: 0 },
  score: { type: Number, default: 0 },
  perRep: { type: [PerRepSchema], default: [] },
  details: { type: Object, default: {} },
}, { timestamps: true });

module.exports = mongoose.model('Session', SessionSchema);
