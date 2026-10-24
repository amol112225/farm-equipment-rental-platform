import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useLanguage } from '../../../context/LanguageContext';
import { submitReview } from '../../../services/reviewService';

/**
 * ReviewModal Component
 * Interactive modal allowing renters to rate equipment owners on completed rentals.
 * Fully translated and integrated with LanguageContext.
 */
const ReviewModal = ({ isOpen, booking, onClose, onSuccess }) => {
  if (!isOpen || !booking) return null;

  const { token } = useAuth();
  const { t } = useLanguage();

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [validationError, setValidationError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const activeRating = hoverRating || rating;

  const ratingDescriptions = {
    1: t('reviews.star1'),
    2: t('reviews.star2'),
    3: t('reviews.star3'),
    4: t('reviews.star4'),
    5: t('reviews.star5'),
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    if (!rating || rating < 1 || rating > 5) {
      setValidationError(t('reviews.validationSelectStar'));
      return;
    }

    if (!token) {
      setValidationError(t('reviews.validationLoginRequired'));
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        bookingId: booking.id,
        rating: Number(rating),
        feedback: feedback.trim() ? feedback.trim() : null,
      };
      if (booking.equipmentId) {
        payload.equipmentId = booking.equipmentId;
      }

      const response = await submitReview(payload, token);
      setSubmitSuccess(true);

      setTimeout(() => {
        if (onSuccess) {
          onSuccess(response.data || payload);
        }
        onClose();
      }, 1200);
    } catch (err) {
      const msg = err.errors
        ? Object.values(err.errors).join(', ')
        : err.message || t('reviews.noReviewsEquipment');
      setValidationError(msg);
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-700 to-emerald-800 px-6 py-5 text-white relative">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="absolute top-4 right-4 text-emerald-100 hover:text-white p-1 rounded-full hover:bg-emerald-600/50 transition-colors disabled:opacity-50 cursor-pointer"
            aria-label={t('common.close')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="flex items-center space-x-2">
            <span className="text-xl">⭐</span>
            <h2 className="text-xl font-bold tracking-tight">{t('reviews.rateEquipmentAndOwner')}</h2>
          </div>
          <p className="text-xs text-emerald-100 mt-1">
            {t('reviews.modalSubtitle', {
              equipment: booking.equipmentName || `#${booking.id}`,
            })}
          </p>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Booking Summary Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between text-xs">
            <div>
              <p className="font-bold text-slate-800 text-sm">{booking.equipmentName}</p>
              <p className="text-slate-500 mt-0.5">
                {t('reviews.ownerLabel')}{' '}
                <span className="font-semibold text-slate-700">
                  {booking.ownerName || t('equipment.verifiedEquipmentOwner')}
                </span>
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
              {t('reviews.completedRentalBadge')}
            </span>
          </div>

          {/* Success Banner */}
          {submitSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 text-sm font-semibold flex items-center space-x-2 animate-in fade-in">
              <span>🎉</span>
              <span>{t('reviews.submitSuccess')}</span>
            </div>
          )}

          {/* Validation & Error Alert */}
          {validationError && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs font-medium flex items-center space-x-2">
              <span className="text-red-500 font-bold">⚠️</span>
              <span>{validationError}</span>
            </div>
          )}

          {/* 1. Star Rating Selection */}
          <div className="space-y-2 text-center py-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              {t('reviews.ratingLabel')}
            </label>

            <div
              className="flex items-center justify-center space-x-2"
              onMouseLeave={() => setHoverRating(0)}
            >
              {[1, 2, 3, 4, 5].map((star) => {
                const isFilled = star <= activeRating;
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    className="p-1.5 focus:outline-none transition-transform hover:scale-125 cursor-pointer"
                    aria-label={`${star} Star`}
                  >
                    <svg
                      className={`w-9 h-9 transition-colors ${
                        isFilled ? 'text-amber-400 fill-amber-400' : 'text-slate-300 fill-transparent'
                      }`}
                      stroke="currentColor"
                      strokeWidth="1.5"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                      />
                    </svg>
                  </button>
                );
              })}
            </div>

            {/* Dynamic Label for Hovered/Selected Star */}
            <p className="text-xs font-semibold text-slate-600 min-h-[1.25rem]">
              {activeRating > 0 ? ratingDescriptions[activeRating] : ''}
            </p>
          </div>

          {/* 2. Feedback Textarea */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              {t('reviews.feedbackLabel')}
            </label>
            <textarea
              rows="3"
              maxLength={1000}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder={t('reviews.feedbackPlaceholder')}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-slate-900 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            ></textarea>
            <p className="text-[11px] text-slate-400 text-right">
              {feedback.length}/1000
            </p>
          </div>

          {/* Modal Actions */}
          <div className="pt-2 flex items-center justify-end space-x-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || submitSuccess}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors disabled:opacity-50 flex items-center space-x-1.5 cursor-pointer"
            >
              <span>{isSubmitting ? t('reviews.submitting') : t('reviews.submitReview')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewModal;
