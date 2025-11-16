// frontend/src/pages/Learn.jsx
import React from "react";
import { Link } from "react-router-dom";
import { LightBulbIcon, PhotoIcon } from "@heroicons/react/24/outline";

export default function Learn() {
  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Learn & Tips</h1>
          <Link to="/" className="text-sm text-indigo-600">Back to Home</Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-indigo-50 rounded">
                <LightBulbIcon className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-semibold">Camera & Framing</h3>
                <p className="text-sm text-slate-600 mt-2">
                  Place your camera at chest height if possible. For full-body exercises, ensure shoulders and hips are visible; for upper-body exercises (bicep), a close-up is fine.
                </p>
              </div>
            </div>

            <hr className="my-4" />

            <div className="mt-3 text-sm text-slate-600">
              <ul className="list-disc pl-5 space-y-2">
                <li>Use a plain background to reduce false landmarks.</li>
                <li>Wear tight-ish clothing so joints are easy to detect.</li>
                <li>Good lighting from the front helps reduce noise.</li>
              </ul>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-indigo-50 rounded">
                <PhotoIcon className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-semibold">Sample Setups</h3>
                <p className="text-sm text-slate-600 mt-2">Here are a few sample photos to illustrate good framing and camera placement.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 mt-4">
              <img src="https://images.unsplash.com/photo-1549576490-b0b4831ef60a?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.0.3&s=7a9a0b1c6f08d6f7b1a6f6e0c8b8b1a3" alt="good-setup" className="w-full rounded" />
              <img src="https://images.unsplash.com/photo-1526401281623-1c2f24a5f7c1?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.0.3&s=05f1a7d4a4f2f1b2c3d4e5f6a7b8c9d0" alt="lighting" className="w-full rounded" />
            </div>
          </div>

          <div className="md:col-span-2 bg-white p-6 rounded-xl shadow">
            <h3 className="font-semibold mb-2">Quick Troubleshooting</h3>
            <div className="text-sm text-slate-600">
              <ul className="list-disc pl-5 space-y-2">
                <li>If the app counts when only your face is visible, move the camera back so shoulders/hips are visible (for full-body exercises).</li>
                <li>If detection stops, refresh the page, allow camera access, and close other apps using the webcam.</li>
                <li>Still noisy? Try wearing a different color shirt or increasing room lighting.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
