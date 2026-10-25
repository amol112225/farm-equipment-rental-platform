import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useLanguage } from '../../../context/LanguageContext';
import { fetchMyBookings, cancelBooking } from '../../../services/bookingService';
import { fetchMyReviewedBookingIds, checkReviewEligibility } from '../../../services/reviewService';
import { resolveImageUrl } from '../../../services/equipmentService';
import ReviewModal from '../../review/components/ReviewModal';

const DEFAULT_FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1592861956120-e524fc739696?auto=format&fit=crop&w=600&q=80';

/**
 * MyBookingsModal Component
 * Interactive modal displaying the authenticated farmer's rental booking history,
 * status badges, cancellation action, and owner rating review modal for completed rentals.
 * Fully translated with LanguageContext.
 */
const MyBookingsModal = ({ isOpen, onClose }) => {
  const { token, isAuthenticated } = useAuth();
  const { t, formatCurrency, formatDateTime, getBookingStatusLabel, getCategoryLabel } = useLanguage();

  const [bookings, setBookings] = useState([]);
  const [reviewedBookingIds, setReviewedBookingIds] = useState([]);
  const [reviewingBooking, setReviewingBooking] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [generalError, setGeneralError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [cancellingId, setCancellingId] = useState(null);
  const [confirmCancelId, setConfirmCancelId] = useState(null);

  const loadBookings = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setGeneralError('');
    try {
      const [bookingsRes, reviewedRes] = await Promise.allSettled([
        fetchMyBookings(token),
        fetchMyReviewedBookingIds(token),
      ]);

      if (bookingsRes.status === 'fulfilled') {
        setBookings(bookingsRes.value.data || []);
      } else {
        throw bookingsRes.reason;
      }

      if (reviewedRes.status === 'fulfilled') {
        setReviewedBookingIds(reviewedRes.value.data || []);
      }
    } catch (err) {
      setGeneralError(err.message || t('common.serverError'));
    } finally {
      setIsLoading(false);
    }
  }, [token, t]);

  useEffect(() => {
    if (isOpen) {
      if (!isAuthenticated || !token) {
        setGeneralError(t('renterDashboard.authDesc'));
        setIsLoading(false);
      } else {
        loadBookings();
      }
      setSuccessMessage('');
      setCancellingId(null);
      setConfirmCancelId(null);
    }
  }, [isOpen, isAuthenticated, token, loadBookings, t]);

  const handleCancelBooking = async (bookingId) => {
    setCancellingId(bookingId);
    setGeneralError('');
    setSuccessMessage('');
    try {
      const response = await cancelBooking(bookingId, token);
      const updatedBooking = response.data;
      
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? updatedBooking : b))
      );
      setSuccessMessage(t('renterDashboard.cancelSuccess', { id: bookingId }));
      setConfirmCancelId(null);
    } catch (err) {
      setGeneralError(err.message || t('booking.failedToCancel'));
    } finally {
      setCancellingId(null);
    }
  };

  const handleRateOwner = async (booking) => {
    setGeneralError('');
    try {
      const res = await checkReviewEligibility(booking.id, token);
      if (res?.data?.eligible) {
        setReviewingBooking(booking);
      } else {
        setReviewedBookingIds((prev) => (prev.includes(booking.id) ? prev : [...prev, booking.id]));
        setGeneralError(res?.data?.reason || t('reviews.alreadyReviewed'));
      }
    } catch (e) {
      setReviewingBooking(booking);
    }
  };

  const handleReviewSuccess = () => {
    if (reviewingBooking) {
      setReviewedBookingIds((prev) => [...prev, reviewingBooking.id]);
    }
    setReviewingBooking(null);
    setSuccessMessage(t('reviews.submitSuccess'));
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
        <div
          className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-emerald-700 px-6 py-5 text-white flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight">{t('renterDashboard.title')}</h2>
              <p className="text-xs text-emerald-100 mt-0.5">
                {bookings.length} {t('renterDashboard.title')}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-emerald-100 hover:text-white p-1.5 rounded-full hover:bg-emerald-600/50 transition-colors cursor-pointer"
              aria-label={t('common.close')}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content Body */}
          <div className="p-6 overflow-y-auto space-y-4">
            {successMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-semibold flex items-center justify-between">
                <span>{successMessage}</span>
                <button
                  type="button"
                  onClick={() => setSuccessMessage('')}
                  className="text-emerald-700 hover:underline cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            {generalError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-xs font-medium flex items-center justify-between">
                <span>{generalError}</span>
                <button
                  type="button"
                  onClick={() => setGeneralError('')}
                  className="text-red-700 hover:underline cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            {isLoading ? (
              <div className="py-16 text-center text-slate-500 space-y-2">
                <div className="animate-spin inline-block w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full"></div>
                <p className="text-sm font-medium">{t('renterDashboard.loadingBookings')}</p>
              </div>
            ) : bookings.length === 0 ? (
              <div className="py-12 text-center bg-slate-50 border border-dashed border-slate-300 rounded-2xl space-y-3">
                <span className="text-4xl">🌾</span>
                <h4 className="text-base font-bold text-slate-900">{t('renterDashboard.noBookingsYet')}</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {t('renterDashboard.noBookingsYetDesc')}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => {
                  const isPending = booking.status?.toUpperCase() === 'PENDING';
                  const isApproved = booking.status?.toUpperCase() === 'APPROVED';
                  const isCompleted = booking.status?.toUpperCase() === 'COMPLETED';
                  const canCancel = isPending || isApproved;
                  const hasReviewed = reviewedBookingIds.includes(booking.id);

                  return (
                    <div
                      key={booking.id}
                      className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs hover:border-emerald-300 transition-colors"
                    >
                      <div className="flex items-start space-x-3">
                        <img
                          src={resolveImageUrl(booking.imageUrl) || DEFAULT_FALLBACK_IMAGE}
                          alt={booking.equipmentName}
                          className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0 bg-slate-100"
                          onError={(e) => {
                            e.currentTarget.src = DEFAULT_FALLBACK_IMAGE;
                          }}
                        />
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2 flex-wrap">
                            <h4 className="text-base font-bold text-slate-900">{booking.equipmentName}</h4>
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full border bg-slate-50 border-slate-200 text-slate-700">
                              {getBookingStatusLabel(booking.status)}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 space-y-0.5">
                            <p>🏷️ {booking.equipmentCategory ? getCategoryLabel(booking.equipmentCategory) : ''} • 📍 {booking.location}</p>
                            <p>
                              🗓️ {formatDateTime(booking.startDateTime)} → {formatDateTime(booking.endDateTime)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Right: Price & Actions */}
                      <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto border-t sm:border-t-0 border-slate-100 pt-2 sm:pt-0 space-y-1">
                        <div className="text-left sm:text-right">
                          <p className="text-xs text-slate-500 font-medium">{t('booking.rentalTotal')}</p>
                          <p className="text-lg font-extrabold text-emerald-700">
                            {formatCurrency(booking.totalPrice || 0)}
                          </p>
                        </div>

                        {canCancel && (
                          <div>
                            {confirmCancelId === booking.id ? (
                              <div className="flex items-center space-x-2 bg-red-50 p-1.5 rounded-lg border border-red-200">
                                <span className="text-xs text-red-800 font-semibold">{t('renterDashboard.cancelBookingQuestion')}</span>
                                <button
                                  type="button"
                                  onClick={() => handleCancelBooking(booking.id)}
                                  disabled={cancellingId === booking.id}
                                  className="px-2 py-1 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded cursor-pointer"
                                >
                                  {cancellingId === booking.id ? t('renterDashboard.cancelling') : t('renterDashboard.yesCancel')}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmCancelId(null)}
                                  className="px-2 py-1 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded cursor-pointer"
                                >
                                  {t('renterDashboard.back')}
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmCancelId(booking.id)}
                                className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                              >
                                {t('renterDashboard.cancelBooking')}
                              </button>
                            )}
                          </div>
                        )}

                        {isCompleted && (
                          <div>
                            {hasReviewed ? (
                              <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                <span>⭐</span>
                                <span>{t('reviews.reviewedBadge')}</span>
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleRateOwner(booking)}
                                className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-bold text-amber-950 bg-amber-400 hover:bg-amber-500 rounded-lg shadow-xs transition-colors cursor-pointer"
                              >
                                <span>⭐</span>
                                <span>{t('reviews.rateOwnerButton')}</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {reviewingBooking && (
        <ReviewModal
          isOpen={Boolean(reviewingBooking)}
          booking={reviewingBooking}
          onClose={() => setReviewingBooking(null)}
          onSuccess={handleReviewSuccess}
        />
      )}
    </>
  );
};

export default MyBookingsModal;
