// frontend/src/pages/Workout.jsx
import React, { useState, useRef, useEffect } from "react";
import PoseEngine from "../core/PoseEngine";
import createBicepDetector from "../exercises/bicepCurl";
import createSquatDetector from "../exercises/squat";
import createPushUpDetector from "../exercises/pushUp";
import wrapDetector from "../core/detectorWrapper";
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
  const lastRecordedRepRef = useRef(0);
  const [feedback, setFeedback] = useState(""); 
  const [score, setScore] = useState(0); 
  const [perRep, setPerRep] = useState([]); 
  const detectorRef = useRef(null);
  const currentExerciseRef = useRef(exercise);
  const startTimeRef = useRef(null);
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  // 🛠️ THROTTLING REFS: Holds the fastest, unstable values from handleResults
  const unstableFeedbackRef = useRef(""); 
  const unstableScoreRef = useRef(0);
  const unstableRepsRef = useRef(0); 

  // THROTTLING EFFECT: Update all continuous display states at a steady rate
  useEffect(() => {
    const intervalId = setInterval(() => {
      setFeedback(unstableFeedbackRef.current);
      setScore(unstableScoreRef.current);
      setReps(unstableRepsRef.current); 
    }, 80); // 80ms for smooth UI updates (12.5 FPS)

    return () => clearInterval(intervalId);
  }, []); // Run ONLY ONCE on mount

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
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utter);
    } catch (e) {
      console.warn("Speech not supported:", e);
    }
  }, [perRep, voiceEnabled]);


  function initDetector(name) {
    let detector;
    if (name === "bicep") detector = createBicepDetector();
    else if (name === "squat") detector = createSquatDetector();
    else if (name === "pushup") detector = createPushUpDetector();
    else if (name === "lunge") detector = createLungeDetector();
    else if (name === "plank") detector = createPlankDetector();
    else if (name === "tree") detector = createTreePoseDetector();
    else detector = createBicepDetector();
    
    // Wrap the raw detector to apply the fast-feedback logic
    return wrapDetector(detector, { smoothWindow: 3, consecutive: 2 });
  }

  useEffect(() => {
    if (!running) {
      detectorRef.current = initDetector(exercise);
      currentExerciseRef.current = exercise;
      // Reset all states and refs
      setReps(0);
      unstableRepsRef.current = 0; 
      setFeedback("");
      unstableFeedbackRef.current = ""; 
      setScore(0);
      unstableScoreRef.current = 0; 
      setPerRep([]);
      lastRecordedRepRef.current = 0;
    }
  }, [exercise]);

  useEffect(() => {
    return () => {
      detectorRef.current?.reset?.();
      detectorRef.current = null;
    };
  }, []);

  // core handler receives keypoints mapped to MediaPipe indices
  function handleResults({ keypoints, canvasWidth, canvasHeight }) {
    if (!running) return;

    if (!keypoints || keypoints.length === 0) {
      unstableFeedbackRef.current = "No pose detected";
      return;
    }

    if (exercise === "bicep") {
      if (!hasEnoughUpperBody(keypoints, canvasWidth, canvasHeight)) {
        unstableFeedbackRef.current = "Bring your upper body into frame";
        return;
      }
    } else {
      if (!hasEnoughPose(keypoints, canvasWidth, canvasHeight)) {
        unstableFeedbackRef.current = "Move whole body into frame";
        return;
      }
    }

    if (!detectorRef.current || currentExerciseRef.current !== exercise) {
      detectorRef.current = initDetector(exercise);
      currentExerciseRef.current = exercise;
      try { detectorRef.current.reset?.(); } catch(e) { /* ignore */ }
    }

    try {
      // NOTE: out here contains the 'stable' and 'smoothedMetric' flags from detectorWrapper
      const out = detectorRef.current.update(keypoints) || {};
      
      // Reps Logic: This must be unthrottled for accurate counting/voice prompt
      if (out.reps !== undefined) {
        const newReps = out.reps;

        if (newReps > lastRecordedRepRef.current) {
          const repScore = (out.meta && out.meta.repScore) ?? out.score ?? 0;
          const now = new Date();
          const repEntry = {
            timestamp: now.toISOString(),
            score: repScore,
            meta: out.meta ?? {}
          };

          // IMMEDIATE STATE UPDATE: Triggers voice effect and perRep display. This is low-frequency.
          setPerRep(prev => [...prev, repEntry]); 
          
          unstableRepsRef.current = newReps; // Update rep ref for display
          lastRecordedRepRef.current = newReps;
        } else {
          unstableRepsRef.current = newReps; // Update unstable rep ref for live display changes
        }
      }


      if (out.holdSeconds !== undefined) {
        unstableRepsRef.current = out.holdSeconds;
      }
      
      // 🛠️ THROTTLED UPDATES: Write all continuous feedback/score data to unstable refs.
      if (out.feedback) unstableFeedbackRef.current = out.feedback;
      if (out.score !== undefined) unstableScoreRef.current = Math.round(out.score); 

    } catch (err) {
      console.error("Detector update error:", err);
      unstableFeedbackRef.current = "Detection error";
    }
  }

  function toggle() {
    if (running) {
      setRunning(false);
      setFeedback("Stopped");
      unstableFeedbackRef.current = "Stopped";
    } else {
      detectorRef.current = initDetector(exercise);
      currentExerciseRef.current = exercise;
      detectorRef.current.reset?.();
      
      // Reset all states and refs
      setReps(0);
      unstableRepsRef.current = 0;
      setFeedback("Starting...");
      unstableFeedbackRef.current = "Starting...";
      setScore(0);
      unstableScoreRef.current = 0;
      setPerRep([]);
      lastRecordedRepRef.current = 0;
      startTimeRef.current = Date.now();
      setRunning(true);
    }
  }


async function saveSession() {
  try {
    const token = localStorage.getItem("token");

    // duration (seconds)
    const duration = startTimeRef.current ? Math.round((Date.now() - startTimeRef.current) / 1000) : 0;

    // compute session score from perRep meta.repScore if available
    let sessionScore = 0;
    if (perRep && perRep.length > 0) {
      // collect rep scores from meta.repScore, or fallback to rep.score
      const repScores = perRep.map(r => {
        if (r.meta && typeof r.meta.repScore === "number") return r.meta.repScore;
        if (typeof r.score === "number") return r.score;
        return 0;
      });
      const sum = repScores.reduce((s, x) => s + x, 0);
      sessionScore = Math.round(sum / repScores.length);
    } else {
      // fallback to UI score state (if any)
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
}


  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="bg-white p-4 rounded shadow mb-4 flex gap-4 items-center">
        <select value={exercise} onChange={(e) => setExercise(e.target.value)} className="border px-3 py-2 rounded">
          <option value="bicep">Bicep Curl</option>
          <option value="squat">Squat</option>
          <option value="pushup">Push-Ups</option>
          <option value="lunge">Lunges</option>
          <option value="plank">Plank (hold)</option>
          <option value="tree">Tree Pose (yoga)</option>
        </select>

        <button onClick={toggle} className="px-4 py-2 bg-indigo-600 text-white rounded">{running ? "Stop" : "Start"}</button>
        <button onClick={saveSession} className="px-3 py-1 border rounded">Save Session</button>

        <div className="ml-auto text-sm text-slate-600">Reps: <strong>{reps}</strong></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded shadow">
          {/* CRITICAL OPTIMIZATION: Process only every 4th frame */}
          <PoseEngine onResults={handleResults} processEvery={4} width={640} height={480} />
        </div>

        <div className="bg-white p-4 rounded shadow workout-right">
          <h3 className="font-semibold">{exercise === "bicep" ? "Bicep Curl" :
                                         exercise === "squat" ? "Squat" :
                                         exercise === "pushup" ? "Push-Ups" :
                                         exercise === "lunge" ? "Lunges" :
                                         exercise === "plank" ? "Plank" :
                                         exercise === "tree" ? "Tree Pose" : exercise}</h3>

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
    onChange={(e) => setVoiceEnabled(e.target.checked)}
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