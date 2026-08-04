import type { ReactNode } from 'react';

/**
 * Data interface for an Equipment Category item.
 */
export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  equipmentCount: number;
  description: string;
  icon: ReactNode;
}

/**
 * Props definition for the CategoryCard component.
 */
export interface CategoryCardProps {
  /** Category data model */
  category: CategoryItem;
  /** Optional callback fired when the card is clicked */
  onClick?: (category: CategoryItem) => void;
  /** Additional custom Tailwind CSS class names */
  className?: string;
}
