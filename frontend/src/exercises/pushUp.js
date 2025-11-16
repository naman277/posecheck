// frontend/src/exercises/pushUp.js
import { angleBetween } from "../core/angleUtils";

export default function createPushUpDetector() {
  // use elbow angle averaged across arms; low angle = bottom (good)
  let stage = "up";
  let reps = 0;
  let downFrames = 0;
  let upFrames = 0;
  const WINDOW = [];
  const MAX_WINDOW = 6;
  let currentRepBestScore = 0;
  let repStartTs = null;
  let repEndTs = null;
  let repMinElbow = Infinity;
  let repMaxElbow = -Infinity;

  const VISIBILITY = 0.35;
  const HOLD_FRAMES = 3;

  function smooth(v) {
    WINDOW.push(v);
    if (WINDOW.length > MAX_WINDOW) WINDOW.shift();
    return WINDOW.reduce((s, x) => s + x, 0) / WINDOW.length;
  }

  function elbowAngleFromKeypoints(keypoints) {
    const lShoulder = keypoints[11], lElbow = keypoints[13], lWrist = keypoints[15];
    const rShoulder = keypoints[12], rElbow = keypoints[14], rWrist = keypoints[16];
    let left = null, right = null;
    if (lShoulder && lElbow && lWrist && (lShoulder.visibility ?? 0) >= VISIBILITY) left = angleBetween(lShoulder, lElbow, lWrist);
    if (rShoulder && rElbow && rWrist && (rShoulder.visibility ?? 0) >= VISIBILITY) right = angleBetween(rShoulder, rElbow, rWrist);
    if (left && right) return (left + right) / 2;
    return left ?? right ?? null;
  }

  function computeScore(elbowAngle) {
    // smaller elbowAngle (closer chest to floor) is better
    const BOTTOM = 65;  // <= this is good (bottom)
    const TOP = 165;    // >= this is top (worst)
    if (elbowAngle <= BOTTOM) return 100;
    if (elbowAngle >= TOP) return 0;
    const ratio = (TOP - elbowAngle) / (TOP - BOTTOM);
    return Math.round(Math.max(0, Math.min(100, ratio * 100)));
  }

  function update(keypoints) {
    const angle = elbowAngleFromKeypoints(keypoints);
    if (angle === null) return { reps, feedback: "Show arms/torso", active: false, meta: {} };

    const elbowAngle = smooth(angle);
    if (stage === "down" || (stage === "up" && downFrames > 0)) {
      if (!repStartTs) repStartTs = Date.now();
      repMinElbow = Math.min(repMinElbow, elbowAngle);
      repMaxElbow = Math.max(repMaxElbow, elbowAngle);
    }
    const instantScore = computeScore(elbowAngle);
    if (instantScore > currentRepBestScore) currentRepBestScore = instantScore;

    // thresholds
    const DOWN_ANGLE = 90; // elbow angle <= this considered bottom (count)
    const UP_ANGLE = 160;  // elbow angle >= this considered top

    let feedback = `Elbow ${Math.round(elbowAngle)}°`;

    if (elbowAngle <= DOWN_ANGLE) {
      downFrames += 1;
      upFrames = 0;
      if (stage === "up" && downFrames >= HOLD_FRAMES) {
        stage = "down";
        feedback = "Bottom";
        currentRepBestScore = Math.max(currentRepBestScore, instantScore);
        if (!repStartTs) repStartTs = Date.now();
      } else {
        feedback = "Lowering";
      }
    } else if (elbowAngle >= UP_ANGLE) {
      upFrames += 1;
      downFrames = 0;
      if (stage === "down" && upFrames >= HOLD_FRAMES) {
        reps += 1;
        repEndTs = Date.now();
        const durationMs = repStartTs ? Math.max(0, repEndTs - repStartTs) : 0;
        const repScore = currentRepBestScore || instantScore || 0;
        const meta = {
          repScore,
          elbowMinAngle: Math.round(repMinElbow === Infinity ? elbowAngle : repMinElbow),
          elbowMaxAngle: Math.round(repMaxElbow === -Infinity ? elbowAngle : repMaxElbow),
          startTimestamp: repStartTs ? new Date(repStartTs).toISOString() : new Date().toISOString(),
          endTimestamp: repEndTs ? new Date(repEndTs).toISOString() : new Date().toISOString(),
          durationMs
        };

        // reset
        stage = "up";
        currentRepBestScore = 0;
        repStartTs = null;
        repEndTs = null;
        repMinElbow = Infinity;
        repMaxElbow = -Infinity;
        downFrames = 0;
        upFrames = 0;

        return { reps, feedback: "Good rep", elbowAngle: Math.round(elbowAngle), score: repScore, active: false, meta };
      } else {
        feedback = "Rising";
      }
    } else {
      upFrames = 0;
      downFrames = 0;
    }

    return { reps, feedback, elbowAngle: Math.round(elbowAngle), score: instantScore, active: stage === "down", meta: {} };
  }

  function reset() {
    stage = "up";
    reps = 0;
    downFrames = 0;
    upFrames = 0;
    WINDOW.length = 0;
    currentRepBestScore = 0;
    repStartTs = null;
    repEndTs = null;
    repMinElbow = Infinity;
    repMaxElbow = -Infinity;
  }

  return { update, reset };
}
