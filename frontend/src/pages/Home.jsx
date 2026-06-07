import React, { useEffect, useRef, useState } from 'react';
import Footer from '../components/Footer';
import ThemeToggle from '../components/ThemeToggle';
import { Link } from 'react-router-dom';
import api from '../utils/api';

const features = [
  {
    icon: '🔍',
    title: 'Smart Search',
    desc: 'Find answers instantly across your entire FAQ knowledge base with AI-powered search.',
    expanded:
      'Powered by advanced natural language processing, our search engine understands context and intent — not just keywords. Type in plain English and get the most relevant FAQ entries, filtered by category, recency, and popularity. Zero latency. Infinite accuracy.',
  },
  {
    icon: '📝',
    title: 'Query Management',
    desc: 'Submit, track, and manage support queries in one unified dashboard.',
    expanded:
      'From submission to resolution, every query lives in one place. Attach files, tag categories, set priority levels, and receive real-time status updates. Our dashboard gives you a complete overview of all active, pending, and resolved queries at a glance.',
  },
  {
    icon: '⚡',
    title: 'Fast Resolution',
    desc: 'Intelligent routing and escalation ensures every query reaches the right person.',
    expanded:
      'Our AI-driven routing engine automatically categorizes and assigns queries to the appropriate team or admin based on keywords, urgency, and department. Complex issues are escalated instantly — no query falls through the cracks.',
  },
  {
    icon: '🔒',
    title: 'Role-Based Access',
    desc: 'Secure admin and user roles with JWT-powered authentication and fine-grained permissions.',
    expanded:
      'Granular role permissions control who can view, create, edit, or delete content. Admins have full moderation rights, power users can contribute FAQs, and regular users enjoy read-only access. Every action is authenticated and logged via secure JWT tokens.',
  },
  {
    icon: '📊',
    title: 'Admin Dashboard',
    desc: 'Review, approve, and manage all FAQ entries and user queries from a powerful admin panel.',
    expanded:
      'A command-center for administrators — approve pending submissions, resolve escalations, monitor query volume trends, and manage user accounts. Real-time analytics, bulk actions, and audit logs ensure total visibility and control over the entire platform.',
  },
  {
    icon: '🌐',
    title: 'Community Forum',
    desc: 'Discuss, share knowledge, and collaborate with the entire FAQ community.',
    expanded:
      'A space for peer-to-peer learning and open discussion. Interns and students can share experiences, answer each other\'s questions, and build a collective knowledge base. Upvote the best answers and bookmark discussions for quick reference later.',
  },
];

const stats = [
  { value: '2,400+', label: 'FAQ Entries' },
  { value: '8,500+', label: 'Students Helped' },
  { value: '98.7%', label: 'Query Resolution' },
  { value: '4.9/5', label: 'User Rating' },
];

const defaultFaqs = [
  {
    question: 'What is the Vicharanashala Internship?',
    answer:
      'The Vicharanashala Internship is a two-month learning and project-based internship where students work on real-world open-source and AI-driven projects under the guidance of mentors from the Vicharanashala Lab.',
  },
  {
    question: 'Who is eligible for the internship?',
    answer:
      'The internship is open to undergraduate, postgraduate, and doctoral students enrolled in recognized educational institutions.',
  },
  {
    question: 'How long is the internship?',
    answer:
      'The internship typically lasts for two months and includes structured project work, mentorship sessions, and learning activities.',
  },
  {
    question: 'Is there a stipend?',
    answer:
      'The VINS (Vicharanashala Internship with No Stipend) track focuses on practical learning, mentorship, skill development, and open-source contributions rather than financial compensation.',
  },
  {
    question: 'What kind of projects will I work on?',
    answer:
      'Interns work on projects related to Artificial Intelligence, Machine Learning, Web Development, Software Engineering, Education Technology, and Open Source initiatives.',
  },
  {
    question: 'Do I need a No Objection Certificate (NOC)?',
    answer:
      'Yes. Students are generally required to provide a valid NOC from their institution before beginning the internship.',
  },
  {
    question: 'Will I receive a certificate?',
    answer:
      'Yes. Students who successfully complete the internship requirements receive an official completion certificate from the Vicharanashala Lab.',
  },
  {
    question: 'How can I ask additional questions?',
    answer:
      'You can submit queries through the Vicharanashala platform, participate in the community forum, or reach out to mentors and administrators for guidance.',
  },
];

export default function Home() {
  const featuresGridRef = useRef(null);
  const aboutRef = useRef(null);
  const faqRef = useRef(null);
  const [expandedIdx, setExpandedIdx] = useState(null);
  const [faqExpandedIdx, setFaqExpandedIdx] = useState(null);
  const [visibleIndices, setVisibleIndices] = useState(() => new Set());
  const [faqs, setFaqs] = useState(defaultFaqs);
  // Fetch FAQs from API
  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        setFaqLoading(true);
        const response = await api.get('/faqs');
        if (response.data && response.data.length > 0) {
          setFaqs(response.data);
        } else {
          setFaqs(defaultFaqs);
        }
      } catch (err) {
        console.warn('Failed to fetch FAQs, using default:', err);
        setFaqs(defaultFaqs);
      } finally {
        setFaqLoading(false);
      }
    };
    fetchFaqs();
  }, []);

  const [faqLoading, setFaqLoading] = useState(false);

  useEffect(() => {
    const grid = featuresGridRef.current;
    if (!grid) return;

    const cards = grid.querySelectorAll('.feature-card');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            const idx = Number(el.dataset.index) || 0;
            setTimeout(() => {
              setVisibleIndices((prev) => {
                const next = new Set(prev);
                next.add(idx);
                return next;
              });
            }, idx * 80);
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, []);

  // About section scroll-reveal
  useEffect(() => {
    const section = aboutRef.current;
    if (!section) return;

    const content = section.querySelector('.about-content');
    if (!content) return;

    content.style.opacity = '0';
    content.style.transform = 'translateY(30px)';
    content.style.transition = 'opacity 700ms cubic-bezier(0.34,1.56,0.64,1), transform 700ms cubic-bezier(0.34,1.56,0.64,1)';

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            content.style.opacity = '1';
            content.style.transform = 'translateY(0)';
          }, 100);
          observer.unobserve(section);
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const section = faqRef.current;
    if (!section) return;

    const reveal = section.querySelector('.faq-grid');
    if (!reveal) return;

    reveal.style.opacity = '0';
    reveal.style.transform = 'translateY(28px)';
    reveal.style.transition = 'opacity 700ms ease, transform 700ms ease';

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            reveal.style.opacity = '1';
            reveal.style.transform = 'translateY(0)';
          }, 120);
          observer.unobserve(section);
        }
      },
      { threshold: 0.18 }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  const toggleFeature = (i) => {
    setExpandedIdx((prev) => (prev === i ? null : i));
  };

  const toggleFaq = (i) => {
    setFaqExpandedIdx((prev) => (prev === i ? null : i));
  };

  return (
    <div className="home-page">
      {/* Nav */}
      <nav className="home-nav">
        <div className="home-nav-brand">
          <span className="brand-icon">📋</span>
          FAQ HUB
        </div>
        <div className="home-nav-links">
          <a href="#features">Focus Areas</a>
          <a href="#stats">Pillars</a>
          <a href="#stats">Questions</a>
          <Link to="/forum" className="nav-link">Forum</Link>
        </div>
        <div className="home-nav-actions">
          <ThemeToggle />
          <Link to="/login" className="btn-home-ghost">Sign In</Link>
          <Link to="/login" className="btn-home-primary">Get Started</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero-bg-orb hero-orb-1" />
        <div className="hero-bg-orb hero-orb-2" />
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-dot" />
            IIT Ropar — Official FAQ Portal
          </div>
          <h1 className="hero-title">
            Welcome to <em className="hero-word-em">Vicharanashala<svg className="hero-word-underline" viewBox="0 0 200 14" preserveAspectRatio="none" aria-hidden="true"><path d="M3 9 Q 45 2 95 7 T 197 9" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round" pathLength="100"></path></svg></em>, for <span className="italic-display">ambitious</span> minds.
          </h1>
          <p className="hero-subtitle">
            Your official IIT Ropar knowledge hub. Find answers, manage queries,
            and stay informed — all in one place. Built for the Ropar community.
          </p>
          <div className="hero-actions">
            <Link to="/login" className="btn-hero-primary">
              Get Started Free
              <span className="btn-arrow">→</span>
            </Link>
            <a href="#features" className="btn-hero-ghost">Learn More</a>
          </div>
          <div className="hero-social-proof">
            <div className="hero-avatars">
              <div className="hero-avatar">S</div>
              <div className="hero-avatar">A</div>
              <div className="hero-avatar">R</div>
              <div className="hero-avatar">+</div>
            </div>
            <span>Trusted by <strong>IIT Ropar</strong> community</span>
          </div>

          {/* Social Links */}
          <div className="hero-social-links">
            <a href="https://samagama.in" target="_blank" rel="noopener noreferrer" className="social-link-card social-link-samagama">
              <div className="social-link-icon">🌐</div>
              <div className="social-link-label">Samagama</div>
              <div className="social-link-sub">samagama.in</div>
            </a>
            <a href="https://www.linkedin.com/company/vicharanashala/" target="_blank" rel="noopener noreferrer" className="social-link-card social-link-linkedin">
              <div className="social-link-icon">💼</div>
              <div className="social-link-label">LinkedIn</div>
              <div className="social-link-sub">Follow Updates</div>
            </a>
            <a href="http://vicharanashala.ai" target="_blank" rel="noopener noreferrer" className="social-link-card social-link-vicharanashala">
              <div className="social-link-icon">🤖</div>
              <div className="social-link-label">Vicharanashala AI</div>
              <div className="social-link-sub">vicharanashala.ai</div>
            </a>
          </div>
        </div>
        <div className="hero-visual">
          <div className="announcement-stack">

            {/* Card 1 */}
            <div className="announce-card announce-card-1">
              <div className="announce-glow announce-glow-purple" />
              <div className="announce-inner">
                <div className="announce-header">
                  <span className="announce-badge announce-badge-purple">
                    <span className="badge-dot-purple" />
                    Important Announcement
                  </span>
                </div>
                <p className="announce-headline">Summer Internship Registration is now open.</p>
                <p className="announce-meta">Registration closes on June 30.</p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="announce-card announce-card-2">
              <div className="announce-glow announce-glow-blue" />
              <div className="announce-inner">
                <div className="announce-header">
                  <span className="announce-badge announce-badge-blue">
                    <span className="badge-dot-blue" />
                    New Update
                  </span>
                </div>
                <p className="announce-headline">AI-powered FAQ recommendations have been launched.</p>
                <p className="announce-meta">Experience faster and smarter query resolution.</p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="announce-card announce-card-3">
              <div className="announce-glow announce-glow-green" />
              <div className="announce-inner">
                <div className="announce-header">
                  <span className="announce-badge announce-badge-green">
                    <span className="badge-dot-green" />
                    Upcoming Event
                  </span>
                </div>
                <p className="announce-headline">Internship Orientation Session</p>
                <p className="announce-meta">July 5 at 5:00 PM IST</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Features — Premium AI SaaS */}
      <section className="features-section" id="features">
        {/* Ambient background glows */}
        <div className="features-glow features-glow-purple" />
        <div className="features-glow features-glow-blue" />
        <div className="features-glow features-glow-core" />

        {/* Dot-grid overlay */}
        <div className="features-grid-overlay" />

        {/* Floating ambient orbs */}
        <div className="features-float-orb features-float-orb-1" />
        <div className="features-float-orb features-float-orb-2" />
        <div className="features-float-orb features-float-orb-3" />
        <div className="features-float-orb features-float-orb-4" />
        <div className="features-float-orb features-float-orb-5" />

        {/* Header */}
        <div className="features-header">
          <div className="features-eyebrow">
            <span className="features-eyebrow-dot" />
            An IIT Ropar Initiative
          </div>
          <h2 className="features-title">
            Redefining knowledge,
            <br />
            through <em className="hero-word-em">innovation<svg className="hero-word-underline" viewBox="0 0 200 14" preserveAspectRatio="none" aria-hidden="true"><path d="M3 9 Q 45 2 95 7 T 197 9" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round" pathLength="100"></path></svg></em>.
          </h2>
          <p className="features-subtitle">
            Everything your team needs to manage knowledge, resolve queries, and scale support — wrapped in a premium, modern interface.
          </p>
        </div>

        {/* Feature grid */}
        <div className="features-grid-container">
          <div className="features-grid" ref={featuresGridRef}>
            {features.map((f, i) => {
              const isOpen = expandedIdx === i;
              const isVisible = visibleIndices.has(i);
              return (
                <div
                  className={`feature-card${isOpen ? ' feature-card--open' : ''}${isVisible ? ' visible' : ''}`}
                  key={i}
                  data-index={i}
                  onClick={() => toggleFeature(i)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && toggleFeature(i)}
                  aria-expanded={isOpen}
                >
                  {/* Corner glow */}
                  <div className="feature-card-glow" />

                  {/* Icon */}
                  <div className="feature-icon">{f.icon}</div>

                  {/* Title + expand chevron */}
                  <div className="feature-title-row">
                    <h3 className="feature-title">{f.title}</h3>
                    <span className={`feature-chevron${isOpen ? ' feature-chevron--up' : ''}`}>
                      ▾
                    </span>
                  </div>

                  {/* Always-visible short desc */}
                  <p className="feature-desc">{f.desc}</p>

                  {/* Expandable detail panel */}
                  <div
                    className="feature-expanded"
                    style={{
                      maxHeight: isOpen ? '200px' : '0px',
                      opacity: isOpen ? 1 : 0,
                    }}
                  >
                    <p className="feature-expanded-text">{f.expanded}</p>
                  </div>

                  {/* Click hint */}
                  <span className="feature-hint">
                    {isOpen ? 'Click to collapse' : 'Click to learn more'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="about-section" ref={aboutRef}>
        <div className="about-glow about-glow-1" />
        <div className="about-glow about-glow-2" />
        <div className="about-grid-overlay" />
        <div className="about-content">
          <div className="about-eyebrow">
            <span className="about-eyebrow-dot" />
            About the Platform
          </div>
          <h2 className="about-title">
            About <span className="italic-display">Vicharanashala</span>
          </h2>
          <p className="about-desc">
            Vicharanashala is a centralized internship query resolver and FAQ platform designed to help students access verified information, stay updated with important announcements, and resolve queries efficiently. By bringing knowledge, support, and communication into one place, the platform simplifies the student experience and enables faster access to reliable answers.
          </p>
          <div className="about-stats-row">
            <div className="about-stat">
              <span className="about-stat-value">24/7</span>
              <span className="about-stat-label">Always Available</span>
            </div>
            <div className="about-stat-divider" />
            <div className="about-stat">
              <span className="about-stat-value">IIT Ropar</span>
              <span className="about-stat-label">Official Portal</span>
            </div>
            <div className="about-stat-divider" />
            <div className="about-stat">
              <span className="about-stat-value">AI-Powered</span>
              <span className="about-stat-label">Smart Matching</span>
            </div>
          </div>
          <div className="about-trust-row">
            <div className="about-trust-item">
              <span className="about-trust-icon">✓</span>
              <span>Verified Information</span>
            </div>
            <div className="about-trust-item">
              <span className="about-trust-icon">✓</span>
              <span>Centralized Knowledge Hub</span>
            </div>
            <div className="about-trust-item">
              <span className="about-trust-icon">✓</span>
              <span>Community Driven</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="stats-section" id="stats">
        <div className="stats-bg" />
        <div className="section-header">
          <h2 className="section-title">Serving the IIT Ropar Community</h2>
        </div>
        <div className="stats-grid">
          {stats.map((s, i) => (
            <div className="stat-card" key={i}>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="faq-section" ref={faqRef}>
        <div className="faq-section-bg" />
        <div className="section-header faq-header">
          <h2 className="section-title">Frequently Asked Questions</h2>
          <p className="section-subtitle">
            Everything you need to know about the Vicharanashala Internship Program.
          </p>
        </div>

        <div className="faq-grid">
          <div className="faq-panel">
            {faqs.map((faq, i) => {
              const isOpen = faqExpandedIdx === i;
              const answerId = `faq-answer-${i}`;
              const buttonId = `faq-button-${i}`;
              return (
                <article
                  className={`faq-item${isOpen ? ' faq-item--active' : ''}`}
                  key={faq.question}
                >
                  <button
                    id={buttonId}
                    className="faq-item-toggle"
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={answerId}
                    onClick={() => toggleFaq(i)}
                  >
                    <span className="faq-item-question">{faq.question}</span>
                    <span className={`faq-chevron${isOpen ? ' faq-chevron--open' : ''}`}>
                      ▾
                    </span>
                  </button>
                  <div
                    id={answerId}
                    className="faq-answer-wrapper"
                    aria-hidden={!isOpen}
                    style={{
                      maxHeight: isOpen ? '320px' : '0px',
                      opacity: isOpen ? 1 : 0,
                      paddingTop: isOpen ? '16px' : '0px',
                    }}
                  >
                    <p className="faq-item-answer">{faq.answer}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="cta-card">
          <h2 className="cta-title">Ready to get started?</h2>
          <p className="cta-subtitle">Join thousands of teams using FAQ System today.</p>
          <Link to="/login" className="btn-cta">
            Create Free Account
            <span>→</span>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}