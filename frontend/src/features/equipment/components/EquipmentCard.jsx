import React, { useState, useEffect } from 'react';
import { fetchEquipmentRatingSummary } from '../../../services/reviewService';
import { resolveImageUrl } from '../../../services/equipmentService';

/**
 * EquipmentCard Component
 * Reusable card to display farm equipment information with action buttons and equipment rating.
 * 
 * Props:
 * @param {number} id - Equipment ID
 * @param {number} equipmentId - Alternative prop for equipment ID
 * @param {string} image - URL or path of the equipment image
 * @param {Array} images - Array of uploaded equipment photo objects
 * @param {string} name - Name of the equipment
 * @param {number|string} price - Rental price amount
 * @param {string} priceUnit - Rental duration unit ('hour' | 'day')
 * @param {string} bookingType - Booking mode ('instant' | 'request' | 'both')
 * @param {string} distance - Distance from user (e.g. '4.2 km' or '4.2 km away')
 * @param {string} category - Equipment category
 * @param {number} ownerId - Owner ID
 * @param {string} ownerName - Owner full name
 * @param {number} rating - Equipment average rating
 * @param {number} totalReviews - Equipment review count
 * @param {Object} ratingSummary - Optional pre-loaded equipment rating summary
 * @param {function} onSelect - Callback when clicking card or Book button
 * @param {function} onViewReviews - Callback when clicking rating badge
 */
const EquipmentCard = ({
  id,
  equipmentId,
  image,
  images = [],
  name,
  price,
  priceUnit = 'hour',
  bookingType,
  distance,
  category,
  ownerId,
  ownerName,
  rating,
  totalReviews,
  ratingSummary: initialRatingSummary,
  ownerRating,
  ownerTotalReviews,
  ownerRatingSummary,
  onSelect,
  onViewReviews,
}) => {
  const targetEquipmentId = id || equipmentId;
  const propRating = rating !== undefined && rating !== null ? rating : ownerRating;
  const propTotalReviews =
    totalReviews !== undefined && totalReviews !== null ? totalReviews : ownerTotalReviews;
  const activeInitialSummary = initialRatingSummary || ownerRatingSummary;

  const [ratingSummary, setRatingSummary] = useState(
    activeInitialSummary ||
      (propRating !== undefined && propRating !== null
        ? {
            averageRating: Number(propRating) || 0.0,
            totalReviews: Number(propTotalReviews) || 0,
          }
        : null)
  );

  useEffect(() => {
    if (activeInitialSummary) {
      setRatingSummary(activeInitialSummary);
      return;
    }

    if (
      propRating !== undefined &&
      propRating !== null &&
      propTotalReviews !== undefined &&
      propTotalReviews !== null
    ) {
      setRatingSummary({
        averageRating: Number(propRating) || 0.0,
        totalReviews: Number(propTotalReviews) || 0,
      });
      return;
    }

    if (targetEquipmentId) {
      let isMounted = true;
      fetchEquipmentRatingSummary(targetEquipmentId)
        .then((res) => {
          if (isMounted && res?.data) {
            setRatingSummary(res.data);
          }
        })
        .catch(() => {
          // Fallback silently if rating fails
        });
      return () => {
        isMounted = false;
      };
    }
  }, [targetEquipmentId, propRating, propTotalReviews, activeInitialSummary]);

  useEffect(() => {
    const handleReviewSubmitted = (e) => {
      if (
        targetEquipmentId &&
        (!e.detail?.equipmentId || e.detail.equipmentId === targetEquipmentId)
      ) {
        fetchEquipmentRatingSummary(targetEquipmentId, false)
          .then((res) => {
            if (res?.data) {
              setRatingSummary(res.data);
            }
          })
          .catch(() => {});
      }
    };

    window.addEventListener('agrorent:review-submitted', handleReviewSubmitted);
    return () => {
      window.removeEventListener('agrorent:review-submitted', handleReviewSubmitted);
    };
  }, [targetEquipmentId]);
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
          label: '⚡ Instant Booking',
          styles: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        };
      case 'request':
        return {
          label: '📝 Request to Book',
          styles: 'bg-amber-50 text-amber-700 border-amber-200',
        };
      case 'both':
      case 'instant+request':
      case 'instant + request':
        return {
          label: '⚡ Instant / Request',
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
  // Resolve primary image to display:
  // 1. Explicitly designated primary photo in images array (isPrimary === true)
  // 2. Fallback to image prop (equipment.imageUrl)
  // 3. Fallback to first photo in images array (deterministic)
  // 4. Null (clean fallback SVG placeholder)
  const primaryFromList = Array.isArray(images) && images.length > 0
    ? images.find((img) => img && (img.isPrimary === true || img.primary === true))
    : null;

  const firstFromList = Array.isArray(images) && images.length > 0 ? images[0] : null;

  const rawDisplayUrl =
    (primaryFromList && (primaryFromList.imageUrl || (typeof primaryFromList === 'string' ? primaryFromList : null))) ||
    image ||
    (firstFromList && (firstFromList.imageUrl || (typeof firstFromList === 'string' ? firstFromList : null))) ||
    null;

  const resolvedCardImage = resolveImageUrl(rawDisplayUrl);

  return (
    <div 
      onClick={onSelect}
      className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col w-full group cursor-pointer border-slate-200 hover:border-emerald-500/50"
    >
      {/* 1. Equipment Image */}
      <div className="relative w-full h-48 sm:h-52 bg-slate-100 overflow-hidden">
        {resolvedCardImage ? (
          <img
            src={resolvedCardImage}
            alt={name || 'Farm equipment'}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              if (e.currentTarget.nextSibling) {
                e.currentTarget.nextSibling.style.display = 'flex';
              }
            }}
          />
        ) : null}
        <div
          className="w-full h-full flex items-center justify-center text-slate-400"
          style={{ display: resolvedCardImage ? 'none' : 'flex' }}
        >
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
        
        {/* Category Pill Tag on Top Left */}
        {category && (
          <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-semibold px-2.5 py-1 rounded-full">
            {category}
          </div>
        )}

        {/* Multi-Photo Count Badge on Top Right */}
        {images && images.length > 1 && (
          <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
            <span>📷</span>
            <span>{images.length}</span>
          </div>
        )}
      </div>

      {/* Card Content Body */}
      <div className="p-4 sm:p-5 flex flex-col flex-grow justify-between space-y-3">
        <div className="space-y-2">
          {/* Equipment Name */}
          <h3 className="text-base sm:text-lg font-bold text-slate-900 line-clamp-1 tracking-tight group-hover:text-emerald-700 transition-colors">
            {name || 'Equipment Name'}
          </h3>

          {/* Rental Price */}
          {formattedPrice && (
            <div className="text-base font-bold text-emerald-700">
              {formattedPrice} <span className="text-xs font-normal text-slate-500">/ {normalizedUnit}</span>
            </div>
          )}

          {/* Owner & Rating Row */}
          <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
            <span className="truncate max-w-[150px]">
              👤 {ownerName || 'Verified Owner'}
            </span>
            {ratingSummary && ratingSummary.totalReviews > 0 ? (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  if (onViewReviews) onViewReviews();
                  else if (onSelect) onSelect(true);
                }}
                className="inline-flex items-center gap-1 font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-md text-[11px] shrink-0 cursor-pointer transition-colors"
                title="Click to view equipment reviews"
              >
                <span className="text-amber-500">★</span>
                <span>{ratingSummary.averageRating.toFixed(1)}</span>
                <span className="text-slate-500 font-normal">
                  ({ratingSummary.totalReviews} {ratingSummary.totalReviews === 1 ? 'review' : 'reviews'})
                </span>
              </span>
            ) : (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  if (onViewReviews) onViewReviews();
                  else if (onSelect) onSelect(true);
                }}
                className="inline-flex items-center gap-1 text-[11px] text-slate-500 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md shrink-0 cursor-pointer transition-colors"
                title="Click to view equipment reviews"
              >
                <span className="text-slate-400">★</span>
                <span>No ratings yet</span>
              </span>
            )}
          </div>
        </div>

        <div className="space-y-3 pt-1 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs">
            {/* Booking Type Badge */}
            {badge && (
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${badge.styles}`}
              >
                {badge.label}
              </span>
            )}

            {/* Distance */}
            {formattedDistance && (
              <span className="font-medium text-slate-500 flex items-center gap-1">
                <span>📍</span>
                <span>{formattedDistance}</span>
              </span>
            )}
          </div>

          {/* Action Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onSelect) onSelect();
            }}
            className="w-full bg-slate-900 group-hover:bg-emerald-600 text-white text-xs sm:text-sm font-semibold py-2.5 px-4 rounded-xl transition-all duration-200 shadow-xs flex items-center justify-center space-x-1.5"
          >
            <span>Rent Equipment</span>
            <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default EquipmentCard;

