// frontend/src/exercises/lunge.js
import { angleBetween } from "../core/angleUtils";

export default function createLungeDetector() {
  // We'll detect a lunge rep based on front-knee angle dip and return meta for that front leg.
  let stage = "up";
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
  const VIS = 0.35;
  const HOLD_FRAMES = 4;

  function smooth(v) {
    WINDOW.push(v);
    if (WINDOW.length > MAX_WINDOW) WINDOW.shift();
    return WINDOW.reduce((s, x) => s + x, 0) / WINDOW.length;
  }

  // compute knee angle for both legs; we will pick the leg that dips (smaller angle) as front leg
  function kneeAngles(keypoints) {
    const lHip = keypoints[23], lKnee = keypoints[25], lAnkle = keypoints[27];
    const rHip = keypoints[24], rKnee = keypoints[26], rAnkle = keypoints[28];
    const left = (lHip && lKnee && lAnkle && (lHip.visibility ?? 0) >= VIS) ? angleBetween(lHip, lKnee, lAnkle) : null;
    const right = (rHip && rKnee && rAnkle && (rHip.visibility ?? 0) >= VIS) ? angleBetween(rHip, rKnee, rAnkle) : null;
    return { left, right };
  }

  function computeScore(kneeAngle) {
    // deeper lunge => smaller knee angle (better). Map [DEEP..STAND] => 100..0
    const DEEP = 100;
    const STAND = 170;
    if (kneeAngle <= DEEP) return 100;
    if (kneeAngle >= STAND) return 0;
    const ratio = (STAND - kneeAngle) / (STAND - DEEP);
    return Math.round(Math.max(0, Math.min(100, ratio * 100)));
  }

  function update(keypoints) {
    const { left, right } = kneeAngles(keypoints);
    if (!left && !right) return { reps, feedback: "Show legs", active: false, meta: {} };
    // pick front leg as the one with smaller knee angle (assuming step forward)
    let rawAngle = null;
    let leg = "left";
    if (left && right) {
      if (left < right) { rawAngle = left; leg = "left"; } else { rawAngle = right; leg = "right"; }
    } else {
      rawAngle = left ?? right;
      leg = left ? "left" : "right";
    }

    const kneeAngle = smooth(rawAngle);
    if (stage === "down" || (stage === "up" && downFrames > 0)) {
      if (!repStartTs) repStartTs = Date.now();
      repMinKnee = Math.min(repMinKnee, kneeAngle);
      repMaxKnee = Math.max(repMaxKnee, kneeAngle);
    }

    const instantScore = computeScore(kneeAngle);
    if (instantScore > currentRepBestScore) currentRepBestScore = instantScore;

    const DOWN_ANGLE = 110; // knee angle <= this considered lunge down
    const UP_ANGLE = 170;

    let feedback = `${leg} knee ${Math.round(kneeAngle)}°`;

    if (kneeAngle <= DOWN_ANGLE) {
      downFrames += 1;
      upFrames = 0;
      if (stage === "up" && downFrames >= HOLD_FRAMES) {
        stage = "down";
        feedback = "Lunge down";
        if (!repStartTs) repStartTs = Date.now();
      } else feedback = "Holding down";
    } else if (kneeAngle >= UP_ANGLE) {
      upFrames += 1;
      downFrames = 0;
      if (stage === "down" && upFrames >= HOLD_FRAMES) {
        reps += 1;
        repEndTs = Date.now();
        const durationMs = repStartTs ? Math.max(0, repEndTs - repStartTs) : 0;
        const repScore = currentRepBestScore || instantScore || 0;
        const meta = {
          repScore,
          kneeMinAngle: Math.round(repMinKnee === Infinity ? kneeAngle : repMinKnee),
          kneeMaxAngle: Math.round(repMaxKnee === -Infinity ? kneeAngle : repMaxKnee),
          leg,
          startTimestamp: repStartTs ? new Date(repStartTs).toISOString() : new Date().toISOString(),
          endTimestamp: repEndTs ? new Date(repEndTs).toISOString() : new Date().toISOString(),
          durationMs
        };

        stage = "up";
        currentRepBestScore = 0;
        repStartTs = null;
        repEndTs = null;
        repMinKnee = Infinity;
        repMaxKnee = -Infinity;
        downFrames = 0;
        upFrames = 0;

        return { reps, feedback: "Good rep", kneeAngle: Math.round(kneeAngle), score: repScore, active: false, meta };
      } else feedback = "Returning";
    } else {
      upFrames = 0;
      downFrames = 0;
    }

    return { reps, feedback, kneeAngle: Math.round(kneeAngle), score: instantScore, active: stage === "down", meta: {} };
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
