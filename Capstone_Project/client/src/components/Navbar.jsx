import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { IconLink, IconShield, IconLogOut, IconZap } from './Icons';

export const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout, loginDemo } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleQuickDemo = async () => {
    try {
      await loginDemo('user');
      navigate('/dashboard');
    } catch (err) {
      console.error('Quick demo failed:', err);
    }
  };

  return (
    <header
      style={{
        borderBottom: '1px solid var(--border-subtle)',
        backgroundColor: 'rgba(11, 15, 25, 0.88)',
        backdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <div
        style={{
          maxWidth: '1240px',
          margin: '0 auto',
          padding: '0.85rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Brand */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
          <div
            style={{
              background: 'linear-gradient(135deg, #ee6123, #ff7e47)',
              color: '#ffffff',
              padding: '0.5rem',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 10px rgba(238, 97, 35, 0.35)',
            }}
          >
            <IconLink size={20} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.03em', color: '#ffffff' }}>
                Short<span style={{ color: '#ee6123' }}>Link</span>
              </span>
              <span
                style={{
                  fontSize: '0.625rem',
                  background: 'rgba(56, 189, 248, 0.15)',
                  color: 'var(--accent)',
                  padding: '0.1rem 0.35rem',
                  borderRadius: '4px',
                  fontWeight: 600,
                }}
              >
                Bitly Pro
              </span>
            </div>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1 }}>
              URL Shortener &bull; Dynamic QR &bull; Analytics
            </span>
          </div>
        </Link>

        {/* Navigation items */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Live Server Indicator */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              padding: '0.3rem 0.65rem',
              borderRadius: 'var(--radius-full)',
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: '#10b981',
                boxShadow: '0 0 8px #10b981',
                display: 'inline-block',
              }}
            />
            <span>API Online</span>
          </div>

          {isAuthenticated ? (
            <>
              <NavLink
                to="/dashboard"
                style={({ isActive }) => ({
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: isActive ? '#ee6123' : 'var(--text-secondary)',
                  padding: '0.4rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: isActive ? 'rgba(238, 97, 35, 0.12)' : 'transparent',
                  textDecoration: 'none',
                })}
              >
                Dashboard
              </NavLink>

              {isAdmin && (
                <NavLink
                  to="/admin"
                  style={({ isActive }) => ({
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: isActive ? '#c084fc' : 'var(--text-secondary)',
                    padding: '0.4rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: isActive ? 'rgba(168, 85, 247, 0.15)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    textDecoration: 'none',
                  })}
                >
                  <IconShield size={14} />
                  Admin
                </NavLink>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: '0.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {user?.name}
                  </span>
                  <span
                    className={`badge ${user?.role === 'admin' ? 'badge-role-admin' : 'badge-role-user'}`}
                    style={{ fontSize: '0.625rem', padding: '0.1rem 0.4rem' }}
                  >
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
              <button
                onClick={handleQuickDemo}
                className="btn"
                style={{
                  background: 'rgba(238, 97, 35, 0.15)',
                  border: '1px solid rgba(238, 97, 35, 0.4)',
                  color: '#ee6123',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  padding: '0.4rem 0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <IconZap size={14} />
                <span>Fast Demo</span>
              </button>

              <Link to="/login" className="btn btn-secondary btn-sm" style={{ textDecoration: 'none' }}>
                Log In
              </Link>
              <Link
                to="/register"
                className="btn btn-primary btn-sm"
                style={{ textDecoration: 'none', background: '#ee6123', borderColor: '#ee6123' }}
              >
                Get Started
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};
