// frontend/src/components/RequireAuth.jsx
import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import api from "../utils/api";

/*
 Robust RequireAuth:
  - If no token: redirect to /login
  - If token exists: call /api/me to verify; while verifying show a brief "Verifying..." UI
  - If verified: render children
  - If verification fails: clear token and redirect to /login
*/
export default function RequireAuth({ children }) {
  const [status, setStatus] = useState("checking"); // 'checking' | 'ok' | 'fail' | 'no-token'
  const location = useLocation();

  useEffect(() => {
    let mounted = true;
    const token = localStorage.getItem("token");
    if (!token) {
      // no token at all
      setStatus("no-token");
      return;
    }

    // token exists — verify with the server
    async function verify() {
      try {
        // call /api/me to validate token; axios interceptor will attach token
        const res = await api.get("/api/me");
        if (!mounted) return;
        if (res && (res.data?.user || res.status === 200)) {
          setStatus("ok");
        } else {
          // treat any unexpected response as failure
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setStatus("fail");
        }
      } catch (err) {
        if (!mounted) return;
        // invalid token or network error
        console.warn("Auth verify failed:", err);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setStatus("fail");
      }
    }

    verify();

    return () => { mounted = false; };
    // We intentionally run verification on mount and when location changes isn't needed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === "checking") {
    // simple friendly loading UI — keeps user on the page while we validate the token
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
