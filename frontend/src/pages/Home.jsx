// frontend/src/pages/Home.jsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { PlayIcon, ArchiveBoxIcon, ChartBarIcon, LightBulbIcon, UserIcon } from "@heroicons/react/24/outline";

function Card({ to, title, desc, Icon }) {
  return (
    <Link to={to} className="block">
      <div className="h-full bg-white rounded-xl shadow hover:shadow-lg transition p-6 flex flex-col">
        <div className="w-12 h-12 rounded-md bg-indigo-50 flex items-center justify-center mb-4">
          <Icon className="w-6 h-6 text-indigo-600" />
        </div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm text-slate-600 flex-1">{desc}</p>
        <div className="mt-4 text-xs text-indigo-600 font-medium">Open →</div>
      </div>
    </Link>
  );
}

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-6xl mx-auto px-6">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">PoseCheck</h1>
            <p className="text-sm text-slate-500 mt-1">Exercise posture detection — quick workouts, save sessions, track progress.</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/workout")}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md shadow hover:bg-indigo-700 transition"
            >
              Quick Start
            </button>
            <Link to="/sessions" className="px-3 py-2 border rounded-md text-sm text-slate-700 hover:bg-slate-100">Sessions</Link>
          </div>
        </header>

        <main>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card
              to="/workout"
              title="Start Workout"
              desc="Open the workout studio, allow your camera and begin tracking reps and posture in real-time."
              Icon={PlayIcon}
            />

            <Card
              to="/sessions"
              title="Sessions"
              desc="View your saved sessions, per-rep details and export your workout data as CSV."
              Icon={ArchiveBoxIcon}
            />

            <Card
              to="/dashboard"
              title="Dashboard"
              desc="Quick stats and trends — track progress over time with charts and session summaries."
              Icon={ChartBarIcon}
            />

            <Card
              to="/learn"
              title="Learn & Tips"
              desc="Short tips for camera setup, lighting, and ideal framing to get better detections."
              Icon={LightBulbIcon}
            />

            <Card
              to="/profile"
              title="Profile"
              desc="Manage your account, change password and view personalized settings."
              Icon={UserIcon}
            />

            <div className="sm:col-span-2 lg:col-span-3">
              <div className="bg-white rounded-xl p-6 shadow">
                <h3 className="text-lg font-semibold mb-2">Quick Setup</h3>
                <p className="text-sm text-slate-600 mb-4">A few tips to get accurate results: use even lighting, keep a clear background and allow the camera full-body view for exercises that need it.</p>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-indigo-50 rounded">
                    <div className="text-sm font-medium">Lighting</div>
                    <div className="text-xs text-slate-600 mt-1">Face the light source; avoid strong backlight.</div>
                  </div>
                  <div className="p-4 bg-indigo-50 rounded">
                    <div className="text-sm font-medium">Framing</div>
                    <div className="text-xs text-slate-600 mt-1">Keep shoulders and hips visible for full-body exercises.</div>
                  </div>
                  <div className="p-4 bg-indigo-50 rounded">
                    <div className="text-sm font-medium">Distance</div>
                    <div className="text-xs text-slate-600 mt-1">Stand 1.5–3 meters from camera depending on lens.</div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
