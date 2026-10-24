import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
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
 */
const MyBookingsModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const { token, isAuthenticated } = useAuth();

  const [bookings, setBookings] = useState([]);
  const [reviewedBookingIds, setReviewedBookingIds] = useState([]);
  const [reviewingBooking, setReviewingBooking] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [generalError, setGeneralError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [cancellingId, setCancellingId] = useState(null);

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
      setGeneralError(err.message || 'Failed to load your rental bookings.');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (isOpen) {
      if (!isAuthenticated || !token) {
        setGeneralError('Please log in to your farmer account to view your bookings.');
        setIsLoading(false);
      } else {
        loadBookings();
      }
      setSuccessMessage('');
      setCancellingId(null);
    }
  }, [isOpen, isAuthenticated, token, loadBookings]);

  const handleCancelBooking = async (bookingId) => {
    setCancellingId(bookingId);
    setGeneralError('');
    setSuccessMessage('');
    try {
      const response = await cancelBooking(bookingId, token);
      const updatedBooking = response.data;
      
      // Update local state with the returned cancelled booking
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? updatedBooking : b))
      );
      setSuccessMessage(`Booking #${bookingId} was cancelled successfully.`);
    } catch (err) {
      setGeneralError(err.message || 'Failed to cancel booking.');
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
        setGeneralError(res?.data?.reason || 'You have already reviewed this booking or are not eligible.');
      }
    } catch (e) {
      setReviewingBooking(booking);
    }
  };

  const getStatusBadge = (status) => {
    if (!status) return null;
    switch (status.toUpperCase()) {
      case 'APPROVED':
        return {
          label: '✅ Approved',
          styles: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        };
      case 'PENDING':
        return {
          label: '⏳ Pending Approval',
          styles: 'bg-amber-50 text-amber-700 border-amber-200',
        };
      case 'REJECTED':
        return {
          label: '❌ Rejected',
          styles: 'bg-rose-50 text-rose-700 border-rose-200',
        };
      case 'CANCELLED':
        return {
          label: '🚫 Cancelled',
          styles: 'bg-slate-100 text-slate-600 border-slate-300',
        };
      case 'COMPLETED':
        return {
          label: '🎉 Completed',
          styles: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        };
      default:
        return {
          label: status,
          styles: 'bg-slate-50 text-slate-700 border-slate-200',
        };
    }
  };

  const formatDateTime = (isoString) => {
    if (!isoString) return 'N/A';
    try {
      const date = new Date(isoString);
      return date.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return isoString;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-emerald-700 px-6 py-5 text-white relative shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-emerald-100 hover:text-white p-1 rounded-full hover:bg-emerald-600/50 transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <h2 className="text-xl font-bold tracking-tight">My Rental Bookings</h2>
          <p className="text-xs text-emerald-100 mt-1">
            Track equipment rental requests, status updates, and bookings history
          </p>
        </div>

        {/* Scroll Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-grow">
          {successMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-sm font-medium flex items-center justify-between">
              <span>{successMessage}</span>
              <button
                type="button"
                onClick={() => setSuccessMessage('')}
                className="text-emerald-600 hover:text-emerald-800 text-xs font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {generalError && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm font-medium flex items-center justify-between">
              <span>{generalError}</span>
              <button
                type="button"
                onClick={() => setGeneralError('')}
                className="text-red-600 hover:text-red-800 text-xs font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {isLoading ? (
            <div className="py-16 text-center text-slate-500 space-y-2">
              <div className="animate-spin inline-block w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full"></div>
              <p className="text-sm font-medium">Loading your rental bookings...</p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="py-12 text-center bg-slate-50 border border-dashed border-slate-300 rounded-2xl space-y-2">
              <span className="text-4xl">🚜</span>
              <h4 className="text-base font-bold text-slate-900">No rental bookings found</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                You haven't submitted any equipment rental requests yet. Browse equipment on the homepage to start renting!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => {
                const badge = getStatusBadge(booking.status);
                const isEligibleForCancel =
                  booking.status === 'PENDING' || booking.status === 'APPROVED';

                return (
                  <div
                    key={booking.id}
                    className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-emerald-300 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-5"
                  >
                    {/* Equipment Info & Image */}
                    <div className="flex items-start space-x-4 w-full md:w-auto">
                      <img
                        src={resolveImageUrl(booking.imageUrl)}
                        alt={booking.equipmentName}
                        className="w-20 h-20 rounded-xl object-cover border border-slate-200 shrink-0 bg-slate-100"
                      />
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                          <h3 className="text-base font-bold text-slate-900">
                            {booking.equipmentName}
                          </h3>
                          {badge && (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${badge.styles}`}>
                              {badge.label}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
                          <span>🏷️ {booking.equipmentCategory}</span>
                          <span>📍 {booking.location}</span>
                          <span>👤 Owner: {booking.ownerName}</span>
                        </div>

                        <div className="text-xs text-slate-500 space-y-0.5 pt-1">
                          <p>
                            🗓️ <strong className="text-slate-700">Start:</strong> {formatDateTime(booking.startDateTime)}
                          </p>
                          <p>
                            🏁 <strong className="text-slate-700">End:</strong> {formatDateTime(booking.endDateTime)} ({booking.duration} {booking.priceUnit}{booking.duration > 1 ? 's' : ''})
                          </p>
                          {booking.notes && (
                            <p className="italic text-slate-600 mt-1 bg-slate-50 p-2 rounded-md border border-slate-100">
                              💬 "{booking.notes}"
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Pricing & Actions */}
                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto border-t md:border-t-0 border-slate-100 pt-3 md:pt-0 shrink-0 space-y-2">
                      <div className="text-left md:text-right">
                        <p className="text-xs text-slate-500 font-medium">Total Cost</p>
                        <p className="text-xl font-black text-emerald-700">
                          ₹{booking.totalPrice ? booking.totalPrice.toLocaleString('en-IN') : '0'}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Rate: ₹{booking.rateSnapshot} / {booking.priceUnit}
                        </p>
                      </div>

                      {isEligibleForCancel && (
                        <button
                          type="button"
                          onClick={() => handleCancelBooking(booking.id)}
                          disabled={cancellingId === booking.id}
                          className="px-3 py-1.5 text-xs font-semibold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {cancellingId === booking.id ? 'Cancelling...' : 'Cancel Booking'}
                        </button>
                      )}

                      {/* Milestone 1: Owner Ratings & Feedback for COMPLETED bookings */}
                      {booking.status?.toUpperCase() === 'COMPLETED' && (
                        <div className="pt-1">
                          {reviewedBookingIds.includes(booking.id) ? (
                            <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <span>⭐</span>
                              <span>Reviewed</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleRateOwner(booking)}
                              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold text-amber-950 bg-amber-400 hover:bg-amber-500 rounded-lg shadow-xs transition-colors cursor-pointer"
                            >
                              <span>⭐</span>
                              <span>Rate Owner</span>
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

      {/* Review Modal */}
      {reviewingBooking && (
        <ReviewModal
          isOpen={Boolean(reviewingBooking)}
          booking={reviewingBooking}
          onClose={() => setReviewingBooking(null)}
          onSuccess={() => {
            setReviewedBookingIds((prev) =>
              prev.includes(reviewingBooking.id) ? prev : [...prev, reviewingBooking.id]
            );
            setSuccessMessage(`Review for booking #${reviewingBooking.id} submitted successfully!`);
            loadBookings();
          }}
        />
      )}
    </div>
  );
};

export default MyBookingsModal;
