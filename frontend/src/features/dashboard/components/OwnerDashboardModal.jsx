import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import {
  fetchOwnerBookings,
  approveOwnerBooking,
  rejectOwnerBooking,
  completeOwnerBooking,
} from '../../../services/bookingService';

const DEFAULT_FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1592861956120-e524fc739696?auto=format&fit=crop&w=600&q=80';

const STATUS_FILTERS = [
  { id: 'ALL', label: 'All' },
  { id: 'PENDING', label: 'Pending' },
  { id: 'APPROVED', label: 'Approved' },
  { id: 'REJECTED', label: 'Rejected' },
  { id: 'CANCELLED', label: 'Cancelled' },
  { id: 'COMPLETED', label: 'Completed' },
];

/**
 * OwnerDashboardModal Component
 * Interactive dashboard for equipment owners to inspect incoming rental requests,
 * filter by status, and approve, reject, or complete bookings.
 */
const OwnerDashboardModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const { token, isAuthenticated } = useAuth();

  const [bookings, setBookings] = useState([]);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [generalError, setGeneralError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [processingAction, setProcessingAction] = useState(''); // 'approve' | 'reject' | 'complete'

  const loadBookings = useCallback(async (filterToFetch = activeFilter) => {
    if (!token) return;
    setIsLoading(true);
    setGeneralError('');
    try {
      const response = await fetchOwnerBookings(token, filterToFetch);
      setBookings(response.data || []);
    } catch (err) {
      // Preserve existing list and show error if fetch/filter fails
      setGeneralError(err.message || 'Failed to load owner bookings.');
    } finally {
      setIsLoading(false);
    }
  }, [token, activeFilter]);

  useEffect(() => {
    if (isOpen) {
      if (!isAuthenticated || !token) {
        setGeneralError('Please log in to your farmer account to view your owner dashboard.');
        setIsLoading(false);
      } else {
        loadBookings(activeFilter);
      }
      setSuccessMessage('');
      setProcessingId(null);
      setProcessingAction('');
    }
  }, [isOpen, isAuthenticated, token, activeFilter, loadBookings]);

  const handleFilterChange = (filterId) => {
    setActiveFilter(filterId);
    setGeneralError('');
    setSuccessMessage('');
  };

  const handleApprove = async (bookingId) => {
    if (processingId) return; // Prevent duplicate submission
    setProcessingId(bookingId);
    setProcessingAction('approve');
    setGeneralError('');
    setSuccessMessage('');

    try {
      await approveOwnerBooking(bookingId, token);
      setSuccessMessage(`Booking #${bookingId} was approved successfully!`);
      // Refresh list from backend on success
      await loadBookings(activeFilter);
    } catch (err) {
      setGeneralError(err.message || 'Failed to approve booking.');
    } finally {
      setProcessingId(null);
      setProcessingAction('');
    }
  };

  const handleReject = async (bookingId) => {
    if (processingId) return; // Prevent duplicate submission
    setProcessingId(bookingId);
    setProcessingAction('reject');
    setGeneralError('');
    setSuccessMessage('');

    try {
      await rejectOwnerBooking(bookingId, token);
      setSuccessMessage(`Booking #${bookingId} was rejected.`);
      // Refresh list from backend on success
      await loadBookings(activeFilter);
    } catch (err) {
      setGeneralError(err.message || 'Failed to reject booking.');
    } finally {
      setProcessingId(null);
      setProcessingAction('');
    }
  };

  const handleComplete = async (bookingId) => {
    if (processingId) return; // Prevent duplicate submission
    setProcessingId(bookingId);
    setProcessingAction('complete');
    setGeneralError('');
    setSuccessMessage('');

    try {
      await completeOwnerBooking(bookingId, token);
      setSuccessMessage(`Booking #${bookingId} marked as completed!`);
      // Refresh list from backend on success
      await loadBookings(activeFilter);
    } catch (err) {
      setGeneralError(err.message || 'Failed to mark booking as completed.');
    } finally {
      setProcessingId(null);
      setProcessingAction('');
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
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]"
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
          <h2 className="text-xl font-bold tracking-tight">Owner Dashboard</h2>
          <p className="text-xs text-emerald-100 mt-1">
            Review and manage bookings for your equipment
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex items-center gap-2 overflow-x-auto shrink-0">
          <span className="text-xs font-semibold text-slate-500 mr-2 shrink-0">Filter:</span>
          {STATUS_FILTERS.map((filter) => {
            const isActive = activeFilter === filter.id;
            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => handleFilterChange(filter.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>

        {/* Scroll Body */}
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
                onClick={() => loadBookings(activeFilter)}
                className="text-red-700 hover:text-red-900 text-xs font-bold underline ml-3"
              >
                Retry
              </button>
              <button
                type="button"
                onClick={() => setGeneralError('')}
                className="text-red-600 hover:text-red-800 text-xs font-bold ml-2"
              >
                ✕
              </button>
            </div>
          )}

          {isLoading ? (
            <div className="py-16 text-center text-slate-500 space-y-2">
              <div className="animate-spin inline-block w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full"></div>
              <p className="text-sm font-medium">Loading incoming rental bookings...</p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="py-12 text-center bg-slate-50 border border-dashed border-slate-300 rounded-2xl space-y-2">
              <span className="text-4xl">🚜</span>
              <h4 className="text-base font-bold text-slate-900">
                No bookings found {activeFilter !== 'ALL' ? `for "${activeFilter.toLowerCase()}" status` : ''}
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No incoming rental requests match the selected filter. When farmers request to rent your equipment, requests will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => {
                const badge = getStatusBadge(booking.status);
                const isPending = booking.status === 'PENDING';
                const isApproved = booking.status === 'APPROVED';
                const isItemBusy = processingId === booking.id;

                return (
                  <div
                    key={booking.id}
                    className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-emerald-300 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-5"
                  >
                    {/* Equipment & Renter Info */}
                    <div className="flex items-start space-x-4 w-full md:w-auto">
                      <img
                        src={booking.imageUrl && booking.imageUrl.trim() ? booking.imageUrl : DEFAULT_FALLBACK_IMAGE}
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
                          <span>👤 Renter: <strong>{booking.renterName}</strong></span>
                          {booking.renterPhone && (
                            <span>📞 {booking.renterPhone}</span>
                          )}
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
                        <p className="text-xs text-slate-500 font-medium">Total Price</p>
                        <p className="text-xl font-black text-emerald-700">
                          ₹{booking.totalPrice ? booking.totalPrice.toLocaleString('en-IN') : '0'}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Rate: ₹{booking.rateSnapshot} / {booking.priceUnit}
                        </p>
                      </div>

                      {/* Action Buttons based on status */}
                      {isPending && (
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => handleApprove(booking.id)}
                            disabled={isItemBusy}
                            className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50 shadow-xs"
                          >
                            {isItemBusy && processingAction === 'approve' ? 'Approving...' : 'Approve'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReject(booking.id)}
                            disabled={isItemBusy}
                            className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {isItemBusy && processingAction === 'reject' ? 'Rejecting...' : 'Reject'}
                          </button>
                        </div>
                      )}

                      {isApproved && (
                        <button
                          type="button"
                          onClick={() => handleComplete(booking.id)}
                          disabled={isItemBusy}
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 shadow-xs"
                        >
                          {isItemBusy && processingAction === 'complete' ? 'Completing...' : 'Mark Completed'}
                        </button>
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
  );
};

export default OwnerDashboardModal;
