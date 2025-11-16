// frontend/src/exercises/bicepCurl.js
import { angleBetween } from "../core/angleUtils";

export default function createBicepDetector() {
  let stage = "down"; // expected start position
  let reps = 0;
  let upFrames = 0;
  let downFrames = 0;

  // smoothing window
  const WINDOW = [];
  const MAX_WINDOW = 6;

  // Best-score tracking for the current rep
  let currentRepBestScore = 0;

  // Track angle extrema & timestamps for current active rep
  let repStartTs = null;
  let repEndTs = null;
  let repMinAngle = Infinity; // smallest angle seen (most curled)
  let repMaxAngle = -Infinity; // largest angle seen (most extended)

  const VISIBILITY_THRESHOLD = 0.4;
  const HOLD_FRAMES_TO_CONFIRM = 4; // frames required to confirm position change

  function smooth(v) {
    WINDOW.push(v);
    if (WINDOW.length > MAX_WINDOW) WINDOW.shift();
    const sum = WINDOW.reduce((s, x) => s + x, 0);
    return sum / WINDOW.length;
  }

  function computeScore(elbowAngle) {
    const UP_ANGLE = 50;
    const DOWN_ANGLE = 150;
    if (elbowAngle <= UP_ANGLE) return 100;
    if (elbowAngle >= DOWN_ANGLE) return 0;
    const ratio = (DOWN_ANGLE - elbowAngle) / (DOWN_ANGLE - UP_ANGLE);
    return Math.round(Math.max(0, Math.min(100, ratio * 100)));
  }

  function update(keypoints) {
    // MediaPipe indices: 12=RShoulder, 14=RElbow, 16=RWrist
    const rShoulder = keypoints[12];
    const rElbow = keypoints[14];
    const rWrist = keypoints[16];

    if (!rShoulder || !rElbow || !rWrist) {
      return { reps, feedback: "Show your right arm fully", active: false, meta: {} };
    }
    if ((rShoulder.visibility ?? 0) < VISIBILITY_THRESHOLD || (rElbow.visibility ?? 0) < VISIBILITY_THRESHOLD) {
      return { reps, feedback: "Bring right arm closer to camera", active: false, meta: {} };
    }

    const rawAngle = angleBetween(rShoulder, rElbow, rWrist);
    const elbowAngle = smooth(rawAngle);
    const instantScore = computeScore(elbowAngle);

    // maintain extrema and best score if a rep is active (in progress)
    if (stage === "up" || (stage === "down" && upFrames > 0)) {
      // if we have started moving up, ensure start timestamp exists
      if (!repStartTs) repStartTs = Date.now();
      if (elbowAngle < repMinAngle) repMinAngle = elbowAngle;
      if (elbowAngle > repMaxAngle) repMaxAngle = elbowAngle;
    }

    if (instantScore > currentRepBestScore) currentRepBestScore = instantScore;

    const UP_ANGLE = 50;
    const DOWN_ANGLE = 150;
    let feedback = `Elbow ${Math.round(elbowAngle)}° — score ${instantScore}`;

    // detect up
    if (elbowAngle <= UP_ANGLE) {
      upFrames += 1;
      downFrames = 0;
      if (stage === "down" && upFrames >= HOLD_FRAMES_TO_CONFIRM) {
        stage = "up";
        feedback = "Curl up";
        // mark rep start
        if (!repStartTs) repStartTs = Date.now();
        // reset extrema for this rep
        repMinAngle = Math.min(repMinAngle, elbowAngle);
        repMaxAngle = Math.max(repMaxAngle, elbowAngle);
        currentRepBestScore = Math.max(currentRepBestScore, instantScore);
      } else {
        feedback = "Holding up";
      }
    }
    // detect down
    else if (elbowAngle >= DOWN_ANGLE) {
      downFrames += 1;
      upFrames = 0;
      if (stage === "up" && downFrames >= HOLD_FRAMES_TO_CONFIRM) {
        // Completed one rep — assemble meta and return it
        reps += 1;
        repEndTs = Date.now();
        const durationMs = repStartTs ? Math.max(0, repEndTs - repStartTs) : 0;
        const repScore = currentRepBestScore || instantScore || 0;

        // prepare meta
        const meta = {
          repScore,
          elbowMinAngle: Math.round(repMinAngle === Infinity ? elbowAngle : repMinAngle),
          elbowMaxAngle: Math.round(repMaxAngle === -Infinity ? elbowAngle : repMaxAngle),
          startTimestamp: repStartTs ? new Date(repStartTs).toISOString() : new Date().toISOString(),
          endTimestamp: repEndTs ? new Date(repEndTs).toISOString() : new Date().toISOString(),
          durationMs
        };

        // reset rep trackers for next rep
        stage = "down";
        currentRepBestScore = 0;
        repStartTs = null;
        repEndTs = null;
        repMinAngle = Infinity;
        repMaxAngle = -Infinity;
        upFrames = 0;
        downFrames = 0;

        feedback = "Good rep";
        return { reps, feedback, elbowAngle: Math.round(elbowAngle), score: repScore, active: false, meta };
      } else {
        feedback = "Extending";
      }
    } else {
      // middle position — reset transient counters (but keep repStart if already set)
      upFrames = 0;
      downFrames = 0;
      // update extrema if repStart exists
      if (repStartTs) {
        repMinAngle = Math.min(repMinAngle, elbowAngle);
        repMaxAngle = Math.max(repMaxAngle, elbowAngle);
      }
    }

    return { reps, feedback, elbowAngle: Math.round(elbowAngle), score: instantScore, active: stage === "up", meta: {} };
  }

  function reset() {
    stage = "down";
    reps = 0;
    upFrames = 0;
    downFrames = 0;
    WINDOW.length = 0;
    currentRepBestScore = 0;
    repStartTs = null;
    repEndTs = null;
    repMinAngle = Infinity;
    repMaxAngle = -Infinity;
  }

  return { update, reset };
}
