import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState('user');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleChange = e => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await login(form.email, form.password);
      } else {
        if (!form.name.trim()) { setError('Name is required'); setLoading(false); return; }
        await register(form.name.trim(), form.email, form.password, role);
      }
      navigate('/ask');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-bg-gradient" />
      <div className="auth-card">
        <div className="auth-card-header">
          <div className="auth-logo">📋</div>
          <div className="auth-title">{isLogin ? 'Welcome back' : 'Create account'}</div>
          <div className="auth-subtitle">
            {isLogin ? 'Sign in to your FAQ account' : 'Join the FAQ Management System'}
          </div>
        </div>

        <div className="auth-card-body">
          {error && <div className="msg-error" style={{ marginBottom: '16px' }}>{error}</div>}

          {!isLogin && (
            <>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Your Name</label>
                <input
                  name="name"
                  type="text"
                  className="form-input"
                  placeholder="Full name"
                  value={form.name}
                  onChange={handleChange}
                  autoComplete="name"
                />
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Account Type</label>
                <div className="auth-role-toggle">
                  <button
                    type="button"
                    className={`auth-role-btn ${role === 'user' ? 'active' : ''}`}
                    onClick={() => setRole('user')}
                  >
                    👤 User
                  </button>
                  <button
                    type="button"
                    className={`auth-role-btn ${role === 'admin' ? 'active' : ''}`}
                    onClick={() => setRole('admin')}
                  >
                    🛡️ Admin
                  </button>
                </div>
              </div>
            </>
          )}

          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label">Email</label>
            <input
              name="email"
              type="email"
              className="form-input"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
            />
          </div>

          <div className="form-group" style={{ marginBottom: isLogin ? '4px' : '8px' }}>
            <label className="form-label">Password</label>
            <input
              name="password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              autoComplete={isLogin ? 'current-password' : 'new-password'}
            />
          </div>

          {isLogin && (
            <div style={{ textAlign: 'right', marginBottom: '16px' }}>
              <RouterLink
                to="/forgot-password"
                style={{ fontSize: '13px', color: '#4f46e5', textDecoration: 'none' }}
              >
                Forgot Password?
              </RouterLink>
            </div>
          )}

          <button
            type="submit"
            className="auth-submit-btn"
            onClick={handleSubmit}
            disabled={loading || !form.email || !form.password || (!isLogin && !form.name)}
          >
            {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </div>

        <div className="auth-card-footer">
          {isLogin ? (
            <>
              Don&apos;t have an account?{' '}
              <span onClick={() => { setIsLogin(false); setError(''); }}>Register</span>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <span onClick={() => { setIsLogin(true); setError(''); }}>Sign In</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;