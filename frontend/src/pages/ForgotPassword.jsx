import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import api from '../utils/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus('loading');
    setMessage('');
    try {
      const res = await api.post('/auth/forgot-password', { email: email.trim() });
      setStatus('success');
      setMessage(res.data.message);
    } catch (err) {
      setStatus('error');
      setMessage(err.response?.data?.message || 'Something went wrong. Please try again.');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-bg-gradient" />
      <div className="auth-card">
        <div className="auth-card-header">
          <div className="auth-logo">🔑</div>
          <div className="auth-title">Forgot Password?</div>
          <div className="auth-subtitle">
            No worries — enter your email and we&apos;ll send you a secure reset link.
          </div>
        </div>

        <div className="auth-card-body">
          {status === 'success' ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>✉️</div>
              <h3 style={{ margin: '0 0 12px', color: '#1a1a2e', fontSize: '18px' }}>
                Check Your Email
              </h3>
              <p style={{ color: '#6b7280', fontSize: '14px', lineHeight: '1.6', margin: '0 0 24px' }}>
                {message}
              </p>
              <RouterLink to="/login" className="auth-submit-btn" style={{
                display: 'inline-block', textDecoration: 'none', textAlign: 'center',
              }}>
                Back to Sign In
              </RouterLink>
            </div>
          ) : (
            <>
              {status === 'error' && (
                <div className="msg-error" style={{ marginBottom: '16px' }}>{message}</div>
              )}
              <form onSubmit={handleSubmit}>
                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => {
                      setEmail(e.target.value);
                      if (status === 'error') setStatus('idle');
                    }}
                    autoComplete="email"
                    autoFocus
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="auth-submit-btn"
                  disabled={status === 'loading' || !email.trim()}
                >
                  {status === 'loading' ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>
              <div className="auth-card-footer" style={{ marginTop: '20px' }}>
                Remember your password?{' '}
                <RouterLink to="/login">Sign In</RouterLink>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;