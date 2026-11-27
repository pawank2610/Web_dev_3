import React, { useState } from 'react';
import { api } from '../services/api';
import { IconLink, IconClock, IconAlert, IconZap } from './Icons';

export const CreateLinkModal = ({ isOpen, onClose, onLinkCreated }) => {
  const [originalUrl, setOriginalUrl] = useState('');
  const [alias, setAlias] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!originalUrl.trim()) {
      setError('Please provide a destination URL');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        originalUrl: originalUrl.trim(),
        alias: alias.trim() || undefined,
        expiresAt: expiresAt || undefined,
      };

      const res = await api.createLink(payload);
      if (res.success) {
        setOriginalUrl('');
        setAlias('');
        setExpiresAt('');
        onLinkCreated(res.link);
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Failed to create short link');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                background: 'rgba(238, 97, 35, 0.15)',
                color: '#ee6123',
                padding: '0.45rem',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconLink size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Create New Short Link</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Transform any long URL into a trackable short link
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-icon"
            style={{ fontSize: '1.4rem', lineHeight: 1 }}
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {error && (
              <div className="alert alert-danger">
                <IconAlert size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">
                Destination URL <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <input
                type="url"
                className="form-input"
                placeholder="https://example.com/very/long/destination/url"
                value={originalUrl}
                onChange={(e) => setOriginalUrl(e.target.value)}
                autoFocus
                required
              />
              <span className="form-helper">The destination webpage visitors will be redirected to.</span>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Custom Alias (Optional)</label>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span
                  style={{
                    backgroundColor: 'var(--bg-app)',
                    border: '1px solid var(--border-strong)',
                    borderRight: 'none',
                    padding: '0.65rem 0.85rem',
                    borderTopLeftRadius: 'var(--radius-sm)',
                    borderBottomLeftRadius: 'var(--radius-sm)',
                    color: 'var(--text-muted)',
                    fontSize: '0.85rem',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  localhost:5000/
                </span>
                <input
                  type="text"
                  className="form-input"
                  placeholder="my-custom-slug"
                  value={alias}
                  onChange={(e) => setAlias(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''))}
                  style={{
                    borderTopLeftRadius: 0,
                    borderBottomLeftRadius: 0,
                    fontFamily: 'var(--font-mono)',
                  }}
                />
              </div>
              <span className="form-helper">Leave empty to generate a random 6-character crypto code.</span>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <IconClock size={14} />
                Expiration Date (Optional)
              </label>
              <input
                type="datetime-local"
                className="form-input"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
              <span className="form-helper">Link will return 410 Gone after this date/time.</span>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '0.75rem',
              marginTop: '1.75rem',
              paddingTop: '1.25rem',
              borderTop: '1px solid var(--border-subtle)',
            }}
          >
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn"
              style={{
                background: 'linear-gradient(135deg, #ee6123, #ff7a45)',
                color: '#ffffff',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <IconZap size={15} />
              <span>{isSubmitting ? 'Shortening...' : 'Create Short Link'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
