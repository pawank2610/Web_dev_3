import React from 'react';
import { Link } from 'react-router-dom';

export const NotFoundPage = () => {
  return (
    <div style={{ textAlign: 'center', padding: '5rem 1.5rem' }}>
      <h1 style={{ fontSize: '3.5rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
        404
      </h1>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Page Not Found</h2>
      <p style={{ color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto 1.5rem' }}>
        The page you are looking for does not exist or has been relocated.
      </p>
      <Link to="/" className="btn btn-primary">
        &larr; Back to Home
      </Link>
    </div>
  );
};
