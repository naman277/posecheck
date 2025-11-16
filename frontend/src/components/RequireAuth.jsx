// frontend/src/components/RequireAuth.jsx
import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

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

    // brief poll to catch race conditions
    const id = setInterval(() => setHasToken(!!localStorage.getItem("token")), 300);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("token-changed", onTokenChanged);
      clearInterval(id);
    };
  }, []);

  if (!hasToken) return <Navigate to="/login" replace />;
  return children;
}
