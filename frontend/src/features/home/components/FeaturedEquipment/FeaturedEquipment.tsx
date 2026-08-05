import type { FeaturedEquipmentProps } from './FeaturedEquipment.types';
import { EquipmentCard } from '@/features/equipment/components/EquipmentCard';
import { MOCK_FEATURED_EQUIPMENT } from './FeaturedEquipment.data';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';
import { Sparkles, ArrowRight, Tractor } from 'lucide-react';

/**
 * Production-ready, responsive Featured Equipment section component.
 * Showcases curated top-rated equipment listings with filtering badge and actions.
 * Reuses the existing EquipmentCard and Button components.
 */
export const FeaturedEquipment = ({
  equipmentList = MOCK_FEATURED_EQUIPMENT,
  onBookEquipment,
  onSelectEquipment,
  onViewAllClick,
  className,
}: FeaturedEquipmentProps) => {
  return (
    <section
      className={cn('py-16 sm:py-24 bg-white border-b border-slate-200/60', className)}
      aria-label="Featured Farm Equipment Listings"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header Row */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 sm:mb-12 gap-4">
          <div>
            {/* Pill Tag */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-amber-100/90 text-amber-900 text-xs font-semibold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
              <span>Top Rated Machinery</span>
            </div>

            {/* Section Title */}
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
              Featured Equipment Near You
            </h2>

            {/* Subtitle */}
            <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-2xl font-normal leading-relaxed">
              Explore verified tractors, harvesters, and tillage machinery ready for immediate
              booking from top local equipment owners.
            </p>
          </div>

          {/* View All Equipment CTA Button (Reusing UI Button) */}
          <Button
            variant="outline"
            size="md"
            onClick={onViewAllClick}
            rightIcon={<ArrowRight className="w-4 h-4" />}
            className="self-start md:self-auto font-semibold border-slate-300 text-slate-700 hover:bg-slate-50 shrink-0"
          >
            View All Equipment
          </Button>
        </div>

        {/* Equipment Cards Responsive Grid (Mobile: 1, Tablet: 2, Laptop: 3, Desktop: 4) */}
        {equipmentList.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-6">
            {equipmentList.map((item) => (
              <EquipmentCard
                key={item.id}
                equipment={item}
                onBookNow={onBookEquipment}
                onCardClick={onSelectEquipment}
              />
            ))}
          </div>
        ) : (
          /* Empty State Fallback */
          <div className="text-center py-16 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
            <div className="w-12 h-12 rounded-full bg-slate-200/80 flex items-center justify-center mx-auto text-slate-500 mb-3">
              <Tractor className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">No Featured Equipment Found</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              Check back shortly or expand your location filter to discover available machinery.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};
