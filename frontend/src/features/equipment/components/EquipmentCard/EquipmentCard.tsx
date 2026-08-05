import type { EquipmentCardProps } from './EquipmentCard.types';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';
import {
  MapPin,
  Star,
  Zap,
  Clock,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Gauge,
} from 'lucide-react';

/**
 * Reusable, production-ready EquipmentCard component.
 * Displays machinery image, key specifications, pricing, location, owner verification,
 * booking type badges, availability status, and a primary CTA.
 */
export const EquipmentCard = ({
  equipment,
  onBookNow,
  onCardClick,
  className,
}: EquipmentCardProps) => {
  const {
    name,
    category,
    imageUrl,
    pricePerDay,
    location,
    distance,
    ownerName,
    ownerAvatarUrl,
    isOwnerVerified = false,
    rating,
    reviewCount,
    isAvailable,
    bookingType,
    specs,
  } = equipment;

  const handleCardClick = () => {
    if (onCardClick) {
      onCardClick(equipment);
    }
  };

  const handleBookNowClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevents triggering card click when CTA button is clicked
    if (onBookNow) {
      onBookNow(equipment);
    }
  };

  return (
    <article
      onClick={handleCardClick}
      role={onCardClick ? 'button' : undefined}
      tabIndex={onCardClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onCardClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onCardClick(equipment);
        }
      }}
      className={cn(
        'group relative bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2',
        onCardClick && 'cursor-pointer',
        className
      )}
      aria-label={`Equipment listing: ${name}`}
    >
      {/* Thumbnail Container */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100 shrink-0">
        <img
          src={imageUrl}
          alt={name}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        />

        {/* Gradient Overlay for Top Badges */}
        <div
          className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-slate-900/60 to-transparent pointer-events-none"
          aria-hidden="true"
        />

        {/* Top Floating Badges Bar */}
        <div className="absolute top-3 inset-x-3 flex items-center justify-between gap-2 pointer-events-none">
          {/* Availability Status Badge */}
          <span
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-md shadow-sm border',
              isAvailable
                ? 'bg-emerald-950/75 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-950/75 border-rose-500/30 text-rose-300'
            )}
          >
            {isAvailable ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Available</span>
              </>
            ) : (
              <>
                <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>Rented</span>
              </>
            )}
          </span>

          {/* Instant vs Request Booking Badge */}
          <span
            className={cn(
              'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-md shadow-sm border',
              bookingType === 'instant'
                ? 'bg-amber-950/75 border-amber-500/40 text-amber-300'
                : 'bg-slate-950/75 border-slate-700 text-slate-300'
            )}
          >
            {bookingType === 'instant' ? (
              <>
                <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                <span>Instant Book</span>
              </>
            ) : (
              <>
                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>On Request</span>
              </>
            )}
          </span>
        </div>

        {/* Category Pill Tag (Bottom Left of Thumbnail) */}
        <div className="absolute bottom-3 left-3 pointer-events-none">
          <span className="inline-block px-2.5 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-md border border-white/20 text-slate-100 text-[11px] font-medium uppercase tracking-wider">
            {category}
          </span>
        </div>
      </div>

      {/* Card Content Body */}
      <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between">
        <div>
          {/* Rating & Location Row */}
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2 gap-2">
            {/* Location */}
            <div className="flex items-center gap-1 truncate text-slate-600 font-medium">
              <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="truncate">{location}</span>
              {distance && <span className="text-slate-400">({distance})</span>}
            </div>

            {/* Rating Badge */}
            {typeof rating === 'number' && (
              <div className="flex items-center gap-1 bg-amber-50 text-amber-800 px-2 py-0.5 rounded font-semibold shrink-0 border border-amber-200/60">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400 shrink-0" />
                <span>{rating.toFixed(1)}</span>
                {typeof reviewCount === 'number' && (
                  <span className="text-slate-400 font-normal">({reviewCount})</span>
                )}
              </div>
            )}
          </div>

          {/* Equipment Title */}
          <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
            {name}
          </h3>

          {/* Specs Strip */}
          {specs && (specs.power || specs.fuelType) && (
            <div className="mt-2.5 flex items-center gap-2 text-xs text-slate-600">
              {specs.power && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 font-medium text-slate-700">
                  <Gauge className="w-3 h-3 text-slate-500" />
                  {specs.power}
                </span>
              )}
              {specs.fuelType && (
                <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 font-medium text-slate-700">
                  {specs.fuelType}
                </span>
              )}
              {specs.modelYear && (
                <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 font-medium text-slate-700">
                  {specs.modelYear}
                </span>
              )}
            </div>
          )}

          {/* Owner Info (Optional) */}
          {ownerName && (
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-600">
              {ownerAvatarUrl ? (
                <img
                  src={ownerAvatarUrl}
                  alt={ownerName}
                  className="w-5 h-5 rounded-full object-cover border border-slate-200 shrink-0"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center justify-center shrink-0">
                  {ownerName.charAt(0)}
                </div>
              )}
              <span className="truncate font-medium text-slate-700">{ownerName}</span>
              {isOwnerVerified && (
                <ShieldCheck
                  className="w-3.5 h-3.5 text-emerald-600 shrink-0"
                  aria-label="Verified Owner"
                />
              )}
            </div>
          )}
        </div>

        {/* Footer Pricing & CTA Button */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
          <div>
            <span className="text-xs text-slate-500 block leading-tight font-medium">
              Daily Rate
            </span>
            <div className="flex items-baseline gap-0.5">
              <span className="text-lg sm:text-xl font-extrabold text-slate-900">
                ₹{pricePerDay.toLocaleString('en-IN')}
              </span>
              <span className="text-xs font-normal text-slate-500">/day</span>
            </div>
          </div>

          <Button
            variant={bookingType === 'instant' ? 'primary' : 'outline'}
            size="sm"
            disabled={!isAvailable}
            onClick={handleBookNowClick}
            rightIcon={<ArrowRight className="w-4 h-4" />}
            className={cn(
              'font-semibold shrink-0',
              bookingType === 'instant'
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'border-slate-300 text-slate-700 hover:bg-slate-50'
            )}
            aria-label={`Book ${name} for ₹${pricePerDay} per day`}
          >
            {bookingType === 'instant' ? 'Book Now' : 'Request'}
          </Button>
        </div>
      </div>
    </article>
  );
};
