import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  IconShield,
  IconSearch,
  IconExternalLink,
  IconSmartphone,
  IconLaptop,
  IconTablet,
  IconAlert,
  IconCheck,
} from '../components/Icons';

export const AdminDashboardPage = () => {
  const [links, setLinks] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Moderation state
  const [blockingId, setBlockingId] = useState(null);
  const [blockReason, setBlockReason] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    loadAdminData();
  }, [search, statusFilter]);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      setError('');
      const [linksRes, usersRes, statsRes] = await Promise.all([
        api.getAdminLinks({ search, status: statusFilter }),
        api.getAdminUsers(),
        api.getAdminStats(),
      ]);
      setLinks(linksRes.links || []);
      setUsers(usersRes.users || []);
      setStats(statsRes.stats || null);
    } catch (err) {
      setError(err.message || 'Failed to load administrative data');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBlock = async (link) => {
    if (link.isBlocked) {
      // Unblock directly
      if (!window.confirm(`Unblock link /${link.shortCode}?`)) return;
      try {
        await api.updateLinkStatus(link._id, { isBlocked: false, blockReason: '' });
        loadAdminData();
      } catch (err) {
        alert(err.message || 'Failed to unblock link');
      }
    } else {
      // Prompt for block reason
      setBlockingId(link._id);
      setBlockReason('Phishing, malware, or inappropriate destination URL');
    }
  };

  const submitBlock = async () => {
    if (!blockingId) return;
    try {
      setIsUpdatingStatus(true);
      await api.updateLinkStatus(blockingId, {
        isBlocked: true,
        blockReason: blockReason.trim() || 'Suspended by admin',
      });
      setBlockingId(null);
      setBlockReason('');
      loadAdminData();
    } catch (err) {
      alert(err.message || 'Failed to block link');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Admin Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', padding: '0.6rem', borderRadius: 'var(--radius-sm)' }}>
          <IconShield size={24} />
        </div>
        <div>
          <h1 style={{ fontSize: '1.75rem' }}>RBAC Administration Panel</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            System-wide link moderation, user directories, and platform aggregation metrics.
          </p>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Platform-Wide Aggregations & Metrics */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div className="card" style={{ padding: '1.25rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Platform Users
            </span>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.35rem' }}>
              {stats.totalUsers}
            </div>
          </div>

          <div className="card" style={{ padding: '1.25rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Short Links
            </span>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.35rem' }}>
              {stats.totalLinks}
            </div>
          </div>

          <div className="card" style={{ padding: '1.25rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Blocked Links
            </span>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.35rem', color: 'var(--danger)' }}>
              {stats.blockedLinks}
            </div>
          </div>

          <div className="card" style={{ padding: '1.25rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total System Clicks
            </span>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.35rem', color: 'var(--accent)' }}>
              {stats.totalClicks}
            </div>
          </div>
        </div>
      )}

      {/* Aggregation Device Distribution Across All Links */}
      {stats?.systemDeviceStats && stats.systemDeviceStats.length > 0 && (
        <div className="card">
          <h4 style={{ fontSize: '0.95rem', marginBottom: '0.85rem' }}>
            System-Wide Device Breakdown (Platform Aggregation Pipeline)
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            {stats.systemDeviceStats.map((item) => (
              <div
                key={item.device}
                style={{
                  background: 'var(--bg-app)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.85rem',
                }}
              >
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.device}</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, marginTop: '0.2rem', fontFamily: 'var(--font-mono)' }}>
                  {item.clicks} <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-muted)' }}>clicks</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Global Links Moderation Table */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem' }}>All Platform Links</h3>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ width: '140px', fontSize: '0.8125rem' }}
            >
              <option value="">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="blocked">Blocked Only</option>
            </select>

            <div style={{ position: 'relative', width: '240px' }}>
              <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                <IconSearch size={14} />
              </span>
              <input
                type="text"
                className="form-input"
                placeholder="Filter links..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: '32px', fontSize: '0.8125rem' }}
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-secondary)' }}>
            Loading platform records...
          </div>
        ) : links.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)' }}>
            No links match filter criteria.
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Short Code</th>
                  <th>Owner</th>
                  <th>Target Destination</th>
                  <th>Clicks</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Moderation Action</th>
                </tr>
              </thead>
              <tbody>
                {links.map((link) => (
                  <tr key={link._id}>
                    <td>
                      <code style={{ fontSize: '0.85rem', color: 'var(--accent)', fontWeight: 600 }}>
                        /{link.shortCode}
                      </code>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 500 }}>
                        {link.createdBy?.name || 'Unknown User'}
                      </div>
                      <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                        {link.createdBy?.email}
                      </div>
                    </td>
                    <td>
                      <div
                        style={{
                          maxWidth: '220px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontSize: '0.8rem',
                        }}
                      >
                        {link.originalUrl}
                      </div>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{link.clicksCount}</td>
                    <td>
                      {link.isBlocked ? (
                        <span className="badge badge-blocked" title={link.blockReason}>
                          Blocked
                        </span>
                      ) : (
                        <span className="badge badge-active">Active</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => handleToggleBlock(link)}
                        className={`btn btn-sm ${link.isBlocked ? 'btn-secondary' : 'btn-danger'}`}
                      >
                        {link.isBlocked ? 'Unblock Link' : 'Block Link'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Users Overview Directory */}
      <div className="card">
        <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Registered Users Directory</h3>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Total Links</th>
                <th>Total Clicks</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
                  <td style={{ fontWeight: 500 }}>{u.name}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                  <td>
                    <span className={`badge ${u.role === 'admin' ? 'badge-role-admin' : 'badge-role-user'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>{u.totalLinks}</td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>{u.totalClicks}</td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Block Reason Modal */}
      {blockingId && (
        <div className="modal-overlay" onClick={() => setBlockingId(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Block Abusive Short Link</h3>
              <button onClick={() => setBlockingId(null)} className="btn btn-icon">
                &times;
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Specify why this short link is being suspended. Visitors will see this notice if they attempt to access it.
              </p>
              <div className="form-group">
                <label className="form-label">Block Reason</label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="e.g. Malicious URL, spam, or phishing"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setBlockingId(null)} className="btn btn-secondary">
                Cancel
              </button>
              <button
                onClick={submitBlock}
                disabled={isUpdatingStatus}
                className="btn btn-danger"
              >
                {isUpdatingStatus ? 'Suspending...' : 'Confirm Suspension'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
