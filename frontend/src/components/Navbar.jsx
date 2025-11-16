// frontend/src/components/Navbar.jsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem("token"));
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; }
  });

  useEffect(() => {
    // update on route change
    setLoggedIn(!!localStorage.getItem("token"));
    try { setUser(JSON.parse(localStorage.getItem("user") || "null")); } catch { setUser(null); }
  }, [location]);

  useEffect(() => {
    function onStorage(e) {
      if (e.key === "token") setLoggedIn(!!e.newValue);
      if (e.key === "user") {
        try { setUser(e.newValue ? JSON.parse(e.newValue) : null); } catch { setUser(null); }
      }
    }
    function onTokenChanged() {
      setLoggedIn(!!localStorage.getItem("token"));
      try { setUser(JSON.parse(localStorage.getItem("user") || "null")); } catch { setUser(null); }
    }
    window.addEventListener("storage", onStorage);
    window.addEventListener("token-changed", onTokenChanged);

    // small polling to catch very rare race conditions (cleans up)
    const id = setInterval(() => {
      setLoggedIn(!!localStorage.getItem("token"));
    }, 400);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("token-changed", onTokenChanged);
      clearInterval(id);
    };
  }, []);

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("token-changed"));
    setLoggedIn(false);
    setUser(null);
    navigate("/login");
  }

  return (
    <nav className="w-full bg-white border-b">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-6">
        <Link to="/" className="font-semibold text-lg">PoseCheck</Link>

        <Link to="/" className="text-sm">Home</Link>
        <Link to="/workout" className="text-sm">Workout</Link>
        <Link to="/sessions" className="text-sm">Sessions</Link>
        <Link to="/dashboard" className="text-sm">Dashboard</Link>
        <Link to="/learn" className="text-sm">Learn</Link>

        <div className="ml-auto flex items-center gap-3">
          {!loggedIn ? (
            <Link to="/login" className="px-3 py-1 border rounded">Login</Link>
          ) : (
            <>
              <Link to="/profile" className="text-sm">{user?.name ?? user?.email ?? "Profile"}</Link>
              <button
                onClick={logout}
                className="px-3 py-1 text-white bg-indigo-600 rounded shadow hover:bg-indigo-700"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
