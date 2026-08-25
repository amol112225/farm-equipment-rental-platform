import React from 'react';

/**
 * EquipmentCard Component
 * Reusable card to display farm equipment information.
 * 
 * Props:
 * @param {string} image - URL or path of the equipment image
 * @param {string} name - Name of the equipment
 * @param {number|string} price - Rental price amount
 * @param {string} priceUnit - Rental duration unit ('hour' | 'day')
 * @param {string} bookingType - Booking mode ('instant' | 'request' | 'both')
 * @param {string} distance - Distance from user (e.g. '4.2 km' or '4.2 km away')
 */
const EquipmentCard = ({
  image,
  name,
  price,
  priceUnit = 'hour',
  bookingType,
  distance,
}) => {
  // Format price with Indian Rupee symbol and commas if numeric
  const formattedPrice =
    typeof price === 'number'
      ? `₹${price.toLocaleString('en-IN')}`
      : price
      ? `₹${price}`
      : null;

  // Format price unit string
  const normalizedUnit = priceUnit?.toLowerCase() === 'day' ? 'day' : 'hour';

  // Map booking type prop to badge label and styling
  const getBookingTypeBadge = (type) => {
    if (!type) return null;
    switch (type.toLowerCase()) {
      case 'instant':
        return {
          label: 'Instant Booking',
          styles: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        };
      case 'request':
        return {
          label: 'Request to Book',
          styles: 'bg-amber-50 text-amber-700 border-amber-200',
        };
      case 'both':
      case 'instant+request':
      case 'instant + request':
        return {
          label: 'Instant + Request',
          styles: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        };
      default:
        return {
          label: type,
          styles: 'bg-slate-50 text-slate-700 border-slate-200',
        };
    }
  };

  const badge = getBookingTypeBadge(bookingType);

  // Format distance display
  const formattedDistance = distance
    ? distance.toString().includes('away')
      ? distance
      : `${distance} away`
    : null;

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 flex flex-col w-full max-w-sm">
      {/* 1. Equipment Image */}
      <div className="relative w-full h-48 sm:h-52 bg-slate-100 overflow-hidden">
        {image ? (
          <img
            src={image}
            alt={name || 'Farm equipment'}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400">
            <svg
              className="w-12 h-12"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Card Content Body */}
      <div className="p-4 sm:p-5 flex flex-col flex-grow space-y-3">
        {/* 2. Equipment Name */}
        <h3 className="text-lg font-bold text-slate-900 line-clamp-1 tracking-tight">
          {name || 'Equipment Name'}
        </h3>

        {/* 3. Rental Price */}
        {formattedPrice && (
          <div className="text-base font-bold text-emerald-700">
            {formattedPrice} <span className="text-sm font-normal text-slate-500">/ {normalizedUnit}</span>
          </div>
        )}

        {/* 4. Booking Type Badge */}
        {badge && (
          <div>
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${badge.styles}`}
            >
              {badge.label}
            </span>
          </div>
        )}

        {/* 5. Distance (Only displayed if distance prop is present) */}
        {formattedDistance && (
          <div className="pt-2 text-xs font-medium text-slate-500 flex items-center space-x-1">
            <span>📍</span>
            <span>{formattedDistance}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default EquipmentCard;
