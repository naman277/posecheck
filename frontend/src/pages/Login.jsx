// frontend/src/pages/Login.jsx
import React, { useState } from "react";
import axios from "../utils/api";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const res = await axios.post("/api/auth/login", { email, password });
      const token = res.data?.token || res.data?.accessToken || res.data?.data?.token;

      if (!token) {
        setErr("Login succeeded but no token returned. Check backend.");
        setLoading(false);
        return;
      }

      // store token synchronously
      localStorage.setItem("token", token);
      if (res.data.user) localStorage.setItem("user", JSON.stringify(res.data.user));

      console.log("Login: token stored in localStorage");

      // dispatch event so other components (Navbar, RequireAuth) update immediately
      window.dispatchEvent(new Event("token-changed"));

      // small delay to avoid rare race where route guard runs before listeners react
      setTimeout(() => {
        navigate("/dashboard");
      }, 50);
    } catch (error) {
      console.error("Login error", error);
      const msg = error.response?.data?.msg || error.response?.data?.message || error.message;
      setErr(msg || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md w-full bg-white p-6 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Login</h2>
        {err && <div className="text-sm text-red-600 mb-3">{err}</div>}
        <form onSubmit={onSubmit} className="space-y-3">
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
              {loading ? "Signing in…" : "Sign in"}
            </button>
            <Link to="/register" className="text-sm text-indigo-600">Register</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
