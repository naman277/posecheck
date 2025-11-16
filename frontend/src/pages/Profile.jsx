// frontend/src/pages/Profile.jsx
import React, { useState, useEffect } from "react";
import axios from "../utils/api";
import { Link } from "react-router-dom";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwdMsg, setPwdMsg] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setErr("");
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setErr("Not logged in");
          setLoading(false);
          return;
        }
        const res = await axios.get("/api/me", { headers: { Authorization: `Bearer ${token}` } });
        setUser(res.data.user);
      } catch (e) {
        console.error("Profile load error", e);
        setErr("Failed to load profile");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function changePassword(e) {
    e.preventDefault();
    setPwdMsg("");
    if (!oldPassword || !newPassword) {
      setPwdMsg("Enter both old and new password");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post("/api/me/password", { oldPassword, newPassword }, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data && res.data.success) {
        setPwdMsg("Password updated");
        setOldPassword("");
        setNewPassword("");
      } else {
        setPwdMsg("Update failed");
      }
    } catch (err) {
      console.error("Password change error", err);
      setPwdMsg(err.response?.data?.msg || err.response?.data?.message || "Error updating password");
    }
  }

  if (loading) return <div className="p-4">Loading…</div>;
  if (err) return <div className="p-4 text-red-600">{err}</div>;

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-3xl mx-auto px-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Profile</h1>
          <Link to="/" className="text-sm text-indigo-600">Back to Home</Link>
        </div>

        <div className="bg-white rounded-xl p-6 shadow">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold">U</div>
            <div>
              <div className="text-lg font-medium">{user?.email || "User"}</div>
              <div className="text-sm text-slate-500">Member since: {new Date(user?.createdAt || Date.now()).toLocaleDateString()}</div>
            </div>
          </div>

          <hr className="my-4" />

          <h3 className="font-semibold mb-2">Change password</h3>
          <form onSubmit={changePassword} className="grid grid-cols-1 gap-3">
            <input value={oldPassword} onChange={e => setOldPassword(e.target.value)} placeholder="Current / old password" type="password" className="px-3 py-2 border rounded" />
            <input value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New password" type="password" className="px-3 py-2 border rounded" />
            <div className="flex items-center gap-3">
              <button className="px-3 py-2 bg-indigo-600 text-white rounded" type="submit">Update password</button>
              <div className="text-sm text-slate-600">{pwdMsg}</div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
