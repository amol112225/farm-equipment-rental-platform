import type { CategoriesProps } from './Categories.types';
import { CategoryCard, type CategoryItem } from '../CategoryCard';
import { MOCK_CATEGORIES } from './Categories.data';
import { cn } from '@/utils/cn';
import { LayoutGrid, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

/**
 * Production-ready, responsive Categories Section component.
 * Displays equipment categories in a structured grid with section header & call-to-action.
 */
export const Categories = ({
  onSelectCategory,
  categories = MOCK_CATEGORIES,
  className,
}: CategoriesProps) => {
  const handleCategoryClick = (category: CategoryItem) => {
    if (onSelectCategory) {
      onSelectCategory(category);
    }
  };

  return (
    <section
      className={cn('py-16 sm:py-20 bg-slate-50 border-b border-slate-200/60', className)}
      aria-label="Browse Equipment Categories"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-emerald-100/80 text-emerald-800 text-xs font-semibold uppercase tracking-wider mb-3">
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Equipment Categories</span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
              Explore Machinery by Category
            </h2>

            <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-xl">
              Select a category to find specialized agricultural machinery available for rent
              near your farm.
            </p>
          </div>

          {/* View All Categories Link Button */}
          <Button
            variant="outline"
            size="md"
            rightIcon={<ArrowRight className="w-4 h-4" />}
            className="self-start md:self-auto font-medium"
          >
            View All Categories
          </Button>
        </div>

        {/* Responsive Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6">
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              onClick={handleCategoryClick}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
