export type BookingType = 'instant' | 'request';

export interface EquipmentItem {
  id: string;
  name: string;
  category: string;
  imageUrl: string;
  pricePerDay: number;
  location: string;
  distance?: string;
  ownerName?: string;
  ownerAvatarUrl?: string;
  isOwnerVerified?: boolean;
  rating?: number;
  reviewCount?: number;
  isAvailable: boolean;
  bookingType: BookingType;
  specs?: {
    power?: string;
    fuelType?: string;
    modelYear?: string;
  };
}
