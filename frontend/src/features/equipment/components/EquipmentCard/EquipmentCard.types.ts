import type { EquipmentItem } from '../../types/equipment';

export interface EquipmentCardProps {
  /** The equipment data object to display in the card */
  equipment: EquipmentItem;
  /** Callback fired when user clicks the main CTA action button (e.g. Rent Now / Request) */
  onBookNow?: (equipment: EquipmentItem) => void;
  /** Callback fired when user clicks the card body to view details */
  onCardClick?: (equipment: EquipmentItem) => void;
  /** Additional CSS class names for styling customizations */
  className?: string;
}
