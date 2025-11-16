// frontend/src/pages/Workout.jsx
import React, { useState, useRef, useEffect, useCallback } from "react";
import PoseEngine from "../core/PoseEngine";
import wrapDetector from "../core/detectorWrapper"; 
import createBicepDetector from "../exercises/bicepCurl";
import createSquatDetector from "../exercises/squat";
import createPushUpDetector from "../exercises/pushUp";
import createLungeDetector from "../exercises/lunge";
import ExerciseInstructions from "../components/ExerciseInstructions";
import createPlankDetector from "../exercises/plank";
import createTreePoseDetector from "../exercises/treePose";
import axios from "../utils/api";
import { hasEnoughPose, hasEnoughUpperBody } from "../core/frameUtils";

export default function Workout() {
  const [exercise, setExercise] = useState("bicep");
  const [running, setRunning] = useState(false);
  const [reps, setReps] = useState(0); 
  const [feedback, setFeedback] = useState(""); 
  const [score, setScore] = useState(0); 
  const [perRep, setPerRep] = useState([]); 
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  const lastRecordedRepRef = useRef(0);
  const detectorRef = useRef(null);
  const currentExerciseRef = useRef(exercise);
  const startTimeRef = useRef(null);

  // Voice feedback logic
  useEffect(() => {
    if (!voiceEnabled) return; 
    if (!perRep || perRep.length === 0) return;

    const lastIndex = perRep.length;
    const text = `Rep ${lastIndex}`;

    try {
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = "en-US";
      utter.rate = 0.95;
      window.speechSynthesis.cancel(); // Stop previous speech
      window.speechSynthesis.speak(utter);
    } catch (e) {
      console.warn("Speech not supported:", e);
    }
  }, [perRep, voiceEnabled]);

  // Initialize detector with wrapper for fast feedback
  const initDetector = useCallback((name) => {
    let detector;
    if (name === "bicep") detector = createBicepDetector();
    else if (name === "squat") detector = createSquatDetector();
    else if (name === "pushup") detector = createPushUpDetector();
    else if (name === "lunge") detector = createLungeDetector();
    else if (name === "plank") detector = createPlankDetector();
    else if (name === "tree") detector = createTreePoseDetector();
    else detector = createBicepDetector();
    
    return wrapDetector(detector, { smoothWindow: 3, consecutive: 2 });
  }, []);

  // Reset state when exercise changes
  useEffect(() => {
    if (!running) {
      detectorRef.current = initDetector(exercise);
      currentExerciseRef.current = exercise;
      setReps(0);
      setFeedback("");
      setScore(0);
      setPerRep([]);
      lastRecordedRepRef.current = 0;
    }
  }, [exercise, running, initDetector]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      detectorRef.current?.reset?.();
      detectorRef.current = null;
    };
  }, []);

  // --- STABLE POSE LOGIC START ---
  // We use a ref to hold the latest logic function so 'onResultsStable' never changes
  const handleLogicRef = useRef(null);

  function handlePoseLogic({ keypoints, canvasWidth, canvasHeight }) {
    if (!running) return;

    if (!keypoints || keypoints.length === 0) {
      setFeedback("No pose detected");
      return;
    }

    if (exercise === "bicep") {
      if (!hasEnoughUpperBody(keypoints, canvasWidth, canvasHeight)) {
        setFeedback("Bring your upper body into frame");
        return;
      }
    } else {
      if (!hasEnoughPose(keypoints, canvasWidth, canvasHeight)) {
        setFeedback("Move whole body into frame");
        return;
      }
    }

    // Re-init detector if missing or mismatched
    if (!detectorRef.current || currentExerciseRef.current !== exercise) {
      detectorRef.current = initDetector(exercise);
      currentExerciseRef.current = exercise;
      try { detectorRef.current.reset?.(); } catch(e) { /* ignore */ }
    }

    try {
      const out = detectorRef.current.update(keypoints) || {};
      
      // Reps Logic
      if (out.reps !== undefined) {
        const newReps = out.reps;

        // Only record if rep count INCREASED
        if (newReps > lastRecordedRepRef.current) {
          const repScore = (out.meta && out.meta.repScore) ?? out.score ?? 0;
          const now = new Date();
          const repEntry = {
            timestamp: now.toISOString(),
            score: repScore,
            meta: out.meta ?? {}
          };

          setPerRep(prev => [...prev, repEntry]);
          setReps(newReps);
          lastRecordedRepRef.current = newReps;

          console.log("Recorded new rep:", newReps);
        } else {
          // Ensure UI stays in sync even if not a new rep
          setReps(newReps); 
        }
      }

      if (out.holdSeconds !== undefined) {
        setReps(out.holdSeconds);
      }
      
      // Direct updates for instant feedback
      if (out.feedback) setFeedback(out.feedback);
      if (out.score !== undefined) setScore(Math.round(out.score));

    } catch (err) {
      console.error("Detector update error:", err);
      setFeedback("Detection error");
    }
  }

  // Update the ref every render to point to the latest state/logic
  useEffect(() => {
    handleLogicRef.current = handlePoseLogic;
  });

  // This is the ONLY function passed to PoseEngine. It NEVER changes identity.
  // This prevents PoseEngine from restarting the camera on every rep.
  const onResultsStable = useCallback((data) => {
    if (handleLogicRef.current) {
      handleLogicRef.current(data);
    }
  }, []);
  // --- STABLE POSE LOGIC END ---


  const toggle = useCallback(() => {
    if (running) {
      setRunning(false);
      setFeedback("Stopped");
    } else {
      detectorRef.current = initDetector(exercise);
      currentExerciseRef.current = exercise;
      detectorRef.current.reset?.();
      
      setReps(0);
      setFeedback("Starting...");
      setScore(0);
      setPerRep([]);
      lastRecordedRepRef.current = 0;
      startTimeRef.current = Date.now();
      setRunning(true);
    }
  }, [running, exercise, initDetector]);

  const saveSession = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const duration = startTimeRef.current ? Math.round((Date.now() - startTimeRef.current) / 1000) : 0;

      let sessionScore = 0;
      if (perRep && perRep.length > 0) {
        const repScores = perRep.map(r => {
          if (r.meta && typeof r.meta.repScore === "number") return r.meta.repScore;
          if (typeof r.score === "number") return r.score;
          return 0;
        });
        const sum = repScores.reduce((s, x) => s + x, 0);
        sessionScore = Math.round(sum / repScores.length);
      } else {
        sessionScore = Math.round(score || 0);
      }

      const body = {
        exercise: exercise === "bicep" ? "Bicep Curl" :
                  exercise === "squat" ? "Squat" :
                  exercise === "pushup" ? "Push-Ups" :
                  exercise === "lunge" ? "Lunges" :
                  exercise === "plank" ? "Plank" :
                  exercise === "tree" ? "Tree Pose" : exercise,
        reps,
        duration,
        score: sessionScore,
        details: { feedback },
        perRep 
      };

      console.log("Saving session payload:", body);
      await axios.post("/api/sessions", body, { headers: { Authorization: `Bearer ${token}` } });
      alert("Session saved");
    } catch (err) {
      console.error("Save session failed:", err);
      alert("Save failed: " + (err.response?.data?.msg || err.message));
    }
  }, [exercise, reps, feedback, perRep, score]);

  // Stable handlers for inputs
  const handleExerciseChange = useCallback((e) => setExercise(e.target.value), []);
  const handleVoiceChange = useCallback((e) => setVoiceEnabled(e.target.checked), []);

  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="bg-white p-4 rounded shadow mb-4 flex gap-4 items-center">
        <select value={exercise} onChange={handleExerciseChange} className="border px-3 py-2 rounded">
          <option value="bicep">Bicep Curl</option>
          <option value="squat">Squat</option>
          <option value="pushup">Push-Ups</option>
          <option value="lunge">Lunges</option>
          <option value="plank">Plank (hold)</option>
          <option value="tree">Tree Pose (yoga)</option>
        </select>

        <button onClick={toggle} className="px-4 py-2 bg-indigo-600 text-white rounded">
          {running ? "Stop" : "Start"}
        </button>
        <button onClick={saveSession} className="px-3 py-1 border rounded">Save Session</button>

        <div className="ml-auto text-sm text-slate-600">Reps: <strong>{reps}</strong></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded shadow">
          {/* processEvery={1} for max smoothness, since we fixed the lag logic */}
          <PoseEngine onResults={onResultsStable} processEvery={1} width={640} height={480} />
        </div>

        <div className="bg-white p-4 rounded shadow workout-right">
          <h3 className="font-semibold">{exercise.charAt(0).toUpperCase() + exercise.slice(1)}</h3>

          <div className="text-sm text-slate-500">Status: {running ? "Running" : "Stopped"}</div>
          <div className="pt-2">
            <div className="text-sm text-slate-600">Feedback</div>
            <div className="p-3 border rounded mt-2 feedback-box">{feedback}</div>
          </div>

          <div className="pt-2">
            <div className="text-sm text-slate-600">Score</div>
            <div className="text-xl font-bold">{Math.round(score)}</div>
          </div>
          
          <div className="mt-3 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={voiceEnabled}
              onChange={handleVoiceChange}
            />
            <span>Voice Rep Count</span>
          </div>

          <div className="pt-4">
            <div className="text-sm text-slate-600">Per-rep details</div>
            <div className="mt-2 text-xs text-slate-600">
              {perRep.length === 0 ? <span className="italic">No reps yet</span> : (
                <ol className="list-decimal list-inside">
                  {perRep.map((r, i) => (
                    <li key={i}>
                      {new Date(r.timestamp).toLocaleTimeString()} — score: {Math.round(r.score)}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>

        </div>
      </div>
      <div className="mt-3">
        <ExerciseInstructions exercise={exercise} />
      </div>
    </div>
  );
}