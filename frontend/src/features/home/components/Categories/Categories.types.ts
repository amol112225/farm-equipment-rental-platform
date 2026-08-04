import type { CategoryItem } from '../CategoryCard';

/**
 * Props definition for the Categories section component.
 */
export interface CategoriesProps {
  /** Optional callback when a category card is clicked */
  onSelectCategory?: (category: CategoryItem) => void;
  /** Optional custom category list data */
  categories?: CategoryItem[];
  /** Additional custom Tailwind CSS class names */
  className?: string;
}
