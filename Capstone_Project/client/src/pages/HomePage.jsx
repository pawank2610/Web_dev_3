import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import QRCode from 'qrcode';
import {
  IconLink,
  IconBarChart,
  IconShield,
  IconClock,
  IconZap,
  IconCopy,
  IconCheck,
  IconQrCode,
  IconExternalLink,
  IconDownload,
  IconSparkles,
  IconGoogle,
  IconTrendingUp,
} from '../components/Icons';

export const HomePage = () => {
  const { isAuthenticated, loginDemo, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  // Instant shortener state
  const [longUrl, setLongUrl] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [showAliasInput, setShowAliasInput] = useState(false);
  const [shortening, setShortening] = useState(false);
  const [shortenedResult, setShortenedResult] = useState(null);
  const [qrCodeData, setQrCodeData] = useState('');
  const [copied, setCopied] = useState(false);
  const [shortenError, setShortenError] = useState('');
  const [demoLoading, setDemoLoading] = useState(null);

  const handleShorten = async (e) => {
    e.preventDefault();
    setShortenError('');

    if (!longUrl.trim()) {
      setShortenError('Please enter or paste a valid URL');
      return;
    }

    try {
      setShortening(true);
      const res = await api.publicShorten({
        originalUrl: longUrl.trim(),
        alias: customAlias.trim() || undefined,
      });

      if (res.link) {
        setShortenedResult(res.link);
        const qrUrl = await QRCode.toDataURL(res.link.shortUrl, {
          width: 260,
          margin: 2,
          color: { dark: '#0f172a', light: '#ffffff' },
        });
        setQrCodeData(qrUrl);
      }
    } catch (err) {
      setShortenError(err.message || 'Failed to shorten URL');
    } finally {
      setShortening(false);
    }
  };

  const handleCopy = () => {
    if (!shortenedResult?.shortUrl) return;
    navigator.clipboard.writeText(shortenedResult.shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQr = () => {
    if (!qrCodeData) return;
    const a = document.createElement('a');
    a.href = qrCodeData;
    a.download = `qrcode-${shortenedResult?.alias || shortenedResult?.shortCode || 'shortlink'}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleFastDemo = async (role = 'user') => {
    try {
      setDemoLoading(role);
      await loginDemo(role);
      navigate(role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      console.error(err);
    } finally {
      setDemoLoading(null);
    }
  };

  const handleGoogleQuick = async () => {
    try {
      setDemoLoading('google');
      await loginWithGoogle({
        email: 'alex.rivera@gmail.com',
        name: 'Alex Rivera',
      });
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
    } finally {
      setDemoLoading(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4rem', paddingBottom: '3rem' }}>
      
      {/* Hero Section */}
      <section
        style={{
          textAlign: 'center',
          maxWidth: '860px',
          margin: '1.5rem auto 0 auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.5rem',
        }}
      >
        {/* Pill Tag */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.4rem 1rem',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'rgba(238, 97, 35, 0.12)',
            border: '1px solid rgba(238, 97, 35, 0.3)',
            color: '#ee6123',
            fontSize: '0.8125rem',
            fontWeight: 700,
            letterSpacing: '0.02em',
          }}
        >
          <IconSparkles size={16} />
          <span>ShortLink Bitly Clone</span>
          <span>&bull;</span>
          <span>Web Development III Capstone</span>
        </div>

        {/* Big Catchy Title */}
        <h1 style={{ fontSize: '3.4rem', fontWeight: 800, lineHeight: 1.12, letterSpacing: '-0.035em' }}>
          Shorten Links. Generate QR. <br />
          <span
            style={{
              background: 'linear-gradient(135deg, #ee6123 0%, #ff8a4c 50%, #38bdf8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Track Who Clicked.
          </span>
        </h1>

        <p style={{ fontSize: '1.15rem', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '680px' }}>
          A full-stack URL shortening platform with high-entropy crypto codes, dynamic QR code generation, real-time device analytics via MongoDB aggregation pipelines, and JWT authentication.
        </p>

        {/* ⚡ Fast 1-Click Access Bar */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-full)',
            padding: '0.45rem 0.85rem',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Instant Testing:
          </span>

          <button
            onClick={() => handleFastDemo('user')}
            disabled={!!demoLoading}
            className="btn"
            style={{
              background: '#ee6123',
              color: '#ffffff',
              fontSize: '0.78rem',
              fontWeight: 600,
              padding: '0.35rem 0.85rem',
              borderRadius: 'var(--radius-full)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            <IconZap size={14} />
            <span>{demoLoading === 'user' ? 'Loading...' : '⚡ Demo User'}</span>
          </button>

          <button
            onClick={() => handleFastDemo('admin')}
            disabled={!!demoLoading}
            className="btn"
            style={{
              background: 'rgba(192, 132, 252, 0.15)',
              border: '1px solid rgba(192, 132, 252, 0.4)',
              color: '#c084fc',
              fontSize: '0.78rem',
              fontWeight: 600,
              padding: '0.35rem 0.85rem',
              borderRadius: 'var(--radius-full)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            <IconShield size={14} />
            <span>{demoLoading === 'admin' ? 'Loading...' : '👑 Demo Admin'}</span>
          </button>

          <button
            onClick={handleGoogleQuick}
            disabled={!!demoLoading}
            className="btn"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-strong)',
              color: 'var(--text-primary)',
              fontSize: '0.78rem',
              fontWeight: 600,
              padding: '0.35rem 0.85rem',
              borderRadius: 'var(--radius-full)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <IconGoogle size={14} />
            <span>{demoLoading === 'google' ? 'Connecting...' : 'Google Login'}</span>
          </button>
        </div>

        {/* 🌟 BITLY SIGNATURE INTERACTIVE SHORTENER BOX */}
        <div
          style={{
            width: '100%',
            maxWidth: '780px',
            background: 'linear-gradient(180deg, var(--bg-card) 0%, var(--bg-surface) 100%)',
            border: '1px solid rgba(238, 97, 35, 0.35)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.75rem',
            boxShadow: '0 16px 48px rgba(0, 0, 0, 0.45)',
            textAlign: 'left',
            marginTop: '0.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: '#ee6123' }}>🔗</span>
              <span>Shorten a long URL</span>
            </h3>
            <button
              type="button"
              onClick={() => setShowAliasInput(!showAliasInput)}
              style={{
                background: 'transparent',
                border: 'none',
                color: showAliasInput ? '#ee6123' : 'var(--text-muted)',
                fontSize: '0.8rem',
                cursor: 'pointer',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              <span>{showAliasInput ? '− Hide Custom Alias' : '+ Add Custom Alias'}</span>
            </button>
          </div>

          <form onSubmit={handleShorten}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <input
                  type="url"
                  className="form-input"
                  placeholder="Paste your long link here (e.g. https://github.com/my-awesome-repo)..."
                  value={longUrl}
                  onChange={(e) => setLongUrl(e.target.value)}
                  style={{
                    flex: '1 1 340px',
                    fontSize: '0.95rem',
                    padding: '0.85rem 1rem',
                    borderColor: 'rgba(238, 97, 35, 0.3)',
                    background: 'var(--bg-app)',
                  }}
                  required
                />
                <button
                  type="submit"
                  disabled={shortening}
                  className="btn"
                  style={{
                    background: 'linear-gradient(135deg, #ee6123, #ff7a45)',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    padding: '0.85rem 1.75rem',
                    borderRadius: 'var(--radius-sm)',
                    boxShadow: '0 4px 16px rgba(238, 97, 35, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <IconZap size={16} />
                  <span>{shortening ? 'Shortening...' : 'Shorten URL'}</span>
                </button>
              </div>

              {/* Custom Alias Accordion */}
              {showAliasInput && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'var(--bg-app)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.35rem 0.85rem',
                  }}
                >
                  <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    localhost:5000/
                  </span>
                  <input
                    type="text"
                    placeholder="custom-alias (e.g. my-project-link)"
                    value={customAlias}
                    onChange={(e) => setCustomAlias(e.target.value)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      color: 'var(--text-primary)',
                      fontSize: '0.875rem',
                      fontFamily: 'var(--font-mono)',
                      width: '100%',
                    }}
                  />
                </div>
              )}
            </div>
          </form>

          {shortenError && (
            <div className="alert alert-danger" style={{ marginTop: '1rem' }}>
              <span>{shortenError}</span>
            </div>
          )}

          {/* Result Card */}
          {shortenedResult && (
            <div
              style={{
                marginTop: '1.5rem',
                padding: '1.25rem',
                background: 'rgba(238, 97, 35, 0.05)',
                border: '1px solid rgba(238, 97, 35, 0.35)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Shortened URL Ready
                  </span>
                  <a
                    href={shortenedResult.shortUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: '#ee6123',
                      fontSize: '1.15rem',
                      fontWeight: 700,
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    <span>{shortenedResult.shortUrl}</span>
                    <IconExternalLink size={16} />
                  </a>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', maxWidth: '420px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    Original: {shortenedResult.originalUrl}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    onClick={handleCopy}
                    className="btn"
                    style={{
                      background: copied ? 'var(--success)' : 'var(--bg-surface)',
                      border: '1px solid var(--border-strong)',
                      color: '#ffffff',
                      padding: '0.55rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                    }}
                  >
                    {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                    <span>{copied ? 'Copied!' : 'Copy Link'}</span>
                  </button>

                  <button
                    onClick={handleDownloadQr}
                    className="btn btn-secondary"
                    style={{
                      padding: '0.55rem 0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      fontSize: '0.85rem',
                    }}
                    title="Download QR Code"
                  >
                    <IconQrCode size={16} />
                    <span>QR Code</span>
                  </button>
                </div>
              </div>

              {/* QR Code Preview Drawer */}
              {qrCodeData && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1.25rem',
                    background: 'var(--bg-app)',
                    border: '1px solid var(--border-subtle)',
                    padding: '0.85rem 1.25rem',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  <img
                    src={qrCodeData}
                    alt="QR Code"
                    style={{ width: '70px', height: '70px', borderRadius: '4px', background: '#fff', padding: '4px' }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Dynamic QR Code Generated
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Scan with any smartphone camera to visit the destination link instantly.
                    </span>
                    <button
                      onClick={handleDownloadQr}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--accent)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: 0,
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        marginTop: '0.2rem',
                      }}
                    >
                      <IconDownload size={13} />
                      <span>Download High-Res PNG</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1.5rem',
          maxWidth: '1200px',
          margin: '0 auto',
          width: '100%',
        }}
      >
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ color: '#ee6123', background: 'rgba(238, 97, 35, 0.15)', width: 'fit-content', padding: '0.6rem', borderRadius: 'var(--radius-sm)' }}>
            <IconLink size={22} />
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Custom Aliases & Crypto Codes</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
            Generate random high-entropy crypto shortcodes or brand your links with human-readable custom back-halves backed by unique MongoDB indexes.
          </p>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ color: '#10b981', background: 'var(--success-soft)', width: 'fit-content', padding: '0.6rem', borderRadius: 'var(--radius-sm)' }}>
            <IconBarChart size={22} />
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Live Device Analytics</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
            MongoDB aggregation pipelines dissect user engagements across Mobile, Desktop, and Tablet with daily click timeline charts.
          </p>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ color: '#c084fc', background: 'rgba(168, 85, 247, 0.15)', width: 'fit-content', padding: '0.6rem', borderRadius: 'var(--radius-sm)' }}>
            <IconShield size={22} />
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Role-Based Access Control (RBAC)</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
            Dedicated Admin Dashboard with complete oversight. Inspect system-wide traffic, suspend malicious links, and log abuse reasons.
          </p>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ color: '#38bdf8', background: 'var(--accent-soft)', width: 'fit-content', padding: '0.6rem', borderRadius: 'var(--radius-sm)' }}>
            <IconClock size={22} />
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Self-Expiring Smart Links</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
            Configure optional expiration timestamps. Expired links are automatically decommissioned with HTTP 410 Gone status.
          </p>
        </div>
      </section>

      {/* Trust & Stats Footer Banner */}
      <section
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '2rem 1.5rem',
          maxWidth: '1200px',
          margin: '0 auto',
          width: '100%',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '2rem',
          textAlign: 'center',
        }}
      >
        <div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#ee6123' }}>302 Found</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Instant Non-Blocking Redirect
          </div>
        </div>

        <div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--accent)' }}>100% SVG</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Dynamic QR Code Generation
          </div>
        </div>

        <div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#10b981' }}>7-Day TTL</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            JWT Access + Refresh Rotation
          </div>
        </div>

        <div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#c084fc' }}>Pipeline</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            MongoDB Device Aggregations
          </div>
        </div>
      </section>

    </div>
  );
};
