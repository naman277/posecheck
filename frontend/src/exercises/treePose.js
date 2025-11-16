// frontend/src/exercises/treePose.js
import { angleBetween } from "../core/angleUtils";

export default function createTreePoseDetector() {
  // Tree pose: detect hold of a single-leg stance by checking supporting-leg knee angle ~ straight
  // and hip stability (small movement of hip x-position can be later added)
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

  function kneeAngles(keypoints) {
    const lHip = keypoints[23], lKnee = keypoints[25], lAnkle = keypoints[27];
    const rHip = keypoints[24], rKnee = keypoints[26], rAnkle = keypoints[28];
    let left = null, right = null;
    if (lHip && lKnee && lAnkle && (lHip.visibility ?? 0) >= VIS) left = angleBetween(lHip, lKnee, lAnkle);
    if (rHip && rKnee && rAnkle && (rHip.visibility ?? 0) >= VIS) right = angleBetween(rHip, rKnee, rAnkle);
    return { left, right };
  }

  function computeScore(kneeAngle) {
    // supporting leg knee should be near straight (>= 160)
    if (kneeAngle >= 165) return 100;
    if (kneeAngle <= 120) return 0;
    const ratio = (kneeAngle - 120) / (165 - 120);
    return Math.round(Math.max(0, Math.min(100, ratio * 100)));
  }

  function update(keypoints) {
    const { left, right } = kneeAngles(keypoints);
    if (!left && !right) {
      holdingReset();
      return { holdSeconds, feedback: "Show legs", score: 0, active: false, meta: {} };
    }

    // pick supporting leg as the straighter knee (larger angle)
    let supportAngle = null, leg = "right";
    if (left && right) {
      if (left > right) { supportAngle = left; leg = "left"; } else { supportAngle = right; leg = "right"; }
    } else {
      supportAngle = left ?? right;
      leg = left ? "left" : "right";
    }

    const angle = smooth(supportAngle);
    const instantScore = computeScore(angle);
    score = instantScore;

    if (instantScore >= 50) {
      if (!running) {
        running = true;
        holdStart = holdStart || Date.now();
      }
      holdSeconds = Math.floor((Date.now() - holdStart) / 1000);
      return { holdSeconds, feedback: `Holding ${leg}`, score: Math.round(score), active: true, meta: { leg } };
    } else {
      holdingReset();
      return { holdSeconds, feedback: "Not steady", score: 0, active: false, meta: {} };
    }
  }

  function holdingReset() {
    holdStart = null;
    holdSeconds = 0;
    running = false;
    score = 0;
    WINDOW.length = 0;
  }

  function reset() {
    holdingReset();
  }

  return { update, reset };
}
