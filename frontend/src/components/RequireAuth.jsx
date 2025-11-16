// frontend/src/components/RequireAuth.jsx
import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

/**
 * Reactive RequireAuth.
 * - Keeps local state for token presence
 * - Listens to "token-changed" custom event and storage events
 * - Re-renders immediately when token appears or is removed
 */
export default function RequireAuth({ children }) {
  const [hasToken, setHasToken] = useState(!!localStorage.getItem("token"));

  useEffect(() => {
    function onStorage(e) {
      if (e.key === "token") setHasToken(!!e.newValue);
    }
    function onTokenChanged() {
      setHasToken(!!localStorage.getItem("token"));
    }

    window.addEventListener("storage", onStorage);
    window.addEventListener("token-changed", onTokenChanged);

    // also poll briefly to catch race conditions (short lived)
    const interval = setInterval(() => setHasToken(!!localStorage.getItem("token")), 200);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("token-changed", onTokenChanged);
      clearInterval(interval);
    };
  }, []);

  if (!hasToken) {
    // not logged in — redirect to login
    return <Navigate to="/login" replace />;
  }
  return children;
}
