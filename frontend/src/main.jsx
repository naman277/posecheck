// frontend/src/main.jsx
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./auth/AuthProvider"; // <-- ADD THIS LINE

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider> {/* <-- ADDED: The required context provider */}
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);