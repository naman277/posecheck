import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
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



function App() {
  const token = localStorage.getItem("token");

  return (
    <div className="app-root" style={{ fontFamily: "Inter, Arial, sans-serif" }}>
      <Navbar />
      <main style={{ padding: 20 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={token ? <Navigate to="/dashboard" /> : <Login />} />
          <Route path="/learn" element={<Learn />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/dashboard" element={token ? <Dashboard /> : <Navigate to="/login" />} />
          <Route path="/sessions/:id" element={<SessionDetail />} />
          <Route path="/workout" element={token ? <Workout /> : <Navigate to="/login" />} />
          <Route path="/register" element={<Register />} />
          <Route path="/sessions" element={token ? <Sessions /> : <Navigate to="/login" />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
