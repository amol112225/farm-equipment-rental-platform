import { useState, type FormEvent } from 'react';
import type { HeroProps } from './Hero.types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Search, MapPin, ShieldCheck, Zap, Tractor, ArrowRight } from 'lucide-react';
import { cn } from '@/utils/cn';

/**
 * Production-ready, fully accessible, and responsive Hero Section component.
 * Communicates core platform value, provides instant equipment search, and highlights key trust metrics.
 */
export const Hero = ({
  onSearchSubmit,
  onListEquipmentClick,
  className,
}: HeroProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (onSearchSubmit) {
      onSearchSubmit(searchQuery, locationQuery);
    }
  };

  return (
    <section
      className={cn(
        'relative overflow-hidden bg-gradient-to-b from-emerald-950 via-slate-900 to-slate-900 py-16 sm:py-24 lg:py-32 text-white',
        className
      )}
      aria-label="Hero - Farm Equipment Rental Search"
    >
      {/* Background Decorative Radial Gradient & Grid Texture */}
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-600/20 via-transparent to-transparent pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-24 -right-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center">
          {/* Trust Badge Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm font-medium mb-6 backdrop-blur-md">
            <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span>Instant Booking & Owner Approval Modes Available</span>
          </div>

          {/* Main Hero Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight max-w-4xl leading-tight text-slate-100">
            Rent Heavy Farm Equipment{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">
              Near You
            </span>
            , Pay Only For Days Used.
          </h1>

          {/* Supporting Subtitle */}
          <p className="mt-6 text-base sm:text-lg lg:text-xl text-slate-300 max-w-2xl font-normal leading-relaxed">
            Connect directly with local machinery owners. Rent tractors, harvesters,
            rotavators, and seeders effortlessly with flexible rental schedules.
          </p>

          {/* Interactive Search Bar Widget Card */}
          <div className="mt-8 sm:mt-10 w-full max-w-3xl">
            <form
              onSubmit={handleSearchSubmit}
              className="bg-white/10 backdrop-blur-xl border border-white/20 p-3 sm:p-4 rounded-2xl shadow-2xl flex flex-col md:flex-row gap-3 sm:gap-4 items-center"
            >
              {/* Equipment Search Input */}
              <Input
                placeholder="Search tractor, harvester, rotavator..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="w-5 h-5 text-slate-400" />}
                fullWidth
                containerClassName="flex-1"
                className="bg-white text-slate-900 placeholder:text-slate-500 border-none h-12"
                aria-label="Equipment name or category"
              />

              {/* Location Input */}
              <Input
                placeholder="District, City, or Pincode"
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
                leftIcon={<MapPin className="w-5 h-5 text-slate-400" />}
                fullWidth
                containerClassName="flex-1"
                className="bg-white text-slate-900 placeholder:text-slate-500 border-none h-12"
                aria-label="Location or pincode"
              />

              {/* Submit Search Button */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                className="md:w-auto h-12 px-8 font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shrink-0"
              >
                <Search className="w-5 h-5 mr-2" />
                <span>Search</span>
              </Button>
            </form>
          </div>

          {/* CTAs & Trust Indicators */}
          <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
            <Button
              variant="secondary"
              size="lg"
              onClick={onListEquipmentClick}
              rightIcon={<ArrowRight className="w-5 h-5" />}
              className="w-full sm:w-auto font-medium"
            >
              List Your Machinery
            </Button>
          </div>

          {/* Trust Highlights Strip */}
          <div className="mt-12 sm:mt-16 pt-8 border-t border-white/10 w-full max-w-4xl grid grid-cols-1 sm:grid-cols-3 gap-6 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-3">
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Tractor className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-100">1,200+ Machines</h4>
                <p className="text-xs text-slate-400">Active listings near you</p>
              </div>
            </div>

            <div className="flex items-center justify-center sm:justify-start gap-3">
              <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-100">Instant Booking</h4>
                <p className="text-xs text-slate-400">Immediate schedule lock</p>
              </div>
            </div>

            <div className="flex items-center justify-center sm:justify-start gap-3">
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-100">Verified Owners</h4>
                <p className="text-xs text-slate-400">100% peer trust rating</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
