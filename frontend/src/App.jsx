import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import FloatingScrollbar from './components/FloatingScrollbar';
import Home from './pages/Home';
import ChatBot from './components/ChatBot';
import Auth from './pages/Auth';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AskQuery from './pages/AskQuery';
import QueryBoard from './pages/QueryBoard';
import AdminReview from './pages/AdminReview';
import AdminDB from './pages/AdminDB';
import StatusTracker from './pages/StatusTracker';
import Escalation from './pages/Escalation';
import Forum from './pages/Forum';
import ForumPost from './pages/ForumPost';
import FAQ from './pages/FAQ';
import Users from './pages/Users';

const PageWrapper = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 15, scale: 0.995 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: -15, scale: 0.995 }}
    transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
    style={{ minHeight: '100vh' }}
  >
    {children}
  </motion.div>
);

const AppRoutes = () => {
  const { user } = useAuth();
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageWrapper><Home /></PageWrapper>} />
        <Route path="/login" element={user ? <Navigate to="/ask" replace /> : <PageWrapper><Auth /></PageWrapper>} />
        <Route path="/forgot-password" element={<PageWrapper><ForgotPassword /></PageWrapper>} />
        <Route path="/reset-password/:token" element={<PageWrapper><ResetPassword /></PageWrapper>} />
        <Route path="/ask" element={<PageWrapper><ProtectedRoute><AskQuery /></ProtectedRoute></PageWrapper>} />
        <Route path="/board" element={<PageWrapper><ProtectedRoute><QueryBoard /></ProtectedRoute></PageWrapper>} />
        <Route path="/admin" element={<PageWrapper><ProtectedRoute adminOnly><AdminReview /></ProtectedRoute></PageWrapper>} />
        <Route path="/db" element={<PageWrapper><ProtectedRoute adminOnly><AdminDB /></ProtectedRoute></PageWrapper>} />
        <Route path="/status" element={<PageWrapper><ProtectedRoute><StatusTracker /></ProtectedRoute></PageWrapper>} />
        <Route path="/escalation" element={<PageWrapper><ProtectedRoute adminOnly><Escalation /></ProtectedRoute></PageWrapper>} />
        <Route path="/users" element={<PageWrapper><ProtectedRoute adminOnly><Users /></ProtectedRoute></PageWrapper>} />
        <Route path="/forum" element={<PageWrapper><ProtectedRoute><Forum /></ProtectedRoute></PageWrapper>} />
        <Route path="/faq" element={<PageWrapper><FAQ /></PageWrapper>} />
        <Route path="/forum/:id" element={<PageWrapper><ProtectedRoute><ForumPost /></ProtectedRoute></PageWrapper>} />
        <Route path="*" element={<Navigate to={user ? '/ask' : '/login'} replace />} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => (
  <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <AuthProvider>
      <div className="grain" aria-hidden="true" />
      <FloatingScrollbar />
      <AppRoutes />
      <ChatBot />
    </AuthProvider>
  </BrowserRouter>
);

export default App;