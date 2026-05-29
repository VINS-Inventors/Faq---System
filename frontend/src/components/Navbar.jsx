import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const isActive = path => location.pathname === path;

  if (!user) return null;

  return (
    <nav className="navbar">
      <Link to="/ask" className="navbar-brand">
        <div className="brand-icon">📋</div>
        FAQ System
      </Link>

      <div className="navbar-center">
        <Link to="/ask" className={isActive('/ask') ? 'active' : ''}>Ask</Link>
        <Link to="/board" className={isActive('/board') ? 'active' : ''}>Board</Link>
        <Link to="/status" className={isActive('/status') ? 'active' : ''}>Tracker</Link>
        {user.role === 'admin' && (
          <>
            <Link to="/admin" className={isActive('/admin') ? 'active' : ''}>Admin</Link>
            <Link to="/escalation" className={isActive('/escalation') ? 'active' : ''}>Escalation</Link>
          </>
        )}
      </div>

      <div className="navbar-right">
        <div className="user-badge">
          <div className="user-avatar">{user.name.charAt(0).toUpperCase()}</div>
          <span className="user-name">{user.name}</span>
          <span className={`user-role ${user.role}`}>{user.role}</span>
        </div>
        <button className="btn-logout" onClick={logout}>Logout</button>
      </div>
    </nav>
  );
};

export default Navbar;