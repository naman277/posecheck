// frontend/src/core/detectorWrapper.js
// Wraps a detector object that exposes update(keypoints) and reset()
export default function wrapDetector(detector, opts = {}) {
  // REDUCED DEFAULTS: 
  // smoothWindow=3 (smoother angles), consecutive=2 (faster state change)
  const { smoothWindow = 3, consecutive = 2 } = opts; 
  
  let frameBuffer = [];
  let stableCount = 0;
  let lastStableState = null;
  let lastStableOut = {}; // Store the last output that was considered stable

  return {
    update: (keypoints) => {
      const out = detector.update(keypoints) || {};
      const metric = out.elbowAngle ?? out.kneeAngle ?? out.bodyAngle ?? out.holdSeconds ?? 0;

      // 1. Smoothing
      frameBuffer.push(metric);
      if (frameBuffer.length > smoothWindow) frameBuffer.shift();
      const avg = frameBuffer.reduce((s, v) => s + v, 0) / frameBuffer.length;

      // decide boolean state - fallback heuristic
      const active = out.active !== undefined ? out.active : (avg < 100); 

      // 2. Stability Check
      if (active === lastStableState) {
        stableCount += 1;
      } else {
        stableCount = 1;
        lastStableState = active;
      }
      const stable = stableCount >= consecutive;
      
      let finalOut = { ...out };

      // 3. CRITICAL: Throttle Feedback/Score based on stability
      if (stable) {
          // If stable, save the result and allow new feedback/score to pass through
          lastStableOut = { ...out, smoothedMetric: avg, stable: true }; 
      } else {
          // If UNSTABLE, suppress continuous feedback and score changes 
          // by passing the last stable values, preventing flicker and lag
          finalOut = {
              ...out,
              feedback: lastStableOut.feedback || "Adjust Pose",
              score: lastStableOut.score || 0
          };
      }
      
      // Merge with the calculated stability flag
      return { ...finalOut, smoothedMetric: avg, stable };
    },
    reset: () => {
      frameBuffer = [];
      stableCount = 0;
      lastStableState = null;
      lastStableOut = {}; // Reset stable output buffer
      detector.reset && detector.reset();
    }
  };
}