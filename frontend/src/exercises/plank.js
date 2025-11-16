// frontend/src/exercises/plank.js
import { angleBetween } from "../core/angleUtils";

export default function createPlankDetector() {
  // Plank: hold detection using shoulder-hip-ankle straightness.
  let holdStart = null;
  let holdSeconds = 0;
  let running = false;
  let score = 0;
  const WINDOW = [];
  const MAX_WINDOW = 6;
  const VIS = 0.35;

  function smooth(v) {
    WINDOW.push(v);
    if (WINDOW.length > MAX_WINDOW) WINDOW.shift();
    return WINDOW.reduce((s, x) => s + x, 0) / WINDOW.length;
  }

  // compute torso straightness angle using shoulder-hip-ankle (use both sides avg)
  function torsoAngle(keypoints) {
    const lShoulder = keypoints[11], lHip = keypoints[23], lAnkle = keypoints[27];
    const rShoulder = keypoints[12], rHip = keypoints[24], rAnkle = keypoints[28];
    let left = null, right = null;
    if (lShoulder && lHip && lAnkle && (lShoulder.visibility ?? 0) >= VIS) left = angleBetween(lShoulder, lHip, lAnkle);
    if (rShoulder && rHip && rAnkle && (rShoulder.visibility ?? 0) >= VIS) right = angleBetween(rShoulder, rHip, rAnkle);
    if (left && right) return (left + right) / 2;
    return left ?? right ?? null;
  }

  // score: angle close to 180 is perfect; map |180 - angle| to score
  function computeScore(angle) {
    if (!angle) return 0;
    const diff = Math.abs(180 - angle);
    // diff 0 -> 100, diff 20 -> 0
    if (diff <= 0) return 100;
    if (diff >= 20) return 0;
    return Math.round((1 - diff / 20) * 100);
  }

  function update(keypoints) {
    const angle = torsoAngle(keypoints);
    if (!angle) {
      // reset hold if no torso
      holdStart = null;
      running = false;
      holdSeconds = 0;
      return { holdSeconds, feedback: "Show torso", score: 0, active: false, meta: {} };
    }

    const smoothed = smooth(angle);
    const instantScore = computeScore(smoothed);
    score = Math.round(instantScore);

    // consider active if score >= 40 (some threshold)
    if (instantScore >= 40) {
      if (!running) {
        running = true;
        holdStart = holdStart || Date.now();
      }
      holdSeconds = Math.floor((Date.now() - (holdStart || Date.now())) / 1000);
      return {
        holdSeconds,
        feedback: `Holding — ${holdSeconds}s`,
        score,
        active: true,
        meta: { holdStart: holdStart ? new Date(holdStart).toISOString() : null }
      };
    } else {
      // not holding / break
      holdStart = null;
      running = false;
      holdSeconds = 0;
      return { holdSeconds, feedback: "Plank not steady", score: 0, active: false, meta: {} };
    }
  }

  function reset() {
    holdStart = null;
    holdSeconds = 0;
    running = false;
    score = 0;
    WINDOW.length = 0;
  }

  return { update, reset };
}
