import React, { useState, useEffect } from 'react';
import './Navbar.css';

/**
 * Navbar Component for Farm Equipment Rental Web Application
 * 
 * Features:
 * - Responsive glassmorphism header (Sticky)
 * - Brand Logo with SVG tractor sprout motif
 * - Active link tracking & visual indicators
 * - Accessible mobile hamburger menu drawer
 * - Smooth CSS transitions and accessibility support (ARIA attributes, keyboard navigation)
 */
const Navbar = ({ activeLink: propActiveLink = 'Home', onNavigate }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeLink, setActiveLink] = useState(propActiveLink);

  const navItems = [
    { id: 'home', label: 'Home', href: '#home' },
    { id: 'equipment', label: 'Equipment', href: '#equipment' },
    { id: 'about', label: 'About', href: '#about' },
    { id: 'contact', label: 'Contact', href: '#contact' },
  ];

  // Handle scroll detection for dynamic glassmorphism effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMenuOpen]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
  };

  const handleNavClick = (e, item) => {
    setActiveLink(item.label);
    setIsMenuOpen(false);

    if (onNavigate) {
      onNavigate(item);
    }
  };

  return (
    <header className={`navbar-header ${isScrolled ? 'navbar-scrolled' : ''}`}>
      <nav className="navbar-container" aria-label="Main Navigation">
        {/* Brand Logo */}
        <a href="#home" className="navbar-logo" aria-label="AgriRent Home">
          <div className="logo-icon-wrapper" aria-hidden="true">
            <svg
              className="logo-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Tractor & Sprout Motif */}
              <path d="M3 17h18" />
              <path d="M5 17a3 3 0 1 0 6 0 3 3 0 1 0-6 0" />
              <path d="M15 17a4 4 0 1 0 8 0 4 4 0 1 0-8 0" />
              <path d="M7 11V7a2 2 0 0 1 2-2h4l3 3v3H7z" />
              <path d="M12 5V3a2 2 0 0 1 2-2" />
            </svg>
          </div>
          <div className="logo-text-wrapper">
            <span className="logo-title">
              Agri<span className="logo-accent">Rent</span>
            </span>
            <span className="logo-subtitle">Farm Equipment</span>
          </div>
        </a>

        {/* Desktop Navigation Links */}
        <ul className="navbar-links-desktop" role="menubar">
          {navItems.map((item) => {
            const isActive = activeLink.toLowerCase() === item.label.toLowerCase();
            return (
              <li key={item.id} role="none">
                <a
                  href={item.href}
                  className={`nav-link ${isActive ? 'nav-link-active' : ''}`}
                  role="menuitem"
                  aria-current={isActive ? 'page' : undefined}
                  onClick={(e) => handleNavClick(e, item)}
                >
                  {item.label}
                  {isActive && <span className="active-indicator" aria-hidden="true" />}
                </a>
              </li>
            );
          })}
        </ul>

        {/* Desktop Action Buttons */}
        <div className="navbar-actions-desktop">
          <a
            href="#login"
            className="btn btn-secondary"
            onClick={(e) => {
              e.preventDefault();
              if (onNavigate) onNavigate({ id: 'login', label: 'Login' });
            }}
          >
            Log In
          </a>
          <a
            href="#register"
            className="btn btn-primary"
            onClick={(e) => {
              e.preventDefault();
              if (onNavigate) onNavigate({ id: 'register', label: 'Register' });
            }}
          >
            Register
          </a>
        </div>

        {/* Mobile Hamburger Menu Toggle */}
        <button
          type="button"
          className={`hamburger-btn ${isMenuOpen ? 'is-active' : ''}`}
          onClick={toggleMenu}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-nav-menu"
          aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
        >
          <span className="hamburger-line" />
          <span className="hamburger-line" />
          <span className="hamburger-line" />
        </button>
      </nav>

      {/* Mobile Backdrop Overlay */}
      {isMenuOpen && (
        <div
          className="mobile-backdrop"
          onClick={() => setIsMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer Menu */}
      <div
        id="mobile-nav-menu"
        className={`mobile-menu-drawer ${isMenuOpen ? 'drawer-open' : ''}`}
        aria-hidden={!isMenuOpen}
      >
        <div className="mobile-menu-content">
          <ul className="mobile-nav-links">
            {navItems.map((item) => {
              const isActive = activeLink.toLowerCase() === item.label.toLowerCase();
              return (
                <li key={item.id}>
                  <a
                    href={item.href}
                    className={`mobile-nav-link ${isActive ? 'mobile-link-active' : ''}`}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={(e) => handleNavClick(e, item)}
                  >
                    <span>{item.label}</span>
                    <svg
                      className="link-arrow"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </a>
                </li>
              );
            })}
          </ul>

          <div className="mobile-menu-actions">
            <a
              href="#login"
              className="btn btn-secondary btn-full"
              onClick={() => setIsMenuOpen(false)}
            >
              Log In
            </a>
            <a
              href="#register"
              className="btn btn-primary btn-full"
              onClick={() => setIsMenuOpen(false)}
            >
              Register Account
            </a>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
