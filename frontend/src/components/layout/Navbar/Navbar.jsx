import React, { useState } from 'react';
import logo from '../../../assets/images/agro-rent-logo.png';

/**
 * Navbar component for the Farm Equipment Rental Platform.
 * Built using React, JavaScript, and Tailwind CSS.
 */
const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeLink, setActiveLink] = useState('Home');

  const navItems = [
    { label: 'Home', href: '#' },
    { label: 'Equipment', href: '#equipment' },
    { label: 'About', href: '#about' },
    { label: 'Contact', href: '#contact' },
  ];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-xs">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Main Navigation">
        <div className="flex items-center justify-between h-16">
          
          {/* 1. Left side: Farm Equipment Rental Logo & Name */}
          <div className="flex items-center">
            <a href="#" className="flex items-center space-x-3 group">
              <img
                src={logo}
                alt="AgroRent"
                className="w-10 h-10 object-contain"
              />
              <div className="flex flex-col">
                <span className="text-lg font-bold text-slate-900 tracking-tight leading-tight group-hover:text-emerald-700 transition-colors">
                  Agri<span className="text-emerald-600">Rent</span>
                </span>
                <span className="text-xs font-medium text-slate-500 tracking-wider uppercase">
                  Farm Equipment Rental
                </span>
              </div>
            </a>
          </div>

          {/* 2. Navigation links (Desktop) */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navItems.map((item) => {
              const isActive = activeLink === item.label;
              return (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={() => setActiveLink(item.label)}
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'text-emerald-700 bg-emerald-50 font-semibold'
                      : 'text-slate-600 hover:text-emerald-700 hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                </a>
              );
            })}
          </div>

          {/* 3. Right side: Login & Register Buttons (Desktop) */}
          <div className="hidden md:flex items-center space-x-3">
            <a
              href="#login"
              className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-emerald-700 border border-slate-300 hover:border-emerald-600 rounded-lg transition-all duration-200 hover:bg-emerald-50/50"
            >
              Login
            </a>
            <a
              href="#register"
              className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs hover:shadow-sm transition-all duration-200"
            >
              Register
            </a>
          </div>

          {/* Mobile Hamburger Menu Button */}
          <div className="flex md:hidden items-center">
            <button
              type="button"
              onClick={toggleMobileMenu}
              className="p-2 rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
              aria-expanded={isMobileMenuOpen}
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>

        </div>
      </nav>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-4 space-y-3 shadow-lg">
          <div className="flex flex-col space-y-1">
            {navItems.map((item) => {
              const isActive = activeLink === item.label;
              return (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={() => {
                    setActiveLink(item.label);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    isActive
                      ? 'text-emerald-700 bg-emerald-50 font-semibold'
                      : 'text-slate-600 hover:text-emerald-700 hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                </a>
              );
            })}
          </div>
          <div className="pt-3 border-t border-slate-200 flex flex-col space-y-2">
            <a
              href="#login"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full text-center px-4 py-2.5 text-sm font-semibold text-slate-700 border border-slate-300 hover:border-emerald-600 hover:text-emerald-700 rounded-lg transition-colors"
            >
              Login
            </a>
            <a
              href="#register"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full text-center px-4 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
            >
              Register
            </a>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
