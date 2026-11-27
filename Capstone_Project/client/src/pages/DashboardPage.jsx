import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { CreateLinkModal } from '../components/CreateLinkModal';
import { AnalyticsModal } from '../components/AnalyticsModal';
import { QRCodeModal } from '../components/QRCodeModal';
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
  IconQrCode,
  IconTrendingUp,
  IconFilter,
  IconZap,
} from '../components/Icons';

export const DashboardPage = () => {
  const { user } = useAuth();
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, active, expired, blocked
  const [copiedId, setCopiedId] = useState(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedAnalyticsId, setSelectedAnalyticsId] = useState(null);
  const [selectedQrLink, setSelectedQrLink] = useState(null);

  // Quick inline creation state
  const [quickUrl, setQuickUrl] = useState('');
  const [quickAlias, setQuickAlias] = useState('');
  const [quickLoading, setQuickLoading] = useState(false);
  const [quickError, setQuickError] = useState('');

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

  const handleQuickCreate = async (e) => {
    e.preventDefault();
    setQuickError('');

    if (!quickUrl.trim()) {
      setQuickError('Please enter a target URL');
      return;
    }

    try {
      setQuickLoading(true);
      const res = await api.createLink({
        originalUrl: quickUrl.trim(),
        alias: quickAlias.trim() || undefined,
      });

      if (res.link) {
        setLinks([res.link, ...links]);
        setQuickUrl('');
        setQuickAlias('');
      }
    } catch (err) {
      setQuickError(err.message || 'Failed to create short link');
    } finally {
      setQuickLoading(false);
    }
  };

  // Filter links by status
  const filteredLinks = links.filter((link) => {
    if (statusFilter === 'active') return !link.isExpired && !link.isBlocked;
    if (statusFilter === 'expired') return link.isExpired;
    if (statusFilter === 'blocked') return link.isBlocked;
    return true;
  });

  // Calculate high-level summary metrics
  const totalLinks = links.length;
  const totalClicks = links.reduce((sum, l) => sum + (l.clicksCount || 0), 0);
  const activeLinks = links.filter((l) => !l.isExpired && !l.isBlocked).length;
  const avgClicks = totalLinks > 0 ? (totalClicks / totalLinks).toFixed(1) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Top Banner / Welcome */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          paddingBottom: '0.5rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Links Management
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            Welcome, <strong style={{ color: 'var(--text-primary)' }}>{user?.name}</strong>! Create links, export QR codes, and monitor real-time clicks.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="btn"
          style={{
            background: 'linear-gradient(135deg, #ee6123, #ff7a45)',
            color: '#ffffff',
            fontWeight: 700,
            padding: '0.65rem 1.25rem',
            boxShadow: '0 4px 14px rgba(238, 97, 35, 0.35)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
          }}
        >
          <IconPlus size={16} />
          <span>Create Short Link</span>
        </button>
      </div>

      {/* Stats Summary Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '1rem',
        }}
      >
        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(238, 97, 35, 0.15)',
              color: '#ee6123',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconLink size={22} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Links
            </span>
            <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>{totalLinks}</div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--success-soft)',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconTrendingUp size={22} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Engagements
            </span>
            <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>{totalClicks}</div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--accent-soft)',
              color: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconZap size={22} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Active Links
            </span>
            <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>{activeLinks}</div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(192, 132, 252, 0.15)',
              color: '#c084fc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconBarChart size={22} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Avg. Clicks / Link
            </span>
            <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>{avgClicks}</div>
          </div>
        </div>
      </div>

      {/* Quick In-line Shorten Bar */}
      <div
        className="card"
        style={{
          padding: '1.25rem 1.5rem',
          background: 'linear-gradient(180deg, var(--bg-card) 0%, var(--bg-surface) 100%)',
          border: '1px solid rgba(238, 97, 35, 0.25)',
        }}
      >
        <form onSubmit={handleQuickCreate} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <input
            type="url"
            className="form-input"
            placeholder="Fast shorten: Paste long URL here..."
            value={quickUrl}
            onChange={(e) => setQuickUrl(e.target.value)}
            style={{ flex: '2 1 280px', fontSize: '0.9rem' }}
            required
          />
          <input
            type="text"
            className="form-input"
            placeholder="Optional custom alias (e.g. docs)"
            value={quickAlias}
            onChange={(e) => setQuickAlias(e.target.value)}
            style={{ flex: '1 1 160px', fontSize: '0.9rem', fontFamily: 'var(--font-mono)' }}
          />
          <button
            type="submit"
            disabled={quickLoading}
            className="btn"
            style={{
              background: '#ee6123',
              color: '#ffffff',
              fontWeight: 600,
              padding: '0.65rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              whiteSpace: 'nowrap',
            }}
          >
            <IconZap size={15} />
            <span>{quickLoading ? 'Creating...' : 'Shorten'}</span>
          </button>
        </form>
        {quickError && (
          <div style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.5rem' }}>
            {quickError}
          </div>
        )}
      </div>

      {/* Links List Section */}
      <div className="card" style={{ padding: '1.5rem' }}>
        
        {/* Search & Filter Header Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '1.25rem',
          }}
        >
          <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: '380px' }}>
            <IconSearch
              size={16}
              style={{
                position: 'absolute',
                left: '0.85rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              type="text"
              className="form-input"
              placeholder="Search by URL, alias or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '2.4rem', fontSize: '0.875rem' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <IconFilter size={15} style={{ color: 'var(--text-muted)' }} />
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ fontSize: '0.85rem', padding: '0.45rem 1rem', width: 'auto' }}
            >
              <option value="all">All Statuses ({links.length})</option>
              <option value="active">Active Only ({activeLinks})</option>
              <option value="expired">Expired</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '1.25rem' }}>
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: '1rem' }}>Loading links and click data...</div>
          </div>
        ) : filteredLinks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--text-secondary)' }}>
            <div style={{ color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              <IconLink size={36} />
            </div>
            <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)' }}>No links found</h3>
            <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
              {search || statusFilter !== 'all'
                ? 'Try adjusting your search query or status filter.'
                : 'Get started by creating your first shortened URL above!'}
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Short Link</th>
                  <th>Destination URL</th>
                  <th>Clicks</th>
                  <th>Status</th>
                  <th>Expires</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLinks.map((link) => (
                  <tr key={link._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <a
                          href={link.shortUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            fontWeight: 700,
                            color: '#ee6123',
                            fontSize: '0.9rem',
                            textDecoration: 'none',
                          }}
                        >
                          /{link.alias || link.shortCode}
                        </a>

                        <button
                          onClick={() => handleCopy(link._id, link.shortUrl)}
                          className="btn btn-icon btn-sm"
                          title="Copy short URL"
                          style={{
                            color: copiedId === link._id ? 'var(--success)' : 'var(--text-muted)',
                            background: copiedId === link._id ? 'var(--success-soft)' : 'transparent',
                          }}
                        >
                          {copiedId === link._id ? <IconCheck size={14} /> : <IconCopy size={14} />}
                        </button>
                      </div>
                    </td>

                    <td>
                      <div
                        style={{
                          maxWidth: '280px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontSize: '0.825rem',
                          color: 'var(--text-secondary)',
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
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          background: 'var(--bg-app)',
                          color: 'var(--accent)',
                          padding: '0.2rem 0.55rem',
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
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Permanent</span>
                      )}
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.35rem' }}>
                        
                        {/* QR Code Button */}
                        <button
                          onClick={() => setSelectedQrLink(link)}
                          className="btn btn-secondary btn-sm"
                          title="Generate Dynamic QR Code"
                          style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                        >
                          <IconQrCode size={13} style={{ color: '#ee6123' }} />
                          <span>QR</span>
                        </button>

                        {/* Analytics Button */}
                        <button
                          onClick={() => setSelectedAnalyticsId(link._id)}
                          className="btn btn-secondary btn-sm"
                          title="View Aggregation Analytics"
                          style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                        >
                          <IconBarChart size={13} style={{ color: 'var(--accent)' }} />
                          <span>Stats</span>
                        </button>

                        {/* External Visit Button */}
                        <a
                          href={link.shortUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-icon btn-sm"
                          title="Test Redirect"
                        >
                          <IconExternalLink size={14} />
                        </a>

                        {/* Delete Button */}
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

      <QRCodeModal
        link={selectedQrLink}
        isOpen={!!selectedQrLink}
        onClose={() => setSelectedQrLink(null)}
      />
    </div>
  );
};
