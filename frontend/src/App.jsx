import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import FloatingScrollbar from './components/FloatingScrollbar';
import Home from './pages/Home';
import ChatBot from './components/ChatBot';
import Auth from './pages/Auth';
import AskQuery from './pages/AskQuery';
import QueryBoard from './pages/QueryBoard';
import AdminReview from './pages/AdminReview';
import AdminDB from './pages/AdminDB';
import StatusTracker from './pages/StatusTracker';
import Escalation from './pages/Escalation';
import Forum from './pages/Forum';
import ForumPost from './pages/ForumPost';
import Users from './pages/Users';

const AppRoutes = () => {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={user ? <Navigate to="/ask" replace /> : <Auth />} />
      <Route path="/ask" element={<ProtectedRoute><AskQuery /></ProtectedRoute>} />
      <Route path="/board" element={<ProtectedRoute><QueryBoard /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute adminOnly><AdminReview /></ProtectedRoute>} />
      <Route path="/db" element={<ProtectedRoute adminOnly><AdminDB /></ProtectedRoute>} />
      <Route path="/status" element={<ProtectedRoute><StatusTracker /></ProtectedRoute>} />
      <Route path="/escalation" element={<ProtectedRoute adminOnly><Escalation /></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute adminOnly><Users /></ProtectedRoute>} />
      <Route path="/forum" element={<ProtectedRoute><Forum /></ProtectedRoute>} />
      <Route path="/forum/:id" element={<ProtectedRoute><ForumPost /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to={user ? '/ask' : '/login'} replace />} />
    </Routes>
  );
};

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <div className="grain" aria-hidden="true" />
      <FloatingScrollbar />
      <AppRoutes />
      <ChatBot />
    </AuthProvider>
  </BrowserRouter>
);

export default App;