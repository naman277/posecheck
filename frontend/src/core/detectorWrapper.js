// detectorWrapper.js
// Wraps a detector object that exposes update(keypoints) and reset()
export default function wrapDetector(detector, opts = {}) {
  const { smoothWindow = 5, consecutive = 4 } = opts;
  // store last angles or last booleans per detector - we will use angle smoothing inside detector by passing smoothed angles
  let frameBuffer = [];
  let stableCount = 0;
  let lastStableState = null;

  return {
    update: (keypoints) => {
      // call detector temporarily to get raw info but detector implementations should return measurable numeric field (e.g., elbowAngle or kneeAngle)
      const out = detector.update(keypoints) || {};
      // we will choose a representative numeric metric if present
      const metric = out.elbowAngle ?? out.kneeAngle ?? out.bodyAngle ?? out.holdSeconds ?? 0;

      // smoothing buffer
      frameBuffer.push(metric);
      if (frameBuffer.length > smoothWindow) frameBuffer.shift();
      const avg = frameBuffer.reduce((s, v) => s + v, 0) / frameBuffer.length;

      // decide boolean state - detector implementations should set a boolean `active` when in target position.
      // If they didn't, we fallback to numeric heuristics: active if metric below a threshold in the detector logic.
      const active = out.active !== undefined ? out.active : (avg < 100); // fallback heuristic

      if (active === lastStableState) {
        stableCount += 1;
      } else {
        stableCount = 1;
        lastStableState = active;
      }

      // only publish state when stableCount >= consecutive
      const stable = stableCount >= consecutive;

      // build returned object: prefer detector output but attach smoothed metric and stable flag
      return { ...out, smoothedMetric: avg, stable };
    },
    reset: () => {
      frameBuffer = [];
      stableCount = 0;
      lastStableState = null;
      detector.reset && detector.reset();
    }
  };
}
