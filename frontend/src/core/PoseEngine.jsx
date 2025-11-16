// frontend/src/core/PoseEngine.jsx
import React, { useEffect, useRef } from "react";
import { Pose } from "@mediapipe/pose";
import { Camera } from "@mediapipe/camera_utils";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";

export default function PoseEngine({ onResults, processEvery = 1, width = 640, height = 480 }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const cameraRef = useRef(null);
  const poseRef = useRef(null);
  const frameCount = useRef(0);

  useEffect(() => {
    if (!videoRef.current) return;

    const pose = new Pose({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
    });

    pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    pose.onResults((results) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");

      if (videoRef.current && videoRef.current.videoWidth) {
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
      } else {
        canvas.width = width;
        canvas.height = height;
      }

      if (results.image) {
        ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }

      if (results.poseLandmarks) {
        drawConnectors(ctx, results.poseLandmarks, Pose.POSE_CONNECTIONS, { color: "#00FF00", lineWidth: 2 });
        drawLandmarks(ctx, results.poseLandmarks, { color: "#FF0000", lineWidth: 1 });
      }

      const keypoints = (results.poseLandmarks || []).map((lm) => ({
        x: lm.x * canvas.width,
        y: lm.y * canvas.height,
        z: lm.z,
        visibility: lm.visibility ?? 0,
      }));

      if (onResults) onResults({ keypoints, image: results.image, canvasWidth: canvas.width, canvasHeight: canvas.height });
    });

    poseRef.current = pose;

    const camera = new Camera(videoRef.current, {
     onFrame: async () => {
        frameCount.current += 1;
        // If the frame count is a multiple of processEvery, send the frame to the pose model.
        if (frameCount.current % processEvery === 0) {
          await pose.send({ image: videoRef.current });
        } else {
          // If the frame is skipped, we don't draw it here. 
          // We let the last processed frame/drawing persist.
          // If we tried to draw every frame here, it would draw the raw video feed, 
          // but the next `pose.onResults` (which draws the landmarks) is still coming 
          // asynchronously, leading to flicker/stutter.
          // We rely purely on pose.onResults for rendering the canvas.
          // If processEvery is 1 (default), it runs on every frame.
        }
      },
      width,
      height,
    });
    camera.start();
    cameraRef.current = camera;

    return () => {
      cameraRef.current?.stop();
      poseRef.current?.close?.();
    };
  }, [onResults, processEvery, width, height]);

  return (
    <div style={{ position: "relative", width: "100%", paddingTop: "75%" }}>
      <video ref={videoRef} style={{ display: "none" }} playsInline muted />
      <canvas ref={canvasRef} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", borderRadius: 8 }} />
    </div>
  );
}
