import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

/* ── Footer Link Items ── */
const faqLinks = [
  { label: 'Browse FAQs', href: '#' },
  { label: 'Ask a Question', href: '#' },
  { label: 'Track Query', href: '#' },
  { label: 'Admin Panel', href: '#' },
  { label: 'Community', href: '#' },
];

const techStack = [
  { label: 'React + Vite', href: '#' },
  { label: 'Framer Motion', href: '#' },
  { label: 'Node.js API', href: '#' },
  { label: 'JWT Auth', href: '#' },
];

const socials = [
  { icon: '🌐', label: 'Samagama', href: 'https://samagama.in' },
  { icon: '💼', label: 'LinkedIn', href: 'https://www.linkedin.com/company/vicharanashala/' },
  { icon: '🤖', label: 'Vicharanashala AI', href: 'http://vicharanashala.ai' },
  { icon: '📋', label: 'GitHub', href: '#' },
];

/* ── Shared link animation ── */
const linkVariants = {
  rest: { x: 0, color: 'var(--footer-text-link)' },
  hover: { x: 6, color: 'var(--footer-text-link-hover)' },
};

/* ── Footer Component ── */
export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      style={{
        position: 'relative',
        background: 'var(--footer-bg)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderTop: '1px solid var(--footer-border)',
        overflow: 'hidden',
      }}
    >
      {/* Top ambient glow */}
      <div
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          height: '1px',
          background: 'var(--footer-glow-gradient)',
          opacity: 0.4,
        }}
      />
      {/* Background orb */}
      <div
        style={{
          position: 'absolute',
          bottom: -80, left: '50%',
          transform: 'translateX(-50%)',
          width: 600, height: 200,
          background: 'var(--footer-orb-gradient)',
          pointerEvents: 'none',
        }}
      />

      {/* ── Main Footer Content ── */}
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '60px 80px 40px',
        }}
      >
        {/* 4-Column Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.6fr 1fr 1fr 1fr',
            gap: 40,
            marginBottom: 48,
          }}
        >
          {/* Col 1 — Brand */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  width: 36, height: 36,
                  background: 'linear-gradient(135deg, #b5f23d, #6ee7b7)',
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 16,
                  boxShadow: '0 0 20px var(--footer-brand-icon-shadow)',
                }}
              >
                📋
              </div>
              <span
                style={{
                  fontSize: 17,
                  fontWeight: 800,
                  color: 'var(--footer-text-brand)',
                  letterSpacing: '-0.3px',
                }}
              >
                Vicharanashala
              </span>
            </div>
            <p
              style={{
                fontSize: 13,
                color: 'var(--footer-text-p)',
                lineHeight: 1.7,
                marginBottom: 20,
                maxWidth: 260,
              }}
            >
              The official IIT Ropar FAQ portal — built for the community, powered by AI, designed for clarity.
            </p>
            {/* Status indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ position: 'relative' }}>
                <motion.div
                  animate={{ scale: [1, 1.6, 1], opacity: [1, 0, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  style={{
                    position: 'absolute',
                    inset: -3,
                    borderRadius: '50%',
                    background: 'var(--footer-status-dot)',
                    opacity: 0.35,
                  }}
                />
                <div
                  style={{
                    width: 8, height: 8,
                    borderRadius: '50%',
                    background: 'var(--footer-status-dot)',
                    boxShadow: '0 0 8px var(--footer-status-dot)',
                    position: 'relative',
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: 12,
                  color: 'var(--footer-status-text)',
                  fontWeight: 600,
                  letterSpacing: '0.5px',
                }}
              >
                All systems operational
              </span>
            </div>
          </div>

          {/* Col 2 — FAQ Navigation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h4
              style={{
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                color: 'var(--footer-text-h4)',
                marginBottom: 18,
              }}
            >
              Quick Links
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {faqLinks.map((link) => (
                <li key={link.label}>
                  <motion.a
                    href={link.href}
                    variants={linkVariants}
                    initial="rest"
                    whileHover="hover"
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    style={{
                      fontSize: 13,
                      color: 'var(--footer-text-link)',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <span style={{ color: 'var(--footer-arrow-color)', fontSize: 10 }}>›</span>
                    {link.label}
                  </motion.a>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Col 3 — Tech Stack */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h4
              style={{
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                color: 'var(--footer-text-h4)',
                marginBottom: 18,
              }}
            >
              Built With
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {techStack.map((item) => (
                <li key={item.label}>
                  <motion.a
                    href={item.href}
                    variants={linkVariants}
                    initial="rest"
                    whileHover="hover"
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    style={{
                      fontSize: 13,
                      color: 'var(--footer-text-link)',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <span style={{ color: 'var(--footer-arrow-color)', fontSize: 10 }}>›</span>
                    {item.label}
                  </motion.a>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Col 4 — Socials */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h4
              style={{
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                color: 'var(--footer-text-h4)',
                marginBottom: 18,
              }}
            >
              Connect
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {socials.map((social) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  variants={linkVariants}
                  initial="rest"
                  whileHover="hover"
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 10,
                    fontSize: 13,
                    color: 'var(--footer-text-link)',
                    textDecoration: 'none',
                  }}
                >
                  <span style={{ fontSize: 16 }}>{social.icon}</span>
                  {social.label}
                </motion.a>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Divider */}
        <div
          style={{
            height: '1px',
            background: 'var(--footer-divider-gradient)',
            marginBottom: 28,
          }}
        />

        {/* Bottom Copyright Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <p
            style={{
              fontSize: 12,
              color: 'var(--footer-text-p)',
              margin: 0,
            }}
          >
            © {year} Vicharanashala — IIT Ropar. All rights reserved.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <motion.div
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                width: 6, height: 6,
                borderRadius: '50%',
                background: 'var(--footer-status-dot)',
                boxShadow: '0 0 6px var(--footer-status-dot)',
              }}
            />
            <span
              style={{
                fontSize: 11,
                color: 'var(--footer-text-p)',
                fontWeight: 500,
              }}
            >
              v2.4.1 — Live
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}