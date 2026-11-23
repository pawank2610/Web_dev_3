import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { IconLink, IconAlert } from '../components/Icons';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
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

  return (
    <div style={{ maxWidth: '420px', margin: '3rem auto', width: '100%' }}>
      <div className="card" style={{ padding: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              background: 'var(--accent-soft)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--accent)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '0.75rem',
            }}
          >
            <IconLink size={22} />
          </div>
          <h2 style={{ fontSize: '1.35rem' }}>Sign In to ShortLink</h2>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Manage your short URLs and track detailed click analytics
          </p>
        </div>

        {error && (
          <div className="alert alert-danger">
            <IconAlert size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="alex@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
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
            disabled={isSubmitting}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.7rem' }}
          >
            {isSubmitting ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--accent)', fontWeight: 500 }}>
            Create one free
          </Link>
        </div>
      </div>
    </div>
  );
};
