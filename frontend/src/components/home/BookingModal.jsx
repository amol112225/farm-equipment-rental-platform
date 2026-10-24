import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { createBooking } from '../../services/bookingService';
import { fetchEquipmentRatingSummary, fetchEquipmentReviews } from '../../services/reviewService';
import { resolveImageUrl } from '../../services/equipmentService';

/**
 * BookingModal Component
 * Connected to Spring Boot REST API for creating real equipment rental bookings.
 * Displays equipment ratings and reviews.
 */
const BookingModal = ({ equipment, initialShowReviews = false, onClose, onConfirm }) => {
  if (!equipment) return null;

  const { token, isAuthenticated } = useAuth();

  // Helper to format local Date for datetime-local input (YYYY-MM-DDTHH:mm)
  const getInitialLocalDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  const [hoursOrDays, setHoursOrDays] = useState(1);
  const [startDateTime, setStartDateTime] = useState(getInitialLocalDateTime());
  const [notes, setNotes] = useState('');
  const [bookingMode, setBookingMode] = useState('instant');
  const [generalError, setGeneralError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Equipment rating and reviews state
  const propRating = equipment?.rating !== undefined && equipment?.rating !== null
    ? equipment.rating
    : equipment?.ownerRating;
  const propTotalReviews = equipment?.totalReviews !== undefined && equipment?.totalReviews !== null
    ? equipment.totalReviews
    : equipment?.ownerTotalReviews;

  const [equipmentRating, setEquipmentRating] = useState(
    propRating !== undefined && propRating !== null
      ? {
          averageRating: Number(propRating) || 0.0,
          totalReviews: Number(propTotalReviews) || 0,
        }
      : null
  );
  const [equipmentReviews, setEquipmentReviews] = useState([]);
  const [showReviews, setShowReviews] = useState(Boolean(initialShowReviews));
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [reviewsError, setReviewsError] = useState('');

  const priceUnit = equipment.priceUnit?.toLowerCase() === 'day' ? 'day' : 'hour';
  const totalPrice = (equipment.price || 0) * Math.max(1, hoursOrDays);

  const isBothType = equipment.bookingType?.toLowerCase() === 'both';

  const loadEquipmentReviews = async (targetId) => {
    const equipId = targetId || equipment?.id;
    if (!equipId) return;
    setIsLoadingReviews(true);
    setReviewsError('');
    try {
      const res = await fetchEquipmentReviews(equipId);
      setEquipmentReviews(res?.data || []);
    } catch (err) {
      setReviewsError(err.message || 'Failed to load equipment reviews. Please try again.');
    } finally {
      setIsLoadingReviews(false);
    }
  };

  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  const photosList = equipment?.images && equipment.images.length > 0
    ? equipment.images.map((img) => (typeof img === 'string' ? img : img.imageUrl)).filter(Boolean)
    : (equipment?.image || equipment?.imageUrl ? [equipment.image || equipment.imageUrl] : []);

  const activePhoto = photosList.length > 0 && photosList[activePhotoIndex]
    ? resolveImageUrl(photosList[activePhotoIndex])
    : resolveImageUrl(equipment?.image || equipment?.imageUrl);

  useEffect(() => {
    setHoursOrDays(1);
    setStartDateTime(getInitialLocalDateTime());
    setNotes('');
    setBookingMode('instant');
    setGeneralError('');
    setShowReviews(Boolean(initialShowReviews));
    setEquipmentReviews([]);
    const primaryIdx = equipment?.images && Array.isArray(equipment.images)
      ? equipment.images.findIndex((img) => img && (img.isPrimary === true || img.primary === true))
      : 0;
    setActivePhotoIndex(primaryIdx >= 0 ? primaryIdx : 0);

    if (
      propRating !== undefined &&
      propRating !== null &&
      propTotalReviews !== undefined &&
      propTotalReviews !== null
    ) {
      setEquipmentRating({
        averageRating: Number(propRating) || 0.0,
        totalReviews: Number(propTotalReviews) || 0,
      });
    } else if (equipment?.id) {
      fetchEquipmentRatingSummary(equipment.id)
        .then((res) => setEquipmentRating(res?.data || null))
        .catch(() => setEquipmentRating({ averageRating: 0.0, totalReviews: 0 }));
    } else {
      setEquipmentRating(null);
    }

    if (initialShowReviews && equipment?.id) {
      loadEquipmentReviews(equipment.id);
    }
  }, [equipment, initialShowReviews, propRating, propTotalReviews]);

  useEffect(() => {
    const handleReviewSubmitted = (e) => {
      if (equipment?.id && (!e.detail?.equipmentId || e.detail.equipmentId === equipment.id)) {
        fetchEquipmentRatingSummary(equipment.id, false)
          .then((res) => setEquipmentRating(res?.data || null))
          .catch(() => {});
        if (showReviews) {
          loadEquipmentReviews(equipment.id);
        }
      }
    };
    window.addEventListener('agrorent:review-submitted', handleReviewSubmitted);
    return () => {
      window.removeEventListener('agrorent:review-submitted', handleReviewSubmitted);
    };
  }, [equipment?.id, showReviews]);

  const handleToggleReviews = async () => {
    if (!showReviews) {
      setShowReviews(true);
      if (equipmentReviews.length === 0 || reviewsError) {
        await loadEquipmentReviews(equipment?.id);
      }
    } else {
      setShowReviews(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError('');

    if (!isAuthenticated || !token) {
      setGeneralError('Please log in to your farmer account to book equipment.');
      return;
    }

    if (!startDateTime) {
      setGeneralError('Please select a valid start date and time.');
      return;
    }

    // Format local datetime string to ISO format (YYYY-MM-DDTHH:mm:ss)
    let formattedStartDateTime = startDateTime;
    if (formattedStartDateTime.length === 16) {
      formattedStartDateTime += ':00';
    }

    setIsSubmitting(true);

    try {
      const payload = {
        equipmentId: equipment.id,
        startDateTime: formattedStartDateTime,
        duration: Math.max(1, parseInt(hoursOrDays) || 1),
        notes: notes ? notes.trim() : null,
        bookingMode: isBothType ? bookingMode : null,
      };

      const response = await createBooking(payload, token);
      setIsSubmitting(false);

      if (onConfirm) {
        onConfirm(response.data || response);
      }
      onClose();
    } catch (err) {
      setIsSubmitting(false);
      setGeneralError(err.message || 'Failed to submit booking request. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="relative h-44 sm:h-52 bg-slate-100 shrink-0">
          {activePhoto ? (
            <img
              src={activePhoto}
              alt={equipment.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                if (e.currentTarget.nextSibling) {
                  e.currentTarget.nextSibling.style.display = 'flex';
                }
              }}
            />
          ) : null}
          <div
            className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-100"
            style={{ display: activePhoto ? 'none' : 'flex' }}
          >
            <span className="text-4xl">🚜</span>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent flex items-end p-5">
            <div>
              <span className="bg-emerald-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                {equipment.category || 'Farm Equipment'}
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-white mt-1">
                {equipment.name}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 bg-slate-900/60 text-white hover:bg-slate-900 p-2 rounded-full transition-colors z-10"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Multi-Photo Gallery Thumbnails Strip */}
        {photosList.length > 1 && (
          <div className="px-5 py-2.5 bg-slate-900 flex items-center gap-2 overflow-x-auto shrink-0">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mr-1 shrink-0">
              Photos ({photosList.length}):
            </span>
            {photosList.map((photoUrl, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActivePhotoIndex(idx)}
                className={`w-10 h-10 rounded-lg overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                  idx === activePhotoIndex
                    ? 'border-emerald-400 scale-105 shadow-sm ring-1 ring-emerald-400'
                    : 'border-slate-700 opacity-60 hover:opacity-100'
                }`}
                title={`Photo ${idx + 1}`}
              >
                <img
                  src={resolveImageUrl(photoUrl)}
                  alt={`Thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}

        {/* Modal Content / Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-grow">
          {generalError && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm font-medium flex items-center space-x-2">
              <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{generalError}</span>
            </div>
          )}

          <div className="flex justify-between items-center bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-100">
            <div>
              <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide">Rental Rate</p>
              <p className="text-lg font-bold text-emerald-700">
                ₹{equipment.price ? equipment.price.toLocaleString('en-IN') : '0'}{' '}
                <span className="text-xs font-normal text-slate-600">/ {priceUnit}</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-slate-500">Location</p>
              <p className="text-sm font-bold text-slate-700">📍 {equipment.distance || equipment.location}</p>
            </div>
          </div>

          {/* Owner Info & Rating Bar */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 font-medium">Equipment Owner</p>
                <p className="font-bold text-slate-800 text-sm">{equipment.ownerName || 'Verified Equipment Owner'}</p>
              </div>

              <div className="text-right">
                <button
                  type="button"
                  onClick={handleToggleReviews}
                  className="inline-flex items-center gap-1.5 font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                  title="Click to view equipment reviews"
                >
                  <span>⭐</span>
                  {equipmentRating && equipmentRating.totalReviews > 0 ? (
                    <>
                      <span>{equipmentRating.averageRating.toFixed(1)}</span>
                      <span className="text-amber-800 font-normal">
                        ({equipmentRating.totalReviews} review{equipmentRating.totalReviews > 1 ? 's' : ''})
                      </span>
                    </>
                  ) : (
                    <span>No ratings yet</span>
                  )}
                </button>
              </div>
            </div>

            {/* Expandable Equipment Reviews Drawer */}
            {showReviews && (
              <div className="pt-2 border-t border-slate-200 mt-2 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">Recent Equipment Reviews</span>
                  <button
                    type="button"
                    onClick={handleToggleReviews}
                    className="text-emerald-700 hover:underline font-semibold text-[11px]"
                  >
                    Hide Reviews
                  </button>
                </div>

                {isLoadingReviews ? (
                  <div className="py-3 text-center text-slate-500 flex items-center justify-center space-x-2">
                    <div className="animate-spin inline-block w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full" />
                    <span>Loading reviews...</span>
                  </div>
                ) : reviewsError ? (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-center space-y-2">
                    <p className="text-xs text-red-700 font-medium">{reviewsError}</p>
                    <button
                      type="button"
                      onClick={() => loadEquipmentReviews(equipment?.id)}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[11px] font-semibold transition-colors cursor-pointer"
                    >
                      Retry
                    </button>
                  </div>
                ) : equipmentReviews.length === 0 ? (
                  <div className="py-3 text-slate-500 text-center italic text-xs">
                    No reviews yet for this equipment.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {equipmentReviews.map((rev) => (
                      <div key={rev.id} className="bg-white p-2.5 rounded-lg border border-slate-100 space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1">
                            <span className="text-amber-500 font-bold">{'★'.repeat(rev.rating)}</span>
                            <span className="text-slate-300">{'★'.repeat(5 - rev.rating)}</span>
                            <span className="text-slate-700 font-semibold ml-1.5">{rev.reviewerName}</span>
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
                          </span>
                        </div>
                        {rev.feedback && (
                          <p className="text-slate-600 italic">"{rev.feedback}"</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Conditional Mode Selector for equipment with bookingType='both' */}
          {isBothType && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Select Booking Preference *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label
                  className={`flex flex-col p-3 rounded-xl border cursor-pointer transition-all ${
                    bookingMode === 'instant'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="bookingMode"
                      value="instant"
                      checked={bookingMode === 'instant'}
                      onChange={() => setBookingMode('instant')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-xs">⚡ Instant Booking</span>
                  </div>
                  <span className="text-[11px] font-normal text-slate-500 mt-1">Instant confirmation</span>
                </label>

                <label
                  className={`flex flex-col p-3 rounded-xl border cursor-pointer transition-all ${
                    bookingMode === 'request'
                      ? 'bg-amber-50 border-amber-500 text-amber-900 font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="bookingMode"
                      value="request"
                      checked={bookingMode === 'request'}
                      onChange={() => setBookingMode('request')}
                      className="text-amber-600 focus:ring-amber-500"
                    />
                    <span className="text-xs">📝 Request Approval</span>
                  </div>
                  <span className="text-[11px] font-normal text-slate-500 mt-1">Owner manual review</span>
                </label>
              </div>
            </div>
          )}

          {/* Datetime-local Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Requested Start Date & Time *
            </label>
            <input
              type="datetime-local"
              required
              value={startDateTime}
              min={getInitialLocalDateTime()}
              onChange={(e) => setStartDateTime(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-slate-900 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
          </div>

          {/* Duration Counter */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Rental Duration ({priceUnit}s) *
            </label>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => setHoursOrDays((prev) => Math.max(1, prev - 1))}
                className="w-10 h-10 rounded-xl border border-slate-300 flex items-center justify-center text-slate-700 font-bold hover:bg-slate-100 transition-colors"
              >
                -
              </button>
              <input
                type="number"
                min="1"
                max="365"
                value={hoursOrDays}
                onChange={(e) => setHoursOrDays(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 text-center py-2 border border-slate-300 rounded-xl text-slate-900 font-bold text-base outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={() => setHoursOrDays((prev) => prev + 1)}
                className="w-10 h-10 rounded-xl border border-slate-300 flex items-center justify-center text-slate-700 font-bold hover:bg-slate-100 transition-colors"
              >
                +
              </button>
              <span className="text-sm text-slate-600 font-medium">
                Total {hoursOrDays} {priceUnit}{hoursOrDays > 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Special Requirements / Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Field Notes / Operator Request (Optional)
            </label>
            <textarea
              rows="2"
              maxLength={1000}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Specify farm location details or operator requirements..."
              className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-slate-900 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            ></textarea>
          </div>

          {/* Price Calculation Summary */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Total Estimated Cost</p>
              <p className="text-2xl font-black text-slate-900">
                ₹{totalPrice.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center space-x-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Submitting...</span>
                ) : (
                  <>
                    <span>Confirm Booking</span>
                    <span>→</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingModal;
