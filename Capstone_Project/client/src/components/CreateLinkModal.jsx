import React, { useState } from 'react';
import { api } from '../services/api';
import { IconLink, IconClock, IconAlert } from './Icons';

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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <IconLink size={18} style={{ color: 'var(--accent)' }} />
            <h3>Create Short Link</h3>
          </div>
          <button
            onClick={onClose}
            className="btn btn-icon"
            style={{ border: 'none', fontSize: '1.25rem', padding: '0.2rem 0.5rem' }}
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div className="alert alert-danger">
                <IconAlert size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">
                Destination URL <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="https://example.com/very/long/destination/url"
                value={originalUrl}
                onChange={(e) => setOriginalUrl(e.target.value)}
                autoFocus
                required
              />
              <span className="form-helper">The destination webpage you want to redirect visitors to.</span>
            </div>

            <div className="form-group">
              <label className="form-label">Custom Alias (Optional)</label>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRight: 'none',
                    padding: '0.625rem 0.75rem',
                    borderTopLeftRadius: 'var(--radius-sm)',
                    borderBottomLeftRadius: 'var(--radius-sm)',
                    color: 'var(--text-muted)',
                    fontSize: '0.85rem',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  shortlink.dev/
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
              <span className="form-helper">Leave blank to generate a high-entropy crypto short code automatically.</span>
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
              <span className="form-helper">The link will automatically stop redirecting after this timestamp.</span>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary">
              {isSubmitting ? 'Creating...' : 'Shorten URL'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
