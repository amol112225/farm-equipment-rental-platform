import React, { useState } from 'react';
import logo from '../../assets/images/agro-rent-logo.png';
import { useAuth } from '../../context/AuthContext';
import AuthModal from '../../features/auth/components/AuthModal';

/**
 * Navbar component for the Farm Equipment Rental Platform.
 * Integrated with AuthContext, AuthModal, Equipment Management, and My Bookings modal triggers.
 */
const Navbar = ({ onOpenMyBookings, onOpenOwnerDashboard, onNavigateToHome, currentPage = 'home' }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');

  const { currentFarmer, isAuthenticated, logout } = useAuth();

  const openAuth = (mode = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleOpenBookings = () => {
    setIsMobileMenuOpen(false);
    if (isAuthenticated) {
      if (onOpenMyBookings) onOpenMyBookings();
    } else {
      openAuth('login');
    }
  };

  const handleOpenOwnerDashboard = () => {
    setIsMobileMenuOpen(false);
    if (isAuthenticated) {
      if (onOpenOwnerDashboard) onOpenOwnerDashboard();
    } else {
      openAuth('login');
    }
  };

  const handleLogoClick = (e) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    if (onNavigateToHome) {
      onNavigateToHome();
    } else {
      window.location.hash = 'home';
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-xs">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Main Navigation">
          <div className="flex items-center justify-between h-16">

            {/* 1. Left side: AgroRent Logo & Name */}
            <div className="flex items-center">
              <a
                href="#home"
                onClick={handleLogoClick}
                className="flex items-center space-x-3 group"
              >
                <img
                  src={logo}
                  alt="AgroRent Logo"
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

            {/* 2. Middle: My Bookings & Owner Dashboard Links */}
            <div className="hidden md:flex items-center space-x-3">
              <button
                type="button"
                onClick={handleOpenBookings}
                className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${currentPage === 'my-bookings'
                    ? 'text-emerald-700 bg-emerald-50 font-bold border border-emerald-200'
                    : 'text-slate-700 hover:text-emerald-700 hover:bg-emerald-50/60'
                  }`}
              >
                Rental Dashboard
              </button>
              <button
                type="button"
                onClick={handleOpenOwnerDashboard}
                className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${currentPage === 'owner-dashboard'
                    ? 'text-emerald-700 bg-emerald-50 font-bold border border-emerald-200'
                    : 'text-slate-700 hover:text-emerald-700 hover:bg-emerald-50/60'
                  }`}
              >
                Owner Dashboard
              </button>
            </div>

            {/* 3. Right side: Login / Register & Farmer Profile Actions */}
            <div className="hidden md:flex items-center space-x-3">
              {isAuthenticated && currentFarmer ? (
                <div className="flex items-center space-x-3">
                  <div className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>{currentFarmer.fullName}</span>
                  </div>

                  <button
                    type="button"
                    onClick={logout}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-red-700 border border-slate-300 hover:border-red-400 rounded-lg transition-colors"
                  >
                    Log Out
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => openAuth('login')}
                    className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-emerald-700 border border-slate-300 hover:border-emerald-600 rounded-lg transition-all duration-200 hover:bg-emerald-50/50"
                  >
                    Log In
                  </button>
                  <button
                    type="button"
                    onClick={() => openAuth('register')}
                    className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs hover:shadow-sm transition-all duration-200"
                  >
                    Register
                  </button>
                </div>
              )}
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
            <div className="flex flex-col space-y-2">
              <button
                type="button"
                onClick={handleOpenBookings}
                className={`w-full text-left px-3 py-2 text-base font-semibold rounded-lg ${currentPage === 'my-bookings'
                    ? 'text-emerald-700 bg-emerald-50 font-bold'
                    : 'text-slate-800 hover:bg-emerald-50'
                  }`}
              >
                My Bookings
              </button>
              <button
                type="button"
                onClick={handleOpenOwnerDashboard}
                className={`w-full text-left px-3 py-2 text-base font-semibold rounded-lg ${currentPage === 'owner-dashboard'
                    ? 'text-emerald-700 bg-emerald-50 font-bold'
                    : 'text-slate-800 hover:bg-emerald-50'
                  }`}
              >
                Owner Dashboard
              </button>

            </div>

            <div className="pt-3 border-t border-slate-200 flex flex-col space-y-2">
              {isAuthenticated && currentFarmer ? (
                <div className="flex flex-col space-y-2">
                  <div className="px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg">
                    Logged in as: <strong>{currentFarmer.fullName}</strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full text-center px-4 py-2 text-sm font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
                  >
                    Log Out
                  </button>
                </div>
              ) : (
                <div className="flex flex-col space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      openAuth('login');
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full text-center px-4 py-2.5 text-sm font-semibold text-slate-700 border border-slate-300 hover:border-emerald-600 hover:text-emerald-700 rounded-lg transition-colors"
                  >
                    Log In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      openAuth('register');
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full text-center px-4 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
                  >
                    Register
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Auth Modal Overlay */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
      />
    </>
  );
};

export default Navbar;
