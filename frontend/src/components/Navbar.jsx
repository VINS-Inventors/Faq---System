import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const isActive = path => location.pathname === path || location.pathname.startsWith(path + '/');

  if (!user) return null;

  return (
    <nav className="navbar">
      <Link to="/ask" className="navbar-brand">
        <div className="brand-icon">📋</div>
        FAQ HUB
      </Link>

      <div className="navbar-center">
        {user.role !== 'admin' && (
          <>
            <Link to="/ask" className={isActive('/ask') ? 'active' : ''}>Submit Query</Link>
            <Link to="/board" className={isActive('/board') ? 'active' : ''}>Knowledge Base</Link>
            <Link to="/status" className={isActive('/status') ? 'active' : ''}>Status Tracker</Link>
            <Link to="/forum" className={isActive('/forum') ? 'active' : ''}>Community Exchange</Link>
          </>
        )}
        {user.role === 'admin' && (
          <>
            <Link to="/admin" className={isActive('/admin') ? 'active' : ''}>Moderation</Link>
            <Link to="/db" className={isActive('/db') ? 'active' : ''}>Database</Link>
            <Link to="/escalation" className={isActive('/escalation') ? 'active' : ''}>Escalations</Link>
            <Link to="/users" className={isActive('/users') ? 'active' : ''}>User Directory</Link>
          </>
        )}
      </div>

      <div className="navbar-right">
        <ThemeToggle />
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