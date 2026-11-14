import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ChefHat, BarChart3, ClipboardList, Users, Settings, Shield, Zap, Clock,
  TrendingUp, Star, ChevronDown, Menu, X, Mail, Phone, MapPin,
  Facebook, Twitter, Instagram, Linkedin, Check, ArrowRight, Utensils,
  CreditCard, PieChart, CalendarDays, Layers, Globe
} from 'lucide-react';
import api from '../services/api.js';
import '../styles/landing.css';

const FEATURES = [
  { icon: <ClipboardList size={24} />, title: 'Order Management', desc: 'Track orders from placement to completion with real-time status updates and table assignments.' },
  { icon: <Utensils size={24} />, title: 'Menu Control', desc: 'Create and manage your complete menu with categories, pricing, availability, and dietary indicators.' },
  { icon: <BarChart3 size={24} />, title: 'Smart Analytics', desc: 'Gain actionable insights with revenue charts, best-sellers, and comprehensive sales reports.' },
  { icon: <Users size={24} />, title: 'Staff Management', desc: 'Manage your team with role assignments, contact details, and performance tracking.' },
  { icon: <CreditCard size={24} />, title: 'Billing & Invoices', desc: 'Generate professional invoices, track payments, and support multiple payment methods.' },
  { icon: <Shield size={24} />, title: 'Secure & Reliable', desc: 'Enterprise-grade security with encrypted data, role-based access, and secure authentication.' },
];

const WORKFLOW = [
  { num: '1', title: 'Set Up Your Restaurant', desc: 'Add menu items, configure tables, and customize settings' },
  { num: '2', title: 'Take & Manage Orders', desc: 'Create orders, assign tables, and track preparation status' },
  { num: '3', title: 'Process Payments', desc: 'Generate invoices and record payments by cash, card, or UPI' },
  { num: '4', title: 'Analyze & Grow', desc: 'Review reports, track trends, and optimize your operations' },
];

const TESTIMONIALS = [
  { name: 'Ananya S.', role: 'Restaurant Owner', initials: 'AS', text: 'DineFlow transformed how we manage our restaurant. The order tracking and analytics are incredibly useful for daily operations.' },
  { name: 'Raj M.', role: 'Café Manager', initials: 'RM', text: 'The billing system is seamless. We can generate invoices in seconds and our staff picked it up with minimal training.' },
  { name: 'Priya K.', role: 'Operations Head', initials: 'PK', text: 'Having all our data in one dashboard — from menu management to sales reports — has saved us hours every week.' },
];

const PRICING = [
  { name: 'Starter', price: 'Free', period: '', features: ['1 Restaurant', 'Up to 50 Menu Items', 'Basic Analytics', 'Order Management', 'Email Support'], featured: false },
  { name: 'Professional', price: '₹2,999', period: '/month', features: ['3 Restaurants', 'Unlimited Menu Items', 'Advanced Analytics', 'Staff Management', 'Priority Support', 'CSV Exports'], featured: true },
  { name: 'Enterprise', price: '₹7,999', period: '/month', features: ['Unlimited Restaurants', 'Unlimited Everything', 'Custom Reports', 'API Access', 'Dedicated Manager', 'White-label Option'], featured: false },
];

const FAQS = [
  { q: 'How do I get started with DineFlow?', a: 'Simply sign up for a free account, enter your restaurant details, and start adding your menu items and tables. The setup takes less than 10 minutes.' },
  { q: 'Can I manage multiple restaurant branches?', a: 'Yes! Our Professional and Enterprise plans support multiple restaurants under a single account with centralized management.' },
  { q: 'Is my data secure?', a: 'Absolutely. We use industry-standard encryption, secure authentication with HttpOnly cookies, and your data is stored in PostgreSQL with proper access controls.' },
  { q: 'Can I export my reports?', a: 'Yes, you can export orders and payment reports to CSV format. Printable invoice views are also available for your billing needs.' },
  { q: 'What payment methods does the billing system support?', a: 'DineFlow supports recording payments via cash, card, and UPI. Note that actual payment processing requires a separate payment gateway integration.' },
];

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [contactStatus, setContactStatus] = useState('');
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState('');

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleContact = async (e) => {
    e.preventDefault();
    setContactStatus('sending');
    try {
      await api.post('/contact', contactForm);
      setContactStatus('success');
      setContactForm({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => setContactStatus(''), 4000);
    } catch {
      setContactStatus('error');
    }
  };

  const handleNewsletter = async (e) => {
    e.preventDefault();
    try {
      await api.post('/newsletter', { email: newsletterEmail });
      setNewsletterStatus('success');
      setNewsletterEmail('');
      setTimeout(() => setNewsletterStatus(''), 4000);
    } catch {
      setNewsletterStatus('error');
    }
  };

  return (
    <div className="landing-page">
      {/* Navbar */}
      <nav className={`landing-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-container">
          <Link to="/" className="nav-logo">
            <div className="nav-logo-icon"><Utensils size={20} /></div>
            DineFlow
          </Link>

          <div className="nav-links">
            <a href="#features" onClick={(e) => { e.preventDefault(); scrollToSection('features'); }}>Features</a>
            <a href="#menu-preview" onClick={(e) => { e.preventDefault(); scrollToSection('menu-preview'); }}>Menu</a>
            <a href="#about" onClick={(e) => { e.preventDefault(); scrollToSection('about'); }}>About Us</a>
            <a href="#pricing" onClick={(e) => { e.preventDefault(); scrollToSection('pricing'); }}>Pricing</a>
            <a href="#contact" onClick={(e) => { e.preventDefault(); scrollToSection('contact'); }}>Contact</a>
          </div>

          <div className="nav-buttons">
            <Link to="/login" className="nav-btn-login">Login</Link>
            <Link to="/signup" className="nav-btn-start">Get Started</Link>
          </div>

          <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(true)} aria-label="Open menu">
            <Menu size={24} />
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
        <button className="mobile-menu-close" onClick={() => setMobileMenuOpen(false)} aria-label="Close menu">
          <X size={24} />
        </button>
        <a href="#features" onClick={(e) => { e.preventDefault(); scrollToSection('features'); }}>Features</a>
        <a href="#menu-preview" onClick={(e) => { e.preventDefault(); scrollToSection('menu-preview'); }}>Menu</a>
        <a href="#about" onClick={(e) => { e.preventDefault(); scrollToSection('about'); }}>About Us</a>
        <a href="#pricing" onClick={(e) => { e.preventDefault(); scrollToSection('pricing'); }}>Pricing</a>
        <a href="#contact" onClick={(e) => { e.preventDefault(); scrollToSection('contact'); }}>Contact</a>
        <div className="mobile-menu-buttons">
          <Link to="/login" className="btn btn-outline" style={{ borderColor: 'rgba(255,255,255,0.3)', color: 'white' }}>Login</Link>
          <Link to="/signup" className="btn btn-primary">Get Started</Link>
        </div>
      </div>

      {/* Hero */}
      <section className="hero">
        <div className="hero-bg-pattern"></div>
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-badge"><Zap size={14} /> #1 Restaurant Management Platform</div>
            <h1 className="hero-title">Manage Your Restaurant.<br /><span>Serve Excellence.</span></h1>
            <p className="hero-subtitle">
              Streamline operations, track orders in real-time, manage your menu effortlessly,
              and grow your business with powerful analytics — all from one intuitive dashboard.
            </p>
            <div className="hero-cta">
              <Link to="/signup" className="btn btn-primary">
                Get Started Free <ArrowRight size={18} />
              </Link>
              <a href="#features" className="btn btn-outline" onClick={(e) => { e.preventDefault(); scrollToSection('features'); }}>
                Explore Features
              </a>
            </div>
            <div className="hero-stats">
              <div><div className="hero-stat-number">500+</div><div className="hero-stat-label">Restaurants</div></div>
              <div><div className="hero-stat-number">50K+</div><div className="hero-stat-label">Orders/Month</div></div>
              <div><div className="hero-stat-number">99.9%</div><div className="hero-stat-label">Uptime</div></div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-image-wrapper">
              <img src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=460&fit=crop" alt="Modern restaurant interior" loading="eager" />
            </div>
            <div className="hero-float-card card-1">
              <div className="card-label">Today's Revenue</div>
              <div className="card-value accent">₹24,500</div>
            </div>
            <div className="hero-float-card card-2">
              <div className="card-label">Orders Completed</div>
              <div className="card-value success">127</div>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted Introduction */}
      <section className="section section-gray" id="about">
        <div className="container">
          <div className="section-header">
            <div className="section-badge"><Globe size={14} /> Trusted by Restaurants</div>
            <h2 className="section-title">Restaurant Management, Simplified</h2>
            <p className="section-subtitle">
              DineFlow provides a complete suite of tools designed specifically for modern restaurant operations.
              From small cafés to multi-branch chains, we help you focus on what matters — great food and service.
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section" id="features">
        <div className="container">
          <div className="section-header">
            <div className="section-badge"><Layers size={14} /> Core Features</div>
            <h2 className="section-title">Everything You Need to Run Your Restaurant</h2>
            <p className="section-subtitle">Powerful tools built for restaurant professionals, designed for simplicity.</p>
          </div>
          <div className="features-grid">
            {FEATURES.map((f, i) => (
              <div className="feature-card" key={i}>
                <div className="feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section className="section section-gray" id="workflow">
        <div className="container">
          <div className="section-header">
            <div className="section-badge"><CalendarDays size={14} /> How It Works</div>
            <h2 className="section-title">Get Up and Running in Minutes</h2>
            <p className="section-subtitle">A simple four-step process to digitize your restaurant operations.</p>
          </div>
          <div className="workflow-steps">
            {WORKFLOW.map((w, i) => (
              <div className="workflow-step" key={i}>
                <div className="workflow-number">{w.num}</div>
                <h3>{w.title}</h3>
                <p>{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="section" id="menu-preview">
        <div className="container">
          <div className="section-header">
            <div className="section-badge"><PieChart size={14} /> Dashboard Preview</div>
            <h2 className="section-title">Your Command Center</h2>
            <p className="section-subtitle">A beautiful, data-rich dashboard that gives you complete visibility into your restaurant.</p>
          </div>
          <div className="preview-mockup">
            <div className="preview-topbar">
              <div className="preview-dot"></div>
              <div className="preview-dot"></div>
              <div className="preview-dot"></div>
            </div>
            <div className="preview-content">
              <div className="preview-stat-card">
                <div className="stat-label">Total Orders</div>
                <div className="stat-value">1,248</div>
              </div>
              <div className="preview-stat-card">
                <div className="stat-label">Today's Revenue</div>
                <div className="stat-value" style={{ color: 'var(--color-accent)' }}>₹24,500</div>
              </div>
              <div className="preview-stat-card">
                <div className="stat-label">Active Tables</div>
                <div className="stat-value">8/12</div>
              </div>
              <div className="preview-stat-card">
                <div className="stat-label">Pending Orders</div>
                <div className="stat-value" style={{ color: 'var(--color-warning)' }}>5</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose DineFlow */}
      <section className="section section-gray">
        <div className="container">
          <div className="section-header">
            <div className="section-badge"><TrendingUp size={14} /> Why DineFlow</div>
            <h2 className="section-title">Built for Restaurant Success</h2>
          </div>
          <div className="why-grid">
            <div className="why-list">
              {[
                { icon: <Zap size={20} />, title: 'Lightning Fast', desc: 'Optimized for speed — take orders and generate bills in seconds, even during rush hours.' },
                { icon: <Shield size={20} />, title: 'Secure by Design', desc: 'Your data is encrypted and protected with enterprise-grade security practices.' },
                { icon: <Clock size={20} />, title: 'Real-time Updates', desc: 'See order status changes, revenue updates, and table availability instantly.' },
                { icon: <BarChart3 size={20} />, title: 'Data-Driven Insights', desc: 'Make informed decisions with comprehensive analytics and exportable reports.' },
              ].map((item, i) => (
                <div className="why-item" key={i}>
                  <div className="why-item-icon">{item.icon}</div>
                  <div>
                    <h4>{item.title}</h4>
                    <p>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="why-image-grid">
              <img src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=500&h=250&fit=crop" alt="Gourmet dish presentation" loading="lazy" />
              <img src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=250&h=200&fit=crop" alt="Restaurant ambiance" loading="lazy" />
              <img src="https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=250&h=200&fit=crop" alt="Chef preparing food" loading="lazy" />
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="section section-dark" id="testimonials">
        <div className="container">
          <div className="section-header">
            <div className="section-badge" style={{ background: 'rgba(255,107,53,0.2)' }}><Star size={14} /> Testimonials</div>
            <h2 className="section-title">What Our Users Say</h2>
            <p className="section-subtitle">Hear from restaurant owners and managers who use DineFlow.</p>
          </div>
          <div className="testimonials-grid">
            {TESTIMONIALS.map((t, i) => (
              <div className="testimonial-card" key={i}>
                <div className="testimonial-stars">{[...Array(5)].map((_, j) => <Star key={j} size={16} fill="#fbbf24" />)}</div>
                <p className="testimonial-text">"{t.text}"</p>
                <div className="testimonial-author">
                  <div className="testimonial-avatar">{t.initials}</div>
                  <div>
                    <div className="testimonial-name">{t.name}</div>
                    <div className="testimonial-role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="testimonial-note">* These testimonials are sample/demo content for illustrative purposes.</p>
        </div>
      </section>

      {/* Pricing */}
      <section className="section" id="pricing">
        <div className="container">
          <div className="section-header">
            <div className="section-badge"><CreditCard size={14} /> Pricing Plans</div>
            <h2 className="section-title">Simple, Transparent Pricing</h2>
            <p className="section-subtitle">Choose the plan that fits your restaurant's needs. Start free, upgrade anytime.</p>
          </div>
          <div className="pricing-grid">
            {PRICING.map((p, i) => (
              <div className={`pricing-card ${p.featured ? 'featured' : ''}`} key={i}>
                {p.featured && <div className="pricing-badge">Most Popular</div>}
                <h3>{p.name}</h3>
                <div className="pricing-price">{p.price}<span>{p.period}</span></div>
                <ul className="pricing-features">
                  {p.features.map((f, j) => (
                    <li key={j}><Check size={16} /> {f}</li>
                  ))}
                </ul>
                <Link to="/signup" className={`btn ${p.featured ? 'btn-primary' : 'btn-outline'}`} style={{ width: '100%' }}>
                  {p.price === 'Free' ? 'Start Free' : 'Get Started'}
                </Link>
              </div>
            ))}
          </div>
          <p className="pricing-note">* These are sample pricing plans for demonstration purposes only.</p>
        </div>
      </section>

      {/* FAQ */}
      <section className="section section-gray" id="faq">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Frequently Asked Questions</h2>
            <p className="section-subtitle">Find answers to common questions about DineFlow.</p>
          </div>
          <div className="faq-list">
            {FAQS.map((faq, i) => (
              <div className="faq-item" key={i}>
                <button className={`faq-question ${openFaq === i ? 'open' : ''}`} onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  {faq.q} <ChevronDown size={20} />
                </button>
                <div className={`faq-answer ${openFaq === i ? 'open' : ''}`}>
                  <p>{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="section" id="contact">
        <div className="container">
          <div className="contact-grid">
            <div className="contact-info">
              <h3>Get in Touch</h3>
              <p>Have questions about DineFlow? We'd love to hear from you. Send us a message and we'll respond as soon as possible.</p>
              <div className="contact-details">
                <div className="contact-detail-item">
                  <div className="contact-detail-icon"><Mail size={18} /></div>
                  <span>hello@dineflow.com</span>
                </div>
                <div className="contact-detail-item">
                  <div className="contact-detail-icon"><Phone size={18} /></div>
                  <span>+91-80-1234-5678</span>
                </div>
                <div className="contact-detail-item">
                  <div className="contact-detail-icon"><MapPin size={18} /></div>
                  <span>Koramangala, Bangalore, India</span>
                </div>
              </div>
            </div>
            <div className="contact-form-card">
              <form onSubmit={handleContact}>
                <div className="form-group">
                  <label className="form-label">Name</label>
                  <input className="form-input" type="text" placeholder="Your name" value={contactForm.name}
                    onChange={e => setContactForm(f => ({ ...f, name: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-input" type="email" placeholder="your@email.com" value={contactForm.email}
                    onChange={e => setContactForm(f => ({ ...f, email: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Subject</label>
                  <input className="form-input" type="text" placeholder="How can we help?" value={contactForm.subject}
                    onChange={e => setContactForm(f => ({ ...f, subject: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Message</label>
                  <textarea className="form-input" placeholder="Your message..." rows="4" value={contactForm.message}
                    onChange={e => setContactForm(f => ({ ...f, message: e.target.value }))} required></textarea>
                </div>
                {contactStatus === 'success' && <div className="alert alert-success">Message sent successfully!</div>}
                {contactStatus === 'error' && <div className="alert alert-error">Failed to send. Please try again.</div>}
                <button className="btn btn-primary btn-lg" type="submit" style={{ width: '100%' }}
                  disabled={contactStatus === 'sending'}>
                  {contactStatus === 'sending' ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="newsletter-section">
        <div className="container">
          <div className="newsletter-content">
            <h3>Stay Updated</h3>
            <p>Get the latest updates, tips, and resources for restaurant management delivered to your inbox.</p>
            <form className="newsletter-form" onSubmit={handleNewsletter}>
              <input type="email" placeholder="Enter your email" value={newsletterEmail}
                onChange={e => setNewsletterEmail(e.target.value)} required />
              <button type="submit">Subscribe</button>
            </form>
            {newsletterStatus === 'success' && <p style={{ marginTop: '1rem', color: 'white', fontWeight: 600 }}>✓ Subscribed successfully!</p>}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="nav-logo" style={{ color: 'white', fontSize: '1.25rem' }}>
                <div className="nav-logo-icon"><Utensils size={18} /></div>
                DineFlow
              </div>
              <p>Complete restaurant management solution. Simplify operations, delight customers, and grow your business.</p>
              <div className="footer-social">
                <a href="#" aria-label="Facebook"><Facebook size={16} /></a>
                <a href="#" aria-label="Twitter"><Twitter size={16} /></a>
                <a href="#" aria-label="Instagram"><Instagram size={16} /></a>
                <a href="#" aria-label="LinkedIn"><Linkedin size={16} /></a>
              </div>
            </div>
            <div className="footer-column">
              <h4>Product</h4>
              <a href="#features" onClick={(e) => { e.preventDefault(); scrollToSection('features'); }}>Features</a>
              <a href="#pricing" onClick={(e) => { e.preventDefault(); scrollToSection('pricing'); }}>Pricing</a>
              <a href="#faq" onClick={(e) => { e.preventDefault(); scrollToSection('faq'); }}>FAQ</a>
            </div>
            <div className="footer-column">
              <h4>Company</h4>
              <a href="#about" onClick={(e) => { e.preventDefault(); scrollToSection('about'); }}>About Us</a>
              <a href="#contact" onClick={(e) => { e.preventDefault(); scrollToSection('contact'); }}>Contact</a>
              <a href="#">Careers</a>
            </div>
            <div className="footer-column">
              <h4>Account</h4>
              <Link to="/login">Login</Link>
              <Link to="/signup">Sign Up</Link>
              <Link to="/forgot-password">Reset Password</Link>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© 2026 DineFlow. All rights reserved.</span>
            <span>Built with ♥ for restaurants</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
