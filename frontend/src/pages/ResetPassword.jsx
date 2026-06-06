import React, { useState, useEffect } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import api from '../utils/api';

const ResetPassword = () => {
  const { token } = useParams();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState('validating'); // 'validating' | 'ready' | 'loading' | 'success' | 'expired'
  const [message, setMessage] = useState('');

  // Validate token on mount
  useEffect(() => {
    if (!token) { setStatus('expired'); setMessage('No reset token provided.'); return; }
    api.get(`/auth/reset-validate/${token}`)
      .then(() => setStatus('ready'))
      .catch(err => {
        setStatus('expired');
        setMessage(err.response?.data?.message || 'Invalid or expired reset token.');
      });
  }, [token]);

  const getStrength = pwd => {
    if (!pwd) return null;
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    if (score <= 1) return { label: 'Weak', color: '#ef4444' };
    if (score <= 3) return { label: 'Fair', color: '#f59e0b' };
    return { label: 'Strong', color: '#22c55e' };
  };

  const strength = getStrength(password);
  const passwordError = password && password.length < 8 ? 'At least 8 characters required' : null;
  const confirmError = confirmPassword && confirmPassword !== password ? 'Passwords do not match' : null;

  const handleSubmit = async e => {
    e.preventDefault();
    if (password.length < 8 || password !== confirmPassword) return;
    setStatus('loading');
    setMessage('');
    try {
      const res = await api.post('/auth/reset-password', { token, password });
      setStatus('success');
      setMessage(res.data.message);
    } catch (err) {
      setStatus('error');
      setMessage(err.response?.data?.message || 'Failed to reset password.');
    }
  };

  // Token invalid / expired
  if (status === 'expired') {
    return (
      <div className="auth-container">
        <div className="auth-bg-gradient" />
        <div className="auth-card">
          <div style={{ textAlign: 'center', padding: '32px 24px' }}>
            <div style={{ fontSize: '56px', marginBottom: '16px' }}>⏳</div>
            <h2 style={{ margin: '0 0 12px', color: '#1a1a2e' }}>Link Expired or Invalid</h2>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: '0 0 24px' }}>
              {message}
            </p>
            <RouterLink to="/forgot-password" className="auth-submit-btn" style={{ display: 'inline-block', textDecoration: 'none' }}>
              Request New Link
            </RouterLink>
            <div style={{ marginTop: '16px' }}>
              <RouterLink to="/login" style={{ color: '#6b7280', fontSize: '14px' }}>Back to Sign In</RouterLink>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success
  if (status === 'success') {
    return (
      <div className="auth-container">
        <div className="auth-bg-gradient" />
        <div className="auth-card">
          <div style={{ textAlign: 'center', padding: '32px 24px' }}>
            <div style={{ fontSize: '56px', marginBottom: '16px' }}>✅</div>
            <h2 style={{ margin: '0 0 12px', color: '#1a1a2e' }}>Password Reset!</h2>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: '0 0 24px' }}>{message}</p>
            <RouterLink to="/login" className="auth-submit-btn" style={{ display: 'inline-block', textDecoration: 'none' }}>
              Sign In Now
            </RouterLink>
          </div>
        </div>
      </div>
    );
  }

  // Validating
  if (status === 'validating') {
    return (
      <div className="auth-container">
        <div className="auth-bg-gradient" />
        <div className="auth-card">
          <div style={{ textAlign: 'center', padding: '48px 24px' }}>
            <div className="spinner" style={{ margin: '0 auto 16px' }} />
            <p style={{ color: '#6b7280', fontSize: '14px' }}>Verifying your reset link…</p>
          </div>
        </div>
      </div>
    );
  }

  // Form
  return (
    <div className="auth-container">
      <div className="auth-bg-gradient" />
      <div className="auth-card">
        <div className="auth-card-header">
          <div className="auth-logo">🔐</div>
          <div className="auth-title">Set New Password</div>
          <div className="auth-subtitle">Choose a strong password you haven&apos;t used before.</div>
        </div>

        <div className="auth-card-body">
          {status === 'error' && <div className="msg-error" style={{ marginBottom: '16px' }}>{message}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '8px' }}>
              <label className="form-label">New Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="At least 8 characters"
                value={password}
                onChange={e => { setPassword(e.target.value); if (status === 'error') setStatus('ready'); }}
                autoComplete="new-password"
                autoFocus
                required
              />
            </div>

            {password && strength && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <div style={{ flex: 1, height: '4px', borderRadius: '2px', background: '#e5e7eb', overflow: 'hidden' }}>
                  <div style={{
                    width: strength.label === 'Weak' ? '33%' : strength.label === 'Fair' ? '66%' : '100%',
                    height: '100%', background: strength.color, transition: 'all 0.3s ease',
                  }} />
                </div>
                <span style={{ fontSize: '12px', color: strength.color, fontWeight: '600' }}>{strength.label}</span>
              </div>
            )}
            {passwordError && <p style={{ color: '#ef4444', fontSize: '12px', margin: '0 0 12px' }}>{passwordError}</p>}

            <div className="form-group" style={{ marginBottom: '8px' }}>
              <label className="form-label">Confirm Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Repeat your new password"
                value={confirmPassword}
                onChange={e => { setConfirmPassword(e.target.value); if (status === 'error') setStatus('ready'); }}
                autoComplete="new-password"
                required
              />
            </div>
            {confirmError && <p style={{ color: '#ef4444', fontSize: '12px', margin: '0 0 12px' }}>{confirmError}</p>}

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={!password || !confirmPassword || password.length < 8 || password !== confirmPassword}
              style={{ marginTop: '4px' }}
            >
              {status === 'loading' ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>

          <div className="auth-card-footer" style={{ marginTop: '20px' }}>
            <RouterLink to="/login">&larr; Back to Sign In</RouterLink>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;