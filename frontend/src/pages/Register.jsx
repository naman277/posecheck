// frontend/src/pages/Register.jsx
import React, { useState } from "react";
import axios from "../utils/api";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const res = await axios.post("/api/auth/register", { email, password, name });
      const token = res.data?.token;
      const user = res.data?.user || null;
      if (!token) {
        setErr("Registration succeeded but no token returned.");
        setLoading(false);
        return;
      }
      // store token & user
      localStorage.setItem("token", token);
      if (user) localStorage.setItem("user", JSON.stringify(user));
      // let navbar/guards know
      window.dispatchEvent(new Event("token-changed"));
      // navigate to dashboard
      navigate("/dashboard");
    } catch (error) {
      console.error("Register error", error);
      const msg = error.response?.data?.msg || error.response?.data?.message || error.message;
      setErr(msg || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md w-full bg-white p-6 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Create account</h2>
        {err && <div className="text-sm text-red-600 mb-3">{err}</div>}
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="text-sm">Name (optional)</label>
            <input value={name} onChange={e => setName(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded" placeholder="Your name" />
          </div>
          <div>
            <label className="text-sm">Email</label>
            <input value={email} onChange={e => setEmail(e.target.value)} required type="email" className="w-full mt-1 px-3 py-2 border rounded" />
          </div>
          <div>
            <label className="text-sm">Password</label>
            <input value={password} onChange={e => setPassword(e.target.value)} required type="password" className="w-full mt-1 px-3 py-2 border rounded" />
          </div>

          <div className="flex items-center justify-between">
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded" disabled={loading}>
              {loading ? "Creating…" : "Create account"}
            </button>
            <Link to="/login" className="text-sm text-indigo-600">Sign in</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
