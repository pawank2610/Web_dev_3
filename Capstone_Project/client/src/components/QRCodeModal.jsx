import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  IconQrCode,
  IconCopy,
  IconCheck,
  IconDownload,
  IconExternalLink,
} from './Icons';

export const QRCodeModal = ({ link, isOpen, onClose }) => {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && link?.shortUrl) {
      setLoading(true);
      QRCode.toDataURL(link.shortUrl, {
        width: 320,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then((url) => {
          setQrDataUrl(url);
          setLoading(false);
        })
        .catch((err) => {
          console.error('Failed to generate QR Code:', err);
          setLoading(false);
        });
    }
  }, [isOpen, link]);

  if (!isOpen || !link) return null;

  const copyUrl = () => {
    navigator.clipboard.writeText(link.shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `qrcode-${link.alias || link.shortCode || 'shortlink'}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '440px', textAlign: 'center' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
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
              <IconQrCode size={20} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <h3 style={{ fontSize: '1.15rem' }}>Dynamic QR Code</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Scan to instantly visit short link
              </p>
            </div>
          </div>
          <button className="btn btn-icon" onClick={onClose} style={{ fontSize: '1.25rem', lineHeight: 1 }}>
            &times;
          </button>
        </div>

        {/* QR Code Container */}
        <div
          style={{
            background: '#ffffff',
            padding: '1.25rem',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
            display: 'inline-block',
            margin: '0 auto 1.25rem auto',
          }}
        >
          {loading ? (
            <div style={{ width: '220px', height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
              Generating QR Code...
            </div>
          ) : (
            <img
              src={qrDataUrl}
              alt={`QR Code for ${link.shortUrl}`}
              style={{ width: '220px', height: '220px', display: 'block' }}
            />
          )}
        </div>

        {/* Link Info Box */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.75rem 1rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.5rem',
          }}
        >
          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'left' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--accent)' }}>
              {link.shortUrl}
            </span>
          </div>
          <button
            onClick={copyUrl}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}
          >
            {copied ? <IconCheck size={14} style={{ color: 'var(--success)' }} /> : <IconCopy size={14} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <button
            onClick={downloadQr}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.65rem' }}
          >
            <IconDownload size={16} />
            <span>Download PNG</span>
          </button>
          <a
            href={link.shortUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.65rem' }}
          >
            <IconExternalLink size={16} />
            <span>Open Link</span>
          </a>
        </div>
      </div>
    </div>
  );
};
