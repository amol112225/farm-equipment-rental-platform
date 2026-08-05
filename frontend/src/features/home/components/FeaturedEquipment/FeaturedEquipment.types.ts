import type { EquipmentItem } from '@/features/equipment/types/equipment';

export interface FeaturedEquipmentProps {
  /** Optional custom list of equipment to override default mock data */
  equipmentList?: EquipmentItem[];
  /** Callback fired when user clicks 'Book Now' or 'Request' on an equipment card */
  onBookEquipment?: (equipment: EquipmentItem) => void;
  /** Callback fired when user clicks card body to view equipment details */
  onSelectEquipment?: (equipment: EquipmentItem) => void;
  /** Callback fired when user clicks 'View All Equipment' header button */
  onViewAllClick?: () => void;
  /** Additional CSS class names */
  className?: string;
}
