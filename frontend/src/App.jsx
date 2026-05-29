import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Auth from './pages/Auth';
import AskQuery from './pages/AskQuery';
import QueryBoard from './pages/QueryBoard';
import AdminReview from './pages/AdminReview';
import StatusTracker from './pages/StatusTracker';
import Escalation from './pages/Escalation';

const AppRoutes = () => {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/ask" replace /> : <Auth />} />
      <Route path="/ask" element={<ProtectedRoute><AskQuery /></ProtectedRoute>} />
      <Route path="/board" element={<ProtectedRoute><QueryBoard /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute adminOnly><AdminReview /></ProtectedRoute>} />
      <Route path="/status" element={<ProtectedRoute><StatusTracker /></ProtectedRoute>} />
      <Route path="/escalation" element={<ProtectedRoute adminOnly><Escalation /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to={user ? '/ask' : '/login'} replace />} />
    </Routes>
  );
};

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  </BrowserRouter>
);

export default App;