import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { CreateLinkModal } from '../components/CreateLinkModal';
import { AnalyticsModal } from '../components/AnalyticsModal';
import {
  IconPlus,
  IconSearch,
  IconCopy,
  IconCheck,
  IconBarChart,
  IconTrash,
  IconExternalLink,
  IconClock,
  IconLink,
} from '../components/Icons';

export const DashboardPage = () => {
  const { user } = useAuth();
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedAnalyticsId, setSelectedAnalyticsId] = useState(null);

  useEffect(() => {
    loadLinks();
  }, [search]);

  const loadLinks = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.getUserLinks(search);
      setLinks(res.links || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch links');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (id, shortUrl) => {
    navigator.clipboard.writeText(shortUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this short link? All click analytics will be permanently removed.')) {
      return;
    }

    try {
      await api.deleteLink(id);
      setLinks(links.filter((l) => l._id !== id));
    } catch (err) {
      alert(err.message || 'Failed to delete link');
    }
  };

  const totalClicks = links.reduce((sum, link) => sum + (link.clicksCount || 0), 0);
  const activeLinks = links.filter((link) => !link.isBlocked && !link.isExpired).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Welcome & Action Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem' }}>Dashboard</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            Welcome back, <strong>{user?.name}</strong>. Manage your links and inspect traffic analytics.
          </p>
        </div>

        <button onClick={() => setIsCreateOpen(true)} className="btn btn-primary">
          <IconPlus size={16} />
          Create Short Link
        </button>
      </div>

      {/* Metric Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div className="card" style={{ padding: '1.25rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Total Links Created
          </span>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.35rem' }}>
            {links.length}
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Total Clicks Gathered
          </span>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.35rem', color: 'var(--accent)' }}>
            {totalClicks}
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Active / Operational
          </span>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.35rem', color: 'var(--success)' }}>
            {activeLinks}
          </div>
        </div>
      </div>

      {/* Search & Links Table */}
      <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem' }}>Your Short Links</h3>

          <div style={{ position: 'relative', width: '280px' }}>
            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
              <IconSearch size={14} />
            </span>
            <input
              type="text"
              className="form-input"
              placeholder="Search by code, alias, or URL..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '32px', fontSize: '0.8125rem' }}
            />
          </div>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)' }}>
            Loading short links...
          </div>
        ) : links.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--bg-card)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
                marginBottom: '1rem',
              }}
            >
              <IconLink size={24} />
            </div>
            <h4>No Short Links Found</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '360px', margin: '0.4rem auto 1.25rem' }}>
              {search
                ? 'No links match your search query. Try clearing the search filter.'
                : 'You have not created any short links yet. Shorten your first URL to start gathering analytics.'}
            </p>
            {!search && (
              <button onClick={() => setIsCreateOpen(true)} className="btn btn-primary btn-sm">
                <IconPlus size={14} />
                Create First Link
              </button>
            )}
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Short URL & Alias</th>
                  <th>Destination Target</th>
                  <th>Clicks</th>
                  <th>Status</th>
                  <th>Expiration</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {links.map((link) => (
                  <tr key={link._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <code style={{ fontSize: '0.875rem', color: 'var(--accent)', fontWeight: 600 }}>
                          /{link.shortCode}
                        </code>
                        <button
                          onClick={() => handleCopy(link._id, link.shortUrl)}
                          className="btn btn-icon btn-sm"
                          title="Copy short link"
                        >
                          {copiedId === link._id ? (
                            <IconCheck size={13} style={{ color: 'var(--success)' }} />
                          ) : (
                            <IconCopy size={13} />
                          )}
                        </button>
                      </div>
                      {link.alias && (
                        <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                          Alias: {link.alias}
                        </span>
                      )}
                    </td>

                    <td>
                      <div
                        style={{
                          maxWidth: '260px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontSize: '0.8125rem',
                        }}
                        title={link.originalUrl}
                      >
                        {link.originalUrl}
                      </div>
                    </td>

                    <td>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 600,
                          fontSize: '0.85rem',
                          background: 'var(--bg-app)',
                          padding: '0.2rem 0.5rem',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-subtle)',
                        }}
                      >
                        {link.clicksCount}
                      </span>
                    </td>

                    <td>
                      {link.isBlocked ? (
                        <span className="badge badge-blocked" title={link.blockReason}>
                          Blocked
                        </span>
                      ) : link.isExpired ? (
                        <span className="badge badge-expired">Expired</span>
                      ) : (
                        <span className="badge badge-active">Active</span>
                      )}
                    </td>

                    <td>
                      {link.expiresAt ? (
                        <span style={{ fontSize: '0.775rem', color: link.isExpired ? 'var(--warning)' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <IconClock size={12} />
                          {new Date(link.expiresAt).toLocaleDateString()}
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Never</span>
                      )}
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.4rem' }}>
                        <button
                          onClick={() => setSelectedAnalyticsId(link._id)}
                          className="btn btn-secondary btn-sm"
                          title="View Aggregation Analytics"
                        >
                          <IconBarChart size={14} style={{ color: 'var(--accent)' }} />
                          Analytics
                        </button>

                        <a
                          href={link.shortUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-icon btn-sm"
                          title="Test Redirect"
                        >
                          <IconExternalLink size={14} />
                        </a>

                        <button
                          onClick={() => handleDelete(link._id)}
                          className="btn btn-icon btn-sm"
                          title="Delete Link"
                          style={{ color: 'var(--danger)' }}
                        >
                          <IconTrash size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateLinkModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onLinkCreated={(newLink) => {
          setLinks([newLink, ...links]);
        }}
      />

      <AnalyticsModal
        linkId={selectedAnalyticsId}
        isOpen={!!selectedAnalyticsId}
        onClose={() => setSelectedAnalyticsId(null)}
      />
    </div>
  );
};
