import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { NavbarProps } from './Navbar.types';
import { NAV_ITEMS } from './Navbar.data';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';
import { Tractor, Menu, X, PlusCircle, LogIn, UserPlus } from 'lucide-react';

/**
 * Production-ready, fully accessible, and responsive Navbar component.
 * Features sticky navigation, mobile slide-out drawer, active link highlighting,
 * and integration with existing Button components for auth actions.
 */
export const Navbar = ({
  onLoginClick,
  onRegisterClick,
  onBecomeOwnerClick,
  className,
}: NavbarProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Handle ESC key press to close mobile menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  const isActivePath = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs transition-all duration-200',
        className
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Brand Name */}
          <Link
            to="/"
            className="flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 rounded-lg group"
            aria-label="AgriRent Home"
          >
            <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20 group-hover:bg-emerald-500 transition-colors">
              <Tractor className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-tight">
                Agri<span className="text-emerald-600">Rent</span>
              </span>
              <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-widest leading-none">
                Farm Machinery
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav
            className="hidden lg:flex items-center gap-1 xl:gap-2"
            aria-label="Main Navigation"
          >
            {NAV_ITEMS.map((item) => {
              const active = isActivePath(item.path);

              if (item.isHighlight) {
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={onBecomeOwnerClick}
                    className="ml-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 text-sm font-semibold transition-all shadow-2xs"
                  >
                    <PlusCircle className="w-4 h-4 text-emerald-600" />
                    <span>{item.label}</span>
                  </Link>
                );
              }

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors relative',
                    active
                      ? 'text-emerald-700 font-bold bg-emerald-50/70'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
                  )}
                >
                  {item.label}
                  {active && (
                    <span
                      className="absolute bottom-0 inset-x-3 h-0.5 bg-emerald-600 rounded-full"
                      aria-hidden="true"
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Action Buttons (Login / Register) */}
          <div className="hidden lg:flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onLoginClick}
              leftIcon={<LogIn className="w-4 h-4 text-slate-500" />}
              className="text-slate-700 font-semibold hover:bg-slate-100"
            >
              Login
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={onRegisterClick}
              leftIcon={<UserPlus className="w-4 h-4" />}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-xs"
            >
              Register
            </Button>
          </div>

          {/* Mobile Hamburger Toggle Button */}
          <button
            type="button"
            onClick={toggleMobileMenu}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-navigation-drawer"
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Overlay & Content */}
      {isMobileMenuOpen && (
        <div className="lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 animate-fade-in"
            onClick={toggleMobileMenu}
            aria-hidden="true"
          />

          {/* Slide-out Drawer Panel */}
          <div
            id="mobile-navigation-drawer"
            className="fixed inset-y-0 right-0 z-50 w-full max-w-xs bg-white shadow-2xl p-6 flex flex-col justify-between overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile Navigation"
          >
            {/* Drawer Header */}
            <div>
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                <Link
                  to="/"
                  className="flex items-center gap-2.5"
                  onClick={toggleMobileMenu}
                >
                  <div className="p-1.5 rounded-lg bg-emerald-600 text-white">
                    <Tractor className="w-5 h-5" />
                  </div>
                  <span className="text-lg font-black text-slate-900">
                    Agri<span className="text-emerald-600">Rent</span>
                  </span>
                </Link>

                <button
                  type="button"
                  onClick={toggleMobileMenu}
                  className="p-2 rounded-lg text-slate-500 hover:bg-slate-100"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Navigation Links */}
              <nav className="flex flex-col gap-1" aria-label="Mobile Navigation Links">
                {NAV_ITEMS.map((item) => {
                  const active = isActivePath(item.path);

                  if (item.isHighlight) {
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => {
                          toggleMobileMenu();
                          if (onBecomeOwnerClick) onBecomeOwnerClick();
                        }}
                        className="mt-3 flex items-center justify-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold text-center"
                      >
                        <PlusCircle className="w-4 h-4 text-emerald-600" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  }

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={toggleMobileMenu}
                      className={cn(
                        'px-4 py-3 rounded-xl text-base font-semibold transition-colors',
                        active
                          ? 'bg-emerald-50 text-emerald-700 font-bold'
                          : 'text-slate-700 hover:bg-slate-100'
                      )}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Mobile Footer Auth Buttons */}
            <div className="pt-6 border-t border-slate-100 space-y-3">
              <Button
                variant="outline"
                size="md"
                fullWidth
                onClick={() => {
                  toggleMobileMenu();
                  if (onLoginClick) onLoginClick();
                }}
                leftIcon={<LogIn className="w-4 h-4" />}
                className="font-semibold text-slate-700 border-slate-300"
              >
                Login
              </Button>

              <Button
                variant="primary"
                size="md"
                fullWidth
                onClick={() => {
                  toggleMobileMenu();
                  if (onRegisterClick) onRegisterClick();
                }}
                leftIcon={<UserPlus className="w-4 h-4" />}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
              >
                Register
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
