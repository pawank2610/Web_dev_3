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
  const recentClicks = data?.analytics?.recentClicks || [];

  const getDeviceIcon = (device) => {
    const devLower = (device || '').toLowerCase();
    if (devLower.includes('mobile')) return <IconSmartphone size={16} />;
    if (devLower.includes('tablet')) return <IconTablet size={16} />;
    return <IconLaptop size={16} />;
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '680px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                background: 'rgba(56, 189, 248, 0.15)',
                color: 'var(--accent)',
                padding: '0.45rem',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconBarChart size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Click Analytics & Insights</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Powered by real-time MongoDB Aggregation Pipelines
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

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 0', color: 'var(--text-secondary)' }}>
            Loading aggregation analytics...
          </div>
        ) : error ? (
          <div className="alert alert-danger">{error}</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Header Link Card */}
            <div
              style={{
                backgroundColor: 'var(--bg-app)',
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
                  <span style={{ fontSize: '1.15rem', color: '#ee6123', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                    /{data.link.alias || data.link.shortCode}
                  </span>
                  <button
                    onClick={copyShortUrl}
                    className="btn btn-icon btn-sm"
                    title="Copy short link"
                    style={{ color: copied ? 'var(--success)' : 'var(--text-muted)' }}
                  >
                    {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                  </button>
                  <a
                    href={data.link.shortUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-icon btn-sm"
                    title="Open destination"
                  >
                    <IconExternalLink size={14} />
                  </a>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: '420px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '0.2rem' }}>
                  {data.link.originalUrl}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#10b981', lineHeight: 1 }}>
                  {totalClicks}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.2rem' }}>
                  Total Clicks
                </div>
              </div>
            </div>

            {/* Device Distribution Pipeline */}
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <IconSmartphone size={16} style={{ color: 'var(--accent)' }} />
                <span>Device Breakdown ($group & $project)</span>
              </h4>

              {clicksByDevice.length === 0 ? (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '0.5rem 0' }}>
                  No device data recorded yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {clicksByDevice.map((d) => {
                    const pct = totalClicks > 0 ? Math.round((d.count / totalClicks) * 100) : 0;
                    return (
                      <div key={d.device} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', textTransform: 'capitalize' }}>
                            {getDeviceIcon(d.device)}
                            <strong>{d.device || 'Desktop'}</strong>
                          </span>
                          <span style={{ color: 'var(--text-secondary)' }}>
                            {d.count} clicks ({pct}%)
                          </span>
                        </div>
                        <div
                          style={{
                            height: '8px',
                            background: 'var(--bg-app)',
                            borderRadius: 'var(--radius-full)',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              height: '100%',
                              width: `${pct}%`,
                              background: 'linear-gradient(90deg, #ee6123, #38bdf8)',
                              borderRadius: 'var(--radius-full)',
                              transition: 'width 0.4s ease',
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Daily Timeline */}
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <IconClock size={16} style={{ color: '#10b981' }} />
                <span>7-Day Engagement Timeline</span>
              </h4>

              {clicksByDay.length === 0 ? (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '0.5rem 0' }}>
                  No clicks recorded in the last 7 days.
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.6rem', height: '110px', paddingTop: '10px' }}>
                  {clicksByDay.map((day) => {
                    const maxClicks = Math.max(...clicksByDay.map((c) => c.clicks), 1);
                    const barHeight = Math.max((day.clicks / maxClicks) * 75, 12);
                    return (
                      <div
                        key={day.date}
                        style={{
                          flex: 1,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '0.35rem',
                        }}
                      >
                        <span style={{ fontSize: '0.72rem', color: 'var(--accent)', fontWeight: 700 }}>
                          {day.clicks}
                        </span>
                        <div
                          style={{
                            width: '100%',
                            height: `${barHeight}px`,
                            background: 'linear-gradient(180deg, #10b981 0%, rgba(16, 185, 129, 0.25) 100%)',
                            borderRadius: '4px',
                          }}
                        />
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          {day.date.slice(5)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recent Click Logs */}
            {recentClicks.length > 0 && (
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.65rem' }}>
                  Recent Access Events
                </h4>
                <div
                  style={{
                    background: 'var(--bg-app)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    maxHeight: '140px',
                    overflowY: 'auto',
                    fontSize: '0.78rem',
                  }}
                >
                  {recentClicks.map((c, i) => (
                    <div
                      key={c._id || i}
                      style={{
                        padding: '0.45rem 0.75rem',
                        borderBottom: i < recentClicks.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span style={{ textTransform: 'capitalize', color: 'var(--text-primary)' }}>
                        {c.deviceType || 'Desktop'} &bull; {c.referer || 'Direct'}
                      </span>
                      <span style={{ color: 'var(--text-muted)' }}>
                        {new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
