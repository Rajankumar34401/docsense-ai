import React, { useState, useEffect } from 'react'; 
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google'; // 👈 Extra Add kiya
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import UserChat from './pages/UserChat';
import { GoogleLogin } from '@react-oauth/google';
import ResetPassword from "./ResetPassword";

export default function App() {
  const [user, setUser] = useState(() => {
    const savedUser = sessionStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const handleLogout = () => {
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("token");
    setUser(null);
  };

  return (
    // 👈 Bas ye wrapper add kiya hai, baaki sab as-it-is hai
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <Router>
        <Routes>
          {/* ✅ Ye aapka naya route jo humne abhi fix kiya tha */}
          <Route path="/signup" element={!user ? <Login setUser={setUser} /> : <Navigate to="/" replace />} />

          {/* Unauthenticated Route */}
          <Route path="/login" element={!user ? <Login setUser={setUser} /> : <Navigate to="/" replace />} />

          {/* Home Route: Logic based on role */}
          <Route path="/" element={
            !user ? <Navigate to="/login" replace /> : (
              user.role === 'admin' ? <Navigate to="/admin" replace /> : <UserChat user={user} onLogout={handleLogout} />
            )
          } />

          {/* Admin Route: Strict check */}
          <Route path="/admin" element={
            (user && user.role === 'admin') ? <AdminDashboard user={user} logout={handleLogout} /> : <Navigate to="/" replace />
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Routes>
      </Router>
    </GoogleOAuthProvider>
  );
}