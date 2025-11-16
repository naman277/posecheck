// frontend/src/components/ExerciseInstructions.jsx
import React from "react";

/**
 * ExerciseInstructions
 * props:
 *  - exercise: string id (e.g. "bicep", "squat", "pushup", "lunge", "plank", "tree")
 */
const INSTRUCTIONS = {
  bicep: {
    title: "Bicep Curl — How to",
    bullets: [
      "Stand facing the camera with feet shoulder-width apart.",
      "Hold imaginary dumbbell in the right hand (detector uses right arm).",
      "Start with arm extended down, then curl your forearm up toward the shoulder.",
      "Pause ~0.5s at top (fully curled), then lower slowly to fully extended position.",
      "Keep upper arm (shoulder) stationary — only your forearm should move.",
      "Ensure shoulder and elbow are visible in camera frame."
    ]
  },

  squat: {
    title: "Squat — How to",
    bullets: [
      "Stand with feet shoulder-width apart, toes slightly out.",
      "Push hips back and bend knees to lower into squat (keep chest up).",
      "Lower until thighs are roughly parallel to the floor (or comfortable depth).",
      "Push through heels to stand back up — keep knees tracking toes.",
      "Keep whole body visible in the camera (feet to shoulders)."
    ],
    tip: "Avoid rounding your back; try a slightly wider camera framing to include hips."
  },

  pushup: {
    title: "Push-Ups — How to",
    bullets: [
      "Place camera so your full torso and arms are visible (side or front angle works).",
      "Start in a straight plank position, hands under shoulders.",
      "Lower your body until chest nearly touches the floor, then push back up.",
      "Keep core tight and body in a straight line from head to heels.",
      "If full push-ups are hard, try knee push-ups for a reliable rep count."
    ],
    tip: "If counts are noisy, change camera angle to better capture elbows."
  },

  lunge: {
    title: "Lunge — How to",
    bullets: [
      "Stand tall, step one leg forward and lower until front thigh is parallel to floor.",
      "Back knee should come close to the floor (but not touch).",
      "Front knee should not pass far beyond the toes.",
      "Push back to the starting position and repeat with the other leg.",
      "Keep whole body visible; try holding hands on hips for stability."
    ],
    tip: "Take a larger step if the detector confuses knees/hips."
  },

  plank: {
    title: "Plank — How to",
    bullets: [
      "Get into a forearm or straight-arm plank with a straight line from head to heels.",
      "Keep core tight and avoid letting hips sag or pike up.",
      "Breathe steadily and hold the position for the target duration.",
      "Keep full-body visible if possible (torso and hips most important)."
    ],
    tip: "If hold detection is noisy, move camera back slightly to include torso and hips."
  },

  tree: {
    title: "Tree Pose (Yoga) — How to",
    bullets: [
      "Stand tall and place one foot against the inner thigh or calf of the other leg.",
      "Find a focal point to help with balance and bring hands to prayer or overhead.",
      "Keep hips level and core engaged; hold steady for the target duration.",
      "If balance is difficult, lightly touch a wall for a second while settling."
    ],
    tip: "For Yoga poses, avoid loose clothing and ensure the supporting leg is fully visible."
  }
};

export default function ExerciseInstructions({ exercise = "bicep" }) {
  const info = INSTRUCTIONS[exercise] || INSTRUCTIONS.bicep;
  return (
    <div className="bg-white p-3 rounded shadow-sm">
      <h4 className="font-semibold">{info.title}</h4>
      <ul className="list-disc list-inside text-sm mt-2 mb-2 text-slate-700">
        {info.bullets.map((b, i) => <li key={i}>{b}</li>)}
      </ul>
      <div className="text-xs text-slate-500">{info.tip}</div>
    </div>
  );
}
