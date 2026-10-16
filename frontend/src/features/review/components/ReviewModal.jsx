import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { submitReview } from '../../../services/reviewService';

const RATING_LABELS = {
  1: '1 Star — Poor experience',
  2: '2 Stars — Fair',
  3: '3 Stars — Good / Satisfactory',
  4: '4 Stars — Very Good',
  5: '5 Stars — Excellent equipment & service!',
};

/**
 * ReviewModal Component
 * Interactive modal allowing renters to rate equipment owners on completed rentals.
 */
const ReviewModal = ({ isOpen, booking, onClose, onSuccess }) => {
  if (!isOpen || !booking) return null;

  const { token } = useAuth();

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [validationError, setValidationError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const activeRating = hoverRating || rating;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    if (!rating || rating < 1 || rating > 5) {
      setValidationError('Please select a star rating (1 to 5 stars) before submitting.');
      return;
    }

    if (!token) {
      setValidationError('You must be logged in to submit a review.');
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
        : err.message || 'Failed to submit review. Please try again.';
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
            className="absolute top-4 right-4 text-emerald-100 hover:text-white p-1 rounded-full hover:bg-emerald-600/50 transition-colors disabled:opacity-50"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="flex items-center space-x-2">
            <span className="text-xl">⭐</span>
            <h2 className="text-xl font-bold tracking-tight">Rate Equipment & Owner</h2>
          </div>
          <p className="text-xs text-emerald-100 mt-1">
            How was your rental experience for {booking.equipmentName || `booking #${booking.id}`}?
          </p>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Booking Summary Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between text-xs">
            <div>
              <p className="font-bold text-slate-800 text-sm">{booking.equipmentName}</p>
              <p className="text-slate-500 mt-0.5">
                Owner: <span className="font-semibold text-slate-700">{booking.ownerName || 'Equipment Owner'}</span>
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
              Completed Rental
            </span>
          </div>

          {/* Success Banner */}
          {submitSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 text-sm font-semibold flex items-center space-x-2 animate-in fade-in">
              <span>🎉</span>
              <span>Thank you! Your rating and feedback have been submitted successfully.</span>
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
              Rating <span className="text-red-500">*</span>
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
                    disabled={isSubmitting || submitSuccess}
                    onClick={() => {
                      setRating(star);
                      setValidationError('');
                    }}
                    onMouseEnter={() => setHoverRating(star)}
                    className="p-1 text-3xl sm:text-4xl transition-transform hover:scale-115 focus:outline-hidden disabled:cursor-not-allowed"
                    aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                  >
                    <span
                      className={`transition-colors ${
                        isFilled ? 'text-amber-400 drop-shadow-xs' : 'text-slate-300'
                      }`}
                    >
                      ★
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Rating Description Label */}
            <p className="text-xs font-semibold h-4 text-slate-600 transition-opacity">
              {activeRating ? RATING_LABELS[activeRating] : 'Select from 1 to 5 stars'}
            </p>
          </div>

          {/* 2. Written Feedback (Optional) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="review-feedback" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Written Feedback <span className="text-slate-400 font-normal lowercase">(optional)</span>
              </label>
              <span className="text-[11px] text-slate-400">
                {feedback.length}/1000
              </span>
            </div>
            <textarea
              id="review-feedback"
              rows="3"
              maxLength={1000}
              disabled={isSubmitting || submitSuccess}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="How was the equipment condition? Was handover on time? Share any helpful details for other farmers..."
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden transition-all placeholder:text-slate-400 resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting || submitSuccess}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || submitSuccess}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <span>Submit Review</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewModal;
