import { Link } from 'react-router-dom';
import type { FooterProps } from './Footer.types';
import {
  QUICK_LINKS,
  CATEGORY_LINKS,
  LEGAL_LINKS,
  SOCIAL_LINKS,
} from './Footer.data';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/utils/cn';
import { Tractor, Phone, Mail, MapPin, Send, ShieldCheck } from 'lucide-react';

/**
 * Production-ready, responsive Footer component.
 * Features brand overview, quick links, equipment categories, contact channels,
 * social media links, newsletter subscribe box, and legal copyright bar.
 */
export const Footer = ({ className }: FooterProps) => {
  return (
    <footer
      className={cn(
        'bg-slate-950 text-slate-300 border-t border-slate-800/80 pt-16 pb-8',
        className
      )}
      aria-label="Site Footer"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 pb-12 border-b border-slate-800/80">
          {/* Column 1: Brand & Description (2 cols on large screen) */}
          <div className="lg:col-span-2 space-y-4">
            <Link
              to="/"
              className="inline-flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-lg group"
              aria-label="AgriRent Home"
            >
              <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 group-hover:bg-emerald-500 transition-colors">
                <Tractor className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black text-white tracking-tight leading-tight">
                  Agri<span className="text-emerald-500">Rent</span>
                </span>
                <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-widest leading-none">
                  Farm Machinery Platform
                </span>
              </div>
            </Link>

            <p className="text-sm text-slate-400 font-normal leading-relaxed max-w-sm">
              Empowering farmers with instant access to high-performance agricultural machinery.
              Rent tractors, harvesters, and tillage implements directly from verified local owners.
            </p>

            {/* Verification Badge Strip */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>100% Verified Equipment & Owner Community</span>
            </div>

            {/* Newsletter Subscription Box */}
            <div className="pt-2 max-w-sm">
              <label htmlFor="newsletter-email" className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
                Subscribe for Rental Discounts
              </label>
              <form
                onSubmit={(e) => e.preventDefault()}
                className="flex gap-2"
              >
                <Input
                  id="newsletter-email"
                  type="email"
                  placeholder="Enter your email address"
                  className="bg-slate-900 border-slate-800 text-white placeholder:text-slate-500 text-xs h-10"
                  containerClassName="flex-1"
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  aria-label="Subscribe to newsletter"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white h-10 px-3 shrink-0"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2.5 text-sm">
              {QUICK_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.path}
                    className="text-slate-400 hover:text-emerald-400 transition-colors inline-block"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Equipment Categories */}
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              Categories
            </h3>
            <ul className="space-y-2.5 text-sm">
              {CATEGORY_LINKS.map((category) => (
                <li key={category.label}>
                  <Link
                    to={category.path}
                    className="text-slate-400 hover:text-emerald-400 transition-colors inline-block"
                  >
                    {category.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Contact Info & Socials */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              Contact & Support
            </h3>

            <div className="space-y-3 text-sm text-slate-400">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Agri Hub Complex, GT Road, Ludhiana, Punjab 141001</span>
              </div>

              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-emerald-500 shrink-0" />
                <a
                  href="tel:+9118001234567"
                  className="hover:text-emerald-400 transition-colors"
                >
                  +91 1800-123-4567
                </a>
              </div>

              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-emerald-500 shrink-0" />
                <a
                  href="mailto:support@agrirent.in"
                  className="hover:text-emerald-400 transition-colors"
                >
                  support@agrirent.in
                </a>
              </div>
            </div>

            {/* Social Media Links Bar */}
            <div className="pt-2">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
                Follow Us
              </h4>
              <div className="flex items-center gap-2">
                {SOCIAL_LINKS.map((social) => (
                  <a
                    key={social.label}
                    href={social.path}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Follow us on ${social.label}`}
                    className="p-2 rounded-lg bg-slate-900 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 border border-slate-800/80 transition-all"
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Legal & Copyright Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} AgriRent Platform. All rights reserved.</p>

          <div className="flex flex-wrap items-center gap-6">
            {LEGAL_LINKS.map((legal) => (
              <Link
                key={legal.label}
                to={legal.path}
                className="hover:text-slate-300 transition-colors"
              >
                {legal.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};
