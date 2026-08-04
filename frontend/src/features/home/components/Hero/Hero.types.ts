/**
 * Props definition for the Hero Section component.
 */
export interface HeroProps {
  /** Optional callback fired when the user submits the hero search bar */
  onSearchSubmit?: (searchQuery: string, locationQuery: string) => void;
  /** Optional callback fired when user clicks "List Your Equipment" */
  onListEquipmentClick?: () => void;
  /** Additional custom Tailwind CSS class names */
  className?: string;
}
