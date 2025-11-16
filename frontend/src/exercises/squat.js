// frontend/src/exercises/squat.js
import { angleBetween } from "../core/angleUtils";

export default function createSquatDetector() {
  // We'll use knee angle (hip - knee - ankle) averaged across both legs when available
  let stage = "up"; // expect standing start
  let reps = 0;
  let downFrames = 0;
  let upFrames = 0;
  const WINDOW = [];
  const MAX_WINDOW = 6;
  let currentRepBestScore = 0;
  let repStartTs = null;
  let repEndTs = null;
  let repMinKnee = Infinity;
  let repMaxKnee = -Infinity;

  const VISIBILITY_THRESHOLD = 0.35;
  const HOLD_FRAMES = 4;

  function smooth(v) {
    WINDOW.push(v);
    if (WINDOW.length > MAX_WINDOW) WINDOW.shift();
    return WINDOW.reduce((s, x) => s + x, 0) / WINDOW.length;
  }

  function computeKneeAngleL(keypoints) {
    const lHip = keypoints[23], lKnee = keypoints[25], lAnkle = keypoints[27];
    if (!lHip || !lKnee || !lAnkle) return null;
    return angleBetween(lHip, lKnee, lAnkle);
  }
  function computeKneeAngleR(keypoints) {
    const rHip = keypoints[24], rKnee = keypoints[26], rAnkle = keypoints[28];
    if (!rHip || !rKnee || !rAnkle) return null;
    return angleBetween(rHip, rKnee, rAnkle);
  }

  // scoring: deeper squat => smaller knee angle; map kneeAngle from [DOWN_ANGLE..UP_ANGLE] to 100..0
  function computeScore(kneeAngle) {
    const DEEP = 95;   // knee angle <= this considered deep squat (best)
    const STAND = 170; // knee angle >= this considered standing (worst)
    if (kneeAngle <= DEEP) return 100;
    if (kneeAngle >= STAND) return 0;
    const ratio = (STAND - kneeAngle) / (STAND - DEEP);
    return Math.round(Math.max(0, Math.min(100, ratio * 100)));
  }

  function update(keypoints) {
    // require hips visible
    const lHip = keypoints[23], rHip = keypoints[24];
    if ((!lHip || (lHip.visibility ?? 0) < VISIBILITY_THRESHOLD) && (!rHip || (rHip.visibility ?? 0) < VISIBILITY_THRESHOLD)) {
      return { reps, feedback: "Show hips/legs", active: false, meta: {} };
    }

    const lKneeAngle = computeKneeAngleL(keypoints);
    const rKneeAngle = computeKneeAngleR(keypoints);
    let rawAngle = null;
    if (lKneeAngle && rKneeAngle) rawAngle = (lKneeAngle + rKneeAngle) / 2;
    else rawAngle = lKneeAngle ?? rKneeAngle;

    if (!rawAngle) return { reps, feedback: "Show knees/ankles", active: false, meta: {} };

    const kneeAngle = smooth(rawAngle);
    const score = computeScore(kneeAngle);
    if (stage === "down" || (stage === "up" && downFrames > 0)) {
      if (!repStartTs) repStartTs = Date.now();
      repMinKnee = Math.min(repMinKnee, kneeAngle);
      repMaxKnee = Math.max(repMaxKnee, kneeAngle);
    }
    if (score > currentRepBestScore) currentRepBestScore = score;

    // define thresholds for detecting squat down/up
    const DOWN_ANGLE = 110; // knee angle <= this considered "down" (squat)
    const UP_ANGLE = 165;   // knee angle >= this considered standing

    let feedback = `Knee ${Math.round(kneeAngle)}°`;

    if (kneeAngle <= DOWN_ANGLE) {
      downFrames += 1;
      upFrames = 0;
      if (stage === "up" && downFrames >= HOLD_FRAMES) {
        stage = "down";
        feedback = "Squat down";
        if (!repStartTs) repStartTs = Date.now();
        currentRepBestScore = Math.max(currentRepBestScore, score);
      } else {
        feedback = "Holding down";
      }
    } else if (kneeAngle >= UP_ANGLE) {
      upFrames += 1;
      downFrames = 0;
      if (stage === "down" && upFrames >= HOLD_FRAMES) {
        // rep complete
        reps += 1;
        repEndTs = Date.now();
        const durationMs = repStartTs ? Math.max(0, repEndTs - repStartTs) : 0;
        const repScore = currentRepBestScore || score || 0;
        const meta = {
          repScore,
          kneeMinAngle: Math.round(repMinKnee === Infinity ? kneeAngle : repMinKnee),
          kneeMaxAngle: Math.round(repMaxKnee === -Infinity ? kneeAngle : repMaxKnee),
          startTimestamp: repStartTs ? new Date(repStartTs).toISOString() : new Date().toISOString(),
          endTimestamp: repEndTs ? new Date(repEndTs).toISOString() : new Date().toISOString(),
          durationMs
        };

        // reset
        stage = "up";
        currentRepBestScore = 0;
        repStartTs = null;
        repEndTs = null;
        repMinKnee = Infinity;
        repMaxKnee = -Infinity;
        downFrames = 0;
        upFrames = 0;

        return { reps, feedback: "Good rep", kneeAngle: Math.round(kneeAngle), score: repScore, active: false, meta };
      } else {
        feedback = "Standing";
      }
    } else {
      upFrames = 0;
      downFrames = 0;
    }

    return { reps, feedback, kneeAngle: Math.round(kneeAngle), score, active: stage === "down", meta: {} };
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
    repMinKnee = Infinity;
    repMaxKnee = -Infinity;
  }

  return { update, reset };
}
