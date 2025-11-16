// frontend/src/pages/Sessions.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "../utils/api";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

export default function Sessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("/api/sessions", { headers: { Authorization: `Bearer ${token}` } });
        if (res.data && res.data.sessions) setSessions(res.data.sessions);
      } catch (err) {
        console.error("Load sessions error", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // prepare series for charts: last 10 sessions
  const recent = sessions.slice(0, 20).reverse(); // oldest -> newest
  const lineData = recent.map(s => ({ name: new Date(s.createdAt).toLocaleString(), score: s.score, reps: s.reps }));

  function downloadCSV() {
    // simple client-side CSV from sessions
    const rows = sessions.map(s => ({
      id: s._id,
      exercise: s.exercise,
      reps: s.reps,
      durationSeconds: s.durationSeconds,
      score: s.score,
      createdAt: s.createdAt,
      perRepCount: (s.perRep || []).length
    }));
    const header = Object.keys(rows[0] || {});
    const csv = [header.join(",")].concat(rows.map(r => header.map(h => JSON.stringify(r[h] ?? "")).join(","))).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sessions_export.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <div className="p-4">Loading…</div>;

  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Your Sessions</h2>
        <div>
          <button onClick={downloadCSV} className="px-3 py-1 border rounded mr-2">Download CSV</button>
        </div>
      </div>

      <div className="bg-white p-4 rounded shadow mb-6">
        <h3 className="font-semibold mb-2">Score over recent sessions</h3>
        <div style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineData}>
              <XAxis dataKey="name" tick={false} />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="score" stroke="#8884d8" />
              <Line type="monotone" dataKey="reps" stroke="#82ca9d" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-4 rounded shadow">
        <h3 className="font-semibold mb-2">Recent sessions</h3>
        <ul className="space-y-2">
          {sessions.map(s => (
  <li key={s._id} className="border rounded p-3">
    <div className="flex items-center justify-between">
      <div>
        <Link to={`/sessions/${s._id}`} className="font-medium text-indigo-600">{s.exercise}</Link>
        <div className="text-xs text-slate-600">{new Date(s.createdAt).toLocaleString()}</div>
      </div>
      <div className="text-right">
        <div>reps: <strong>{s.reps}</strong></div>
        <div>score: <strong>{s.score}</strong></div>
      </div>
    </div>
  </li>
))}
        </ul>
      </div>
    </div>
  );
}
