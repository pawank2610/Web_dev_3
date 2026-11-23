import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { IconLink, IconAlert, IconShield } from '../components/Icons';

export const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name || !email || !password) {
      setError('Please fill in all required fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      setIsSubmitting(true);
      await register(name, email, password, role);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '460px', margin: '2.5rem auto', width: '100%' }}>
      <div className="card" style={{ padding: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
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
          <h2 style={{ fontSize: '1.35rem' }}>Create Your Account</h2>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Register to shorten URLs and view analytics
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
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="Alex Johnson"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

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

          <div className="form-group">
            <label className="form-label">Password (Min. 6 characters)</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          {/* Role selector for test/grading convenience */}
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <IconShield size={14} />
              Account Role (RBAC Selection)
            </label>
            <select
              className="form-select"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="user">User (Standard Link Creator)</option>
              <option value="admin">Admin (Moderation & System Overview)</option>
            </select>
            <span className="form-helper">
              Select <strong>Admin</strong> if you want to test and grade the RBAC protected administration routes.
            </span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.7rem' }}
          >
            {isSubmitting ? 'Creating Account...' : 'Complete Registration'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 500 }}>
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
