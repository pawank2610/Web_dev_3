import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  IconLink,
  IconBarChart,
  IconShield,
  IconClock,
  IconSmartphone,
} from '../components/Icons';

export const HomePage = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3.5rem', paddingTop: '1.5rem' }}>
      {/* Hero Section */}
      <section style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.3rem 0.85rem',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--accent-soft)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            color: 'var(--accent)',
            fontSize: '0.8rem',
            fontWeight: 600,
            letterSpacing: '0.02em',
          }}
        >
          <span>Web Dev III Capstone Project 10</span>
          <span>&bull;</span>
          <span>Bitly Clone with Device Analytics</span>
        </div>

        <h1 style={{ fontSize: '3rem', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.03em' }}>
          Shorten URLs. Set Expirations. <br />
          <span style={{ color: 'var(--accent)' }}>See Who Clicked.</span>
        </h1>

        <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '640px' }}>
          ShortLink is an enterprise-grade URL shortener built with Express, Mongoose, JWT access & refresh tokens, and a React Context API frontend. Analyze traffic with real-time MongoDB aggregations.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.75rem' }}>
          {isAuthenticated ? (
            <Link to="/dashboard" className="btn btn-primary" style={{ padding: '0.75rem 1.75rem', fontSize: '0.95rem' }}>
              Go to Your Dashboard &rarr;
            </Link>
          ) : (
            <>
              <Link to="/register" className="btn btn-primary" style={{ padding: '0.75rem 1.75rem', fontSize: '0.95rem' }}>
                Start Shortening Free
              </Link>
              <Link to="/login" className="btn btn-secondary" style={{ padding: '0.75rem 1.5rem', fontSize: '0.95rem' }}>
                Sign In
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Feature Grid */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ color: 'var(--accent)', background: 'var(--accent-soft)', width: 'fit-content', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
            <IconLink size={20} />
          </div>
          <h3 style={{ fontSize: '1.05rem' }}>High-Entropy Crypto Short Codes</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Generated with Node.js <code>crypto</code> base64url generation or user-defined custom aliases, backed by unique Mongoose indexes.
          </p>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ color: '#10b981', background: 'var(--success-soft)', width: 'fit-content', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
            <IconBarChart size={20} />
          </div>
          <h3 style={{ fontSize: '1.05rem' }}>Aggregation Analytics</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            MongoDB aggregation pipelines aggregate clicks by day and device type (Mobile, Desktop, Tablet) extracted live from the <code>User-Agent</code>.
          </p>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ color: '#c084fc', background: 'rgba(168, 85, 247, 0.15)', width: 'fit-content', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
            <IconShield size={20} />
          </div>
          <h3 style={{ fontSize: '1.05rem' }}>Role-Based Access Control (RBAC)</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Admin supervisors can inspect system-wide link distribution, monitor traffic metrics, and suspend or block abusive links with reason logging.
          </p>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ color: '#f59e0b', background: 'var(--warning-soft)', width: 'fit-content', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
            <IconClock size={20} />
          </div>
          <h3 style={{ fontSize: '1.05rem' }}>Self-Expiring Short Links</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Set optional expiration timestamps. When expired, the redirection handler automatically rejects requests with an HTTP 410 Gone status.
          </p>
        </div>
      </section>
    </div>
  );
};
