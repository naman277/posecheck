// frontend/src/components/RequireAuth.jsx
import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import api from "../utils/api";
import { useAuth } from "../auth/AuthProvider"; // <-- ADD THIS LINE

/*
 Robust RequireAuth:
  - If no token (from context): redirect to /login
  - If token exists: call /api/me to verify; while verifying show a brief "Verifying..." UI
  - If verification fails: clear token and redirect to /login
*/
export default function RequireAuth({ children }) {
  const { token, logout } = useAuth(); // <-- ADDED: Get token and logout from context
  const [status, setStatus] = useState(token ? "checking" : "no-token");
  const location = useLocation();

  useEffect(() => {
    let mounted = true;

    // 1. Check the reactive CONTEXT token first. If null, stop checking.
    if (!token) {
      setStatus("no-token");
      return;
    }
    
    // 2. If we have a token from context, set to checking and verify with server
    setStatus("checking"); 

    async function verify() {
      try {
        const res = await api.get("/api/me");
        if (!mounted) return;
        if (res && (res.data?.user || res.status === 200)) {
          setStatus("ok");
        } else {
          logout(); // <-- Use context logout to clear state and local storage
          setStatus("fail");
        }
      } catch (err) {
        if (!mounted) return;
        console.warn("Auth verify failed:", err);
        logout(); // <-- Use context logout to clear state and local storage
        setStatus("fail");
      }
    }

    verify();

    return () => { mounted = false; };
  // Dependency array uses the reactive 'token' from context to re-run verification on login
  }, [token, logout]); 

  // ... (rest of the component logic remains the same)

  if (status === "checking") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse text-slate-600">Verifying session…</div>
        </div>
      </div>
    );
  }

  if (status === "no-token" || status === "fail") {
    // redirect to login, preserve where user was trying to go
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // verified ok
  return children;
}