`import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useLanguage } from '../../../context/LanguageContext';
import {
  fetchOwnerBookings,
  approveOwnerBooking,
  rejectOwnerBooking,
  completeOwnerBooking,
} from '../../../services/bookingService';
import { resolveImageUrl } from '../../../services/equipmentService';

const DEFAULT_FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1592861956120-e524fc739696?auto=format&fit=crop&w=600&q=80';

/**
 * OwnerDashboardModal Component
 * Interactive dashboard for equipment owners to inspect incoming rental requests,
 * filter by status, and approve, reject, or complete bookings with multilingual support.
 */
const OwnerDashboardModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const { token, isAuthenticated } = useAuth();
  const { t, formatCurrency, formatDateTime, getBookingStatusLabel, getCategoryLabel } = useLanguage();

  const [bookings, setBookings] = useState([]);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [generalError, setGeneralError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [processingAction, setProcessingAction] = useState(''); // 'approve' | 'reject' | 'complete'

  const statusFilters = [
    { id: 'ALL', label: t('booking.status.all') },
    { id: 'PENDING', label: t('booking.status.pending') },
    { id: 'APPROVED', label: t('booking.status.approved') },
    { id: 'REJECTED', label: t('booking.status.rejected') },
    { id: 'CANCELLED', label: t('booking.status.cancelled') },
    { id: 'COMPLETED', label: t('booking.status.completed') },
  ];

  const loadBookings = useCallback(async (filterToFetch = activeFilter) => {
    if (!token) return;
    setIsLoading(true);
    setGeneralError('');
    try {
      const response = await fetchOwnerBookings(token, filterToFetch);
      setBookings(response.data || []);
    } catch (err) {
      setGeneralError(err.message || t('common.serverError'));
    } finally {
      setIsLoading(false);
    }
  }, [token, activeFilter, t]);

  useEffect(() => {
    if (isOpen) {
      if (!isAuthenticated || !token) {
        setGeneralError(t('ownerDashboard.authDesc'));
        setIsLoading(false);
      } else {
        loadBookings(activeFilter);
      }
      setSuccessMessage('');
      setProcessingId(null);
      setProcessingAction('');
    }
  }, [isOpen, isAuthenticated, token, activeFilter, loadBookings, t]);

  const handleFilterChange = (filterId) => {
    setActiveFilter(filterId);
    setGeneralError('');
    setSuccessMessage('');
  };

  const handleApprove = async (bookingId) => {
    if (processingId) return;
    setProcessingId(bookingId);
    setProcessingAction('approve');
    setGeneralError('');
    setSuccessMessage('');

    try {
      await approveOwnerBooking(bookingId, token);
      setSuccessMessage(t('ownerDashboard.approveSuccess', { id: bookingId }));
      await loadBookings(activeFilter);
    } catch (err) {
      setGeneralError(err.message || t('common.serverError'));
    } finally {
      setProcessingId(null);
      setProcessingAction('');
    }
  };

  const handleReject = async (bookingId) => {
    if (processingId) return;
    setProcessingId(bookingId);
    setProcessingAction('reject');
    setGeneralError('');
    setSuccessMessage('');

    try {
      await rejectOwnerBooking(bookingId, token);
      setSuccessMessage(t('ownerDashboard.rejectSuccess', { id: bookingId }));
      await loadBookings(activeFilter);
    } catch (err) {
      setGeneralError(err.message || t('common.serverError'));
    } finally {
      setProcessingId(null);
      setProcessingAction('');
    }
  };

  const handleComplete = async (bookingId) => {
    if (processingId) return;
    setProcessingId(bookingId);
    setProcessingAction('complete');
    setGeneralError('');
    setSuccessMessage('');

    try {
      await completeOwnerBooking(bookingId, token);
      setSuccessMessage(t('ownerDashboard.completeSuccess', { id: bookingId }));
      await loadBookings(activeFilter);
    } catch (err) {
      setGeneralError(err.message || t('common.serverError'));
    } finally {
      setProcessingId(null);
      setProcessingAction('');
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
            className="absolute top-4 right-4 text-emerald-100 hover:text-white p-1 rounded-full hover:bg-emerald-600/50 transition-colors cursor-pointer"
            aria-label={t('common.close')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <h2 className="text-xl font-bold tracking-tight">{t('ownerDashboard.title')}</h2>
          <p className="text-xs text-emerald-100 mt-1">
            {t('ownerDashboard.subtitle')}
          </p>
        </div>

        {/* Filter Navigation Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-2.5 flex items-center space-x-2 overflow-x-auto shrink-0">
          <span className="text-xs font-semibold text-slate-500 mr-2 shrink-0">{t('ownerDashboard.statusFilter')}</span>
          {statusFilters.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => handleFilterChange(filter.id)}
              className={`px - 3 py - 1.5 rounded - lg text - xs font - semibold transition - all shrink - 0 cursor - pointer ${
  activeFilter === filter.id
    ? 'bg-emerald-600 text-white shadow-xs'
    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-100'
} `}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Scroll Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-grow">
          {successMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-sm font-medium flex items-center justify-between animate-in fade-in">
              <span>{successMessage}</span>
              <button
                type="button"
                onClick={() => setSuccessMessage('')}
                className="text-emerald-700 hover:underline text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {generalError && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm font-medium flex items-center justify-between animate-in fade-in">
              <span>{generalError}</span>
              <button
                type="button"
                onClick={() => setGeneralError('')}
                className="text-red-700 hover:underline text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {isLoading ? (
            <div className="py-16 text-center text-slate-500 space-y-2">
              <div className="animate-spin inline-block w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full"></div>
              <p className="text-sm font-medium">{t('ownerDashboard.loadingRequests')}</p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="py-12 text-center bg-slate-50 border border-dashed border-slate-300 rounded-2xl space-y-2">
              <span className="text-4xl">📋</span>
              <h4 className="text-base font-bold text-slate-900">
                {activeFilter === 'ALL'
                  ? t('ownerDashboard.noPendingRequests')
                  : t('ownerDashboard.noHistoryRecords', { status: getBookingStatusLabel(activeFilter) })}
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {t('ownerDashboard.noPendingRequestsDesc')}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => {
                const isPending = booking.status?.toUpperCase() === 'PENDING';
                const isApproved = booking.status?.toUpperCase() === 'APPROVED';

                return (
                  <div
                    key={booking.id}
                    className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-5 hover:border-emerald-300 transition-colors"
                  >
                    <div className="flex items-start space-x-4 w-full md:w-auto">
                      <img
                        src={resolveImageUrl(booking.imageUrl) || DEFAULT_FALLBACK_IMAGE}
                        alt={booking.equipmentName}
                        className="w-20 h-20 rounded-xl object-cover border border-slate-200 shrink-0 bg-slate-100"
                        onError={(e) => {
                          e.currentTarget.src = DEFAULT_FALLBACK_IMAGE;
                        }}
                      />
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2 flex-wrap">
                          <h3 className="text-base font-bold text-slate-900">{booking.equipmentName}</h3>
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold border bg-slate-50 border-slate-200 text-slate-700">
                            {getBookingStatusLabel(booking.status)}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
                          <span>🏷️ {booking.equipmentCategory ? getCategoryLabel(booking.equipmentCategory) : ''}</span>
                          <span>📍 {booking.location}</span>
                          <span>👤 {t('booking.renter')} <strong>{booking.renterName}</strong></span>
                          {booking.renterPhone && <span>📞 {booking.renterPhone}</span>}
                        </div>
                        <div className="text-xs text-slate-500 space-y-0.5 pt-1">
                          <p>
                            🗓️ <strong>{t('booking.start')}</strong> {formatDateTime(booking.startDateTime)}
                          </p>
                          <p>
                            🏁 <strong>{t('booking.end')}</strong> {formatDateTime(booking.endDateTime)} ({booking.duration} {booking.priceUnit === 'day' ? t('common.days') : t('common.hours')})
                          </p>
                          {booking.notes && (
                            <p className="italic text-slate-600 mt-1 bg-slate-50 p-2 rounded-md border border-slate-100">
                              💬 "{booking.notes}"
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto border-t md:border-t-0 border-slate-100 pt-3 md:pt-0 shrink-0 space-y-2">
                      <div className="text-left md:text-right">
                        <p className="text-xs text-slate-500 font-medium">{t('booking.totalPrice')}</p>
                        <p className="text-xl font-black text-emerald-700">
                          {formatCurrency(booking.totalPrice || 0)}
                        </p>
                      </div>

                      <div className="flex items-center space-x-2">
                        {isPending && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleApprove(booking.id)}
                              disabled={processingId === booking.id}
                              className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50 shadow-xs cursor-pointer"
                            >
                              {processingId === booking.id && processingAction === 'approve'
                                ? t('ownerDashboard.approving')
                                : t('ownerDashboard.approve')}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReject(booking.id)}
                              disabled={processingId === booking.id}
                              className="px-3.5 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                            >
                              {processingId === booking.id && processingAction === 'reject'
                                ? t('ownerDashboard.rejecting')
                                : t('ownerDashboard.reject')}
                            </button>
                          </>
                        )}

                        {isApproved && (
                          <button
                            type="button"
                            onClick={() => handleComplete(booking.id)}
                            disabled={processingId === booking.id}
                            className="px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 shadow-xs cursor-pointer"
                          >
                            {processingId === booking.id && processingAction === 'complete'
                              ? t('ownerDashboard.completing')
                              : t('ownerDashboard.markCompleted')}
                          </button>
                        )}
                      </div>
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
