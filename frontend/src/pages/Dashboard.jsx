// frontend/src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import axios from "../utils/api";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setErrorMsg("");
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setErrorMsg("Not logged in. Dashboard requires login.");
          setLoading(false);
          return;
        }
        const res = await axios.get("/api/sessions", { headers: { Authorization: `Bearer ${token}` } });
        if (mounted && res.data && res.data.sessions) setSessions(res.data.sessions);
      } catch (err) {
        console.error("Dashboard load error", err);
        setErrorMsg("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  if (loading) return <div className="p-4">Loading dashboard…</div>;
  if (errorMsg) return <div className="p-4 text-red-600">{errorMsg}</div>;

  // compute stats
  const totalSessions = sessions.length;
  const totalReps = sessions.reduce((s, x) => s + (x.reps || 0), 0);
  const avgScore = sessions.length ? Math.round(sessions.reduce((s, x) => s + (x.score || 0), 0) / sessions.length) : 0;
  const lastSession = sessions[0] || null;

  // prepare chart data (last 12 sessions)
  const recent = sessions.slice(0, 12).reverse(); // oldest to newest
  const chartData = recent.map(s => ({ name: new Date(s.createdAt).toLocaleDateString(), score: s.score || 0, reps: s.reps || 0 }));

  return (
    <div className="max-w-6xl mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <Link to="/sessions" className="px-3 py-1 border rounded">View Sessions</Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded shadow">
          <div className="text-sm text-slate-500">Total Sessions</div>
          <div className="text-2xl font-bold">{totalSessions}</div>
        </div>

        <div className="p-4 bg-white rounded shadow">
          <div className="text-sm text-slate-500">Total Reps</div>
          <div className="text-2xl font-bold">{totalReps}</div>
        </div>

        <div className="p-4 bg-white rounded shadow">
          <div className="text-sm text-slate-500">Avg. Score</div>
          <div className="text-2xl font-bold">{avgScore}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="p-4 bg-white rounded shadow">
          <h3 className="font-semibold mb-2">Score trend (recent sessions)</h3>
          {chartData.length === 0 ? <div className="text-sm text-slate-600">No data to show yet.</div> : (
            <div style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="score" stroke="#8884d8" />
                  <Line type="monotone" dataKey="reps" stroke="#82ca9d" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="p-4 bg-white rounded shadow">
          <h3 className="font-semibold mb-2">Last session</h3>
          {!lastSession ? <div className="text-sm text-slate-600">No sessions yet — do a workout and save it.</div> : (
            <div>
              <div className="text-sm text-slate-600">{new Date(lastSession.createdAt).toLocaleString()}</div>
              <div className="mt-2">Exercise: <strong>{lastSession.exercise}</strong></div>
              <div>Reps: <strong>{lastSession.reps}</strong></div>
              <div>Score: <strong>{lastSession.score}</strong></div>
              <div className="mt-3">
                <div className="text-sm text-slate-600">Per-rep details</div>
                <ul className="list-disc list-inside text-sm mt-2">
                  {(lastSession.perRep || []).length === 0 ? <li className="italic">No per-rep details</li> :
                    lastSession.perRep.map((r, i) => (
                      <li key={i}>{new Date(r.timestamp).toLocaleTimeString()} — score: {Math.round(r.score || 0)}</li>
                    ))
                  }
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
