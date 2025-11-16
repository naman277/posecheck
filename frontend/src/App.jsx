// frontend/src/App.jsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Workout from "./pages/Workout";
import SessionDetail from "./pages/SessionDetail";
import Sessions from "./pages/Sessions";
import Learn from "./pages/Learn";
import Profile from "./pages/Profile";
import Register from "./pages/Register";
import RequireAuth from "./components/RequireAuth"; // <-- ADDED: Import RequireAuth

function App() {
  // REMOVE: const token = localStorage.getItem("token"); 
  // All auth logic is now handled by RequireAuth and AuthProvider.

  return (
    <div className="app-root" style={{ fontFamily: "Inter, Arial, sans-serif" }}>
      <Navbar />
      <main style={{ padding: 20 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} /> 
          <Route path="/register" element={<Register />} />
          <Route path="/learn" element={<Learn />} />
          <Route path="/profile" element={<Profile />} />

          {/* PROTECTED ROUTES: Wrap these with RequireAuth */}
          <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
          <Route path="/workout" element={<RequireAuth><Workout /></RequireAuth>} />
          <Route path="/sessions" element={<RequireAuth><Sessions /></RequireAuth>} />
          <Route path="/sessions/:id" element={<RequireAuth><SessionDetail /></RequireAuth>} />
        </Routes>
      </main>
    </div>
  );
}

export default App;