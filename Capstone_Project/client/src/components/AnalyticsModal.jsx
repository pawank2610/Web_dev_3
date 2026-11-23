import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import {
  IconBarChart,
  IconSmartphone,
  IconLaptop,
  IconTablet,
  IconGlobe,
  IconClock,
  IconCopy,
  IconCheck,
  IconExternalLink,
} from './Icons';

export const AnalyticsModal = ({ linkId, isOpen, onClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && linkId) {
      loadAnalytics();
    }
  }, [isOpen, linkId]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.getLinkAnalytics(linkId);
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to load link analytics');
    } finally {
      setLoading(false);
    }
  };

  const copyShortUrl = () => {
    if (!data?.link?.shortUrl) return;
    navigator.clipboard.writeText(data.link.shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  const totalClicks = data?.link?.totalClicks || 0;
  const clicksByDevice = data?.analytics?.clicksByDevice || [];
  const clicksByDay = data?.analytics?.clicksByDay || [];
  const clicksByBrowser = data?.analytics?.clicksByBrowser || [];
  const recentClicks = data?.analytics?.recentClicks || [];

  const getDeviceIcon = (device) => {
    switch (device) {
      case 'Mobile':
        return <IconSmartphone size={16} />;
      case 'Tablet':
        return <IconTablet size={16} />;
      default:
        return <IconLaptop size={16} />;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <IconBarChart size={18} style={{ color: 'var(--accent)' }} />
            <h3>Click Analytics & Insights</h3>
          </div>
          <button
            onClick={onClose}
            className="btn btn-icon"
            style={{ border: 'none', fontSize: '1.25rem', padding: '0.2rem 0.5rem' }}
          >
            &times;
          </button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)' }}>
              Loading aggregation analytics...
            </div>
          ) : error ? (
            <div className="alert alert-danger">{error}</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Header Overview Card */}
              <div
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <code style={{ fontSize: '1.1rem', color: 'var(--accent)', fontWeight: 600 }}>
                      /{data.link.shortCode}
                    </code>
                    <button
                      onClick={copyShortUrl}
                      className="btn btn-icon btn-sm"
                      title="Copy short link"
                    >
                      {copied ? <IconCheck size={14} style={{ color: 'var(--success)' }} /> : <IconCopy size={14} />}
                    </button>
                    <a
                      href={data.link.shortUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-icon btn-sm"
                      title="Open short link in new tab"
                    >
                      <IconExternalLink size={14} />
                    </a>
                  </div>
                  <div
                    style={{
                      fontSize: '0.8rem',
                      color: 'var(--text-muted)',
                      marginTop: '0.35rem',
                      maxWidth: '450px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Target: {data.link.originalUrl}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.75rem', fontWeight: 700, lineHeight: 1 }}>
                    {totalClicks}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Total Engagements
                  </span>
                </div>
              </div>

              {/* Unique Twist: MongoDB Aggregations Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                {/* 1. Device Type Aggregation */}
                <div className="card">
                  <h4 style={{ fontSize: '0.9rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <IconSmartphone size={16} style={{ color: 'var(--accent)' }} />
                    Clicks by Device Type (Aggregation)
                  </h4>

                  {clicksByDevice.length === 0 ? (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No device data recorded yet.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {clicksByDevice.map((item) => {
                        const percentage = totalClicks > 0 ? Math.round((item.clicks / totalClicks) * 100) : 0;
                        return (
                          <div key={item.device}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', marginBottom: '0.25rem' }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                {getDeviceIcon(item.device)}
                                {item.device}
                              </span>
                              <span style={{ fontFamily: 'var(--font-mono)' }}>
                                {item.clicks} ({percentage}%)
                              </span>
                            </div>
                            <div style={{ height: '6px', backgroundColor: 'var(--bg-app)', borderRadius: '3px', overflow: 'hidden' }}>
                              <div
                                style={{
                                  width: `${percentage}%`,
                                  height: '100%',
                                  backgroundColor: 'var(--accent)',
                                  borderRadius: '3px',
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 2. Clicks by Day Aggregation */}
                <div className="card">
                  <h4 style={{ fontSize: '0.9rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <IconClock size={16} style={{ color: '#34d399' }} />
                    Daily Traffic Timeline (Aggregation)
                  </h4>

                  {clicksByDay.length === 0 ? (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No clicks recorded yet.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      {clicksByDay.map((item) => {
                        const maxDaily = Math.max(...clicksByDay.map((d) => d.clicks), 1);
                        const fillWidth = Math.round((item.clicks / maxDaily) * 100);
                        return (
                          <div key={item.date} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', width: '85px' }}>
                              {item.date}
                            </span>
                            <div style={{ flex: 1, height: '8px', backgroundColor: 'var(--bg-app)', borderRadius: '4px', overflow: 'hidden' }}>
                              <div
                                style={{
                                  width: `${fillWidth}%`,
                                  height: '100%',
                                  backgroundColor: '#10b981',
                                  borderRadius: '4px',
                                }}
                              />
                            </div>
                            <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', fontWeight: 600, width: '30px', textAlign: 'right' }}>
                              {item.clicks}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* 3. Recent Click Stream */}
              <div className="card" style={{ padding: '1rem' }}>
                <h4 style={{ fontSize: '0.875rem', marginBottom: '0.75rem' }}>Recent Click Activity Stream</h4>
                {recentClicks.length === 0 ? (
                  <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>No recent click events yet.</p>
                ) : (
                  <div className="table-wrapper">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Timestamp</th>
                          <th>Device</th>
                          <th>Browser</th>
                          <th>OS</th>
                          <th>Referrer</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentClicks.map((c) => (
                          <tr key={c._id}>
                            <td style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
                              {new Date(c.timestamp).toLocaleString()}
                            </td>
                            <td>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                                {getDeviceIcon(c.deviceType)}
                                {c.deviceType}
                              </span>
                            </td>
                            <td>{c.browser}</td>
                            <td>{c.os}</td>
                            <td style={{ color: 'var(--text-secondary)' }}>{c.referrer}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
