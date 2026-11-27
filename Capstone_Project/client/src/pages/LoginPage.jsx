import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  IconLink,
  IconAlert,
  IconGoogle,
  IconZap,
  IconShield,
  IconCheck,
} from '../components/Icons';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [demoLoading, setDemoLoading] = useState(null); // 'user' | 'admin' | 'google'

  const { login, loginDemo, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please provide both email and password');
      return;
    }

    try {
      setIsSubmitting(true);
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFastDemoLogin = async (role = 'user') => {
    setError('');
    try {
      setDemoLoading(role);
      await loginDemo(role);
      navigate(role === 'admin' ? '/admin' : '/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Fast demo login failed');
    } finally {
      setDemoLoading(null);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    try {
      setDemoLoading('google');
      await loginWithGoogle({
        email: 'alex.rivera@gmail.com',
        name: 'Alex Rivera',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
      });
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Google Sign-In failed');
    } finally {
      setDemoLoading(null);
    }
  };

  return (
    <div style={{ maxWidth: '440px', margin: '2.5rem auto', width: '100%', padding: '0 1rem' }}>
      <div className="card" style={{ padding: '2.25rem', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-lg)' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              background: 'linear-gradient(135deg, rgba(238, 97, 35, 0.2), rgba(56, 189, 248, 0.2))',
              border: '1px solid rgba(238, 97, 35, 0.4)',
              borderRadius: 'var(--radius-md)',
              color: '#ee6123',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '0.85rem',
            }}
          >
            <IconLink size={26} />
          </div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 700 }}>Welcome Back</h2>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Log in to manage links, track analytics, and generate QR codes
          </p>
        </div>

        {/* ⚡ Instant Demo Login Showcase */}
        <div
          style={{
            background: 'linear-gradient(180deg, rgba(238, 97, 35, 0.08) 0%, rgba(24, 24, 27, 0.6) 100%)',
            border: '1px solid rgba(238, 97, 35, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            marginBottom: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#ee6123', fontWeight: 600, fontSize: '0.825rem' }}>
              <IconZap size={15} />
              <span>1-Click Fast Demo Login</span>
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>No password needed</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
            <button
              type="button"
              disabled={!!demoLoading}
              onClick={() => handleFastDemoLogin('user')}
              className="btn"
              style={{
                background: '#ee6123',
                color: '#ffffff',
                fontSize: '0.8125rem',
                fontWeight: 600,
                padding: '0.55rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.35rem',
              }}
            >
              <IconZap size={14} />
              <span>{demoLoading === 'user' ? 'Logging in...' : 'Demo User'}</span>
            </button>

            <button
              type="button"
              disabled={!!demoLoading}
              onClick={() => handleFastDemoLogin('admin')}
              className="btn btn-secondary"
              style={{
                fontSize: '0.8125rem',
                fontWeight: 600,
                padding: '0.55rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.35rem',
                borderColor: 'rgba(192, 132, 252, 0.4)',
                color: '#c084fc',
              }}
            >
              <IconShield size={14} />
              <span>{demoLoading === 'admin' ? 'Logging in...' : 'Demo Admin'}</span>
            </button>
          </div>
        </div>

        {/* Google Sign-In Button */}
        <button
          type="button"
          disabled={!!demoLoading}
          onClick={handleGoogleLogin}
          style={{
            width: '100%',
            padding: '0.65rem',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-strong)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-primary)',
            fontSize: '0.875rem',
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.65rem',
            marginBottom: '1.25rem',
            transition: 'background 0.15s, border-color 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-strong)')}
        >
          <IconGoogle size={18} />
          <span>{demoLoading === 'google' ? 'Connecting to Google...' : 'Continue with Google'}</span>
        </button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            or with email
          </span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '1.25rem' }}>
            <IconAlert size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Standard Email / Password Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="alex@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !!demoLoading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.7rem', fontWeight: 600 }}
          >
            {isSubmitting ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#ee6123', fontWeight: 600 }}>
            Create one free
          </Link>
        </div>
      </div>
    </div>
  );
};
