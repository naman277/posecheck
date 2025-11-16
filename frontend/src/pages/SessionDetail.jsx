// frontend/src/pages/SessionDetail.jsx
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "../utils/api";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from "recharts";

export default function SessionDetail() {
  const { id } = useParams();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`/api/sessions/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.data && res.data.session) setSession(res.data.session);
        else setError("Session not found");
      } catch (err) {
        console.error("Load session error", err);
        setError(err.response?.data?.msg || "Failed to load session");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) return <div className="p-4">Loading session…</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;
  if (!session) return <div className="p-4">No session data</div>;

  // prepare chart data from perRep
  const chartData = (session.perRep || []).map((r, idx) => {
    const meta = r.meta || {};
    return {
      rep: `#${idx + 1}`,
      min: typeof meta.elbowMinAngle === "number" ? meta.elbowMinAngle : null,
      max: typeof meta.elbowMaxAngle === "number" ? meta.elbowMaxAngle : null,
      score: r.score ?? (meta.repScore ?? 0),
      timestamp: r.timestamp
    };
  });

  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-semibold">{session.exercise} — Session details</h2>
          <div className="text-sm text-slate-600">Saved: {new Date(session.createdAt).toLocaleString()}</div>
        </div>
        <div className="text-right">
          <div className="text-sm text-slate-500">Reps: <strong>{session.reps}</strong></div>
          <div className="text-sm text-slate-500">Score: <strong>{session.score}</strong></div>
          <div className="mt-2"><Link to="/sessions" className="text-indigo-600 text-sm">← Back to Sessions</Link></div>
        </div>
      </div>

      <div className="bg-white p-4 rounded shadow mb-6">
        <h3 className="font-semibold mb-2">Elbow angle per rep (min / max)</h3>
        {chartData.length === 0 ? (
          <div className="text-sm text-slate-600">No per-rep meta available for this session.</div>
        ) : (
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 16, left: 8, bottom: 24 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="rep" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="min" name="Elbow Min (°)" stackId="a" />
                <Bar dataKey="max" name="Elbow Max (°)" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="bg-white p-4 rounded shadow">
        <h3 className="font-semibold mb-2">Per-rep details</h3>
        {chartData.length === 0 ? (
          <div className="text-sm text-slate-600">No details</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500">
                <th className="py-2">Rep</th>
                <th>Start</th>
                <th>End</th>
                <th>Duration (ms)</th>
                <th>Score</th>
                <th>Min°</th>
                <th>Max°</th>
              </tr>
            </thead>
            <tbody>
              {(session.perRep || []).map((r, i) => {
                const m = r.meta || {};
                return (
                  <tr key={i} className="border-t">
                    <td className="py-2">#{i + 1}</td>
                    <td>{m.startTimestamp ? new Date(m.startTimestamp).toLocaleTimeString() : "-"}</td>
                    <td>{m.endTimestamp ? new Date(m.endTimestamp).toLocaleTimeString() : "-"}</td>
                    <td>{m.durationMs ?? "-"}</td>
                    <td>{r.score ?? (m.repScore ?? "-")}</td>
                    <td>{m.elbowMinAngle ?? "-"}</td>
                    <td>{m.elbowMaxAngle ?? "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
