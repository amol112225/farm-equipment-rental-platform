import type { CategoryCardProps } from './CategoryCard.types';
import { cn } from '@/utils/cn';
import { ChevronRight } from 'lucide-react';

/**
 * Production-ready, accessible CategoryCard component.
 * Displays equipment category details with hover animations, badges, and icon slot.
 */
export const CategoryCard = ({
  category,
  onClick,
  className,
}: CategoryCardProps) => {
  const { name, equipmentCount, description, icon } = category;

  const handleClick = () => {
    if (onClick) {
      onClick(category);
    }
  };

  return (
    <article
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      className={cn(
        'group relative flex flex-col justify-between p-6 bg-white rounded-2xl border border-slate-200/80 ',
        'shadow-xs hover:shadow-xl hover:border-emerald-500/40 hover:-translate-y-1 ',
        'transition-all duration-300 ease-in-out cursor-pointer focus-visible:outline-none ',
        'focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 select-none',
        className
      )}
      aria-label={`Browse ${name} category with ${equipmentCount} available machines`}
    >
      {/* Top Section: Icon Container & Equipment Count Badge */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
            <div className="w-7 h-7 flex items-center justify-center">
              {icon}
            </div>
          </div>

          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 group-hover:bg-emerald-50 group-hover:text-emerald-700 transition-colors duration-300">
            {equipmentCount} Listings
          </span>
        </div>

        {/* Category Name */}
        <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors duration-200">
          {name}
        </h3>

        {/* Short Description */}
        <p className="mt-1.5 text-xs text-slate-500 line-clamp-2 leading-relaxed font-normal">
          {description}
        </p>
      </div>

      {/* Card Action Link Indicator */}
      <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-emerald-600 group-hover:text-emerald-700">
        <span>Explore Category</span>
        <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-200" />
      </div>
    </article>
  );
};
