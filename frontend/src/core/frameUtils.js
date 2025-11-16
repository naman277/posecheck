// frontend/src/core/frameUtils.js

export function hasEnoughPose(keypoints, canvasWidth, canvasHeight) {
  // previous full-body check (keeps as-is)
  const requiredIndices = [11, 12, 23, 24]; // shoulders and hips
  const optionalLeg = [25, 26, 27, 28];
  let ok = true;
  for (const idx of requiredIndices) {
    const kp = keypoints[idx];
    if (!kp || kp.visibility === undefined || kp.visibility < 0.4) { ok = false; break; }
  }
  if (!ok) return false;
  const legVisible = optionalLeg.some(i => keypoints[i] && keypoints[i].visibility > 0.4);
  if (!legVisible) return false;
  const vis = keypoints.filter(k => k && k.visibility > 0.4);
  if (vis.length < 6) return false;
  const xs = vis.map(k => k.x), ys = vis.map(k => k.y);
  const w = Math.max(...xs) - Math.min(...xs);
  const h = Math.max(...ys) - Math.min(...ys);
  const areaRatio = (w * h) / (canvasWidth * canvasHeight);
  return areaRatio > 0.025;
}

export function hasEnoughUpperBody(keypoints, canvasWidth, canvasHeight) {
  // Require shoulders, elbows, wrists visible with decent visibility
  const indices = [11, 12, 13, 14, 15, 16]; // left/right shoulders, elbows, wrists
  const visCount = indices.reduce((c, i) => (keypoints[i] && keypoints[i].visibility > 0.45 ? c + 1 : c), 0);
  // need at least 4 of 6 key upper-body points visible
  if (visCount < 4) return false;

  // bounding box of visible upper-body points should be a reasonable size
  const vis = indices.map(i => keypoints[i]).filter(Boolean).filter(k => k.visibility > 0.3);
  if (vis.length === 0) return false;
  const xs = vis.map(k => k.x), ys = vis.map(k => k.y);
  const w = Math.max(...xs) - Math.min(...xs);
  const h = Math.max(...ys) - Math.min(...ys);
  const areaRatio = (w * h) / (canvasWidth * canvasHeight);
  return areaRatio > 0.01; // smaller area requirement than full body
}
