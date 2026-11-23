import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { IconLink, IconShield, IconLogOut } from './Icons';

export const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header style={{
      borderBottom: '1px solid var(--border-subtle)',
      backgroundColor: 'rgba(16, 16, 20, 0.85)',
      backdropFilter: 'blur(8px)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0.85rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        {/* Brand */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{
            background: 'var(--accent-soft)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            color: 'var(--accent)',
            padding: '0.45rem',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <IconLink size={20} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 700, fontSize: '1.05rem', letterSpacing: '-0.02em' }}>
              ShortLink
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1 }}>
              Bitly Clone &bull; Web Dev III
            </span>
          </div>
        </Link>

        {/* Navigation items */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {isAuthenticated ? (
            <>
              <NavLink
                to="/dashboard"
                style={({ isActive }) => ({
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                  padding: '0.4rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: isActive ? 'var(--accent-soft)' : 'transparent',
                })}
              >
                Dashboard
              </NavLink>

              {isAdmin && (
                <NavLink
                  to="/admin"
                  style={({ isActive }) => ({
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: isActive ? '#c084fc' : 'var(--text-secondary)',
                    padding: '0.4rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: isActive ? 'rgba(168, 85, 247, 0.15)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  })}
                >
                  <IconShield size={14} />
                  Admin
                </NavLink>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: '0.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{user?.name}</span>
                  <span className={`badge ${user?.role === 'admin' ? 'badge-role-admin' : 'badge-role-user'}`} style={{ fontSize: '0.625rem', padding: '0.1rem 0.4rem' }}>
                    {user?.role}
                  </span>
                </div>

                <button
                  onClick={handleLogout}
                  className="btn btn-icon"
                  title="Log out"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <IconLogOut size={16} />
                </button>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Link to="/login" className="btn btn-secondary btn-sm">
                Log In
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Get Started
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};
