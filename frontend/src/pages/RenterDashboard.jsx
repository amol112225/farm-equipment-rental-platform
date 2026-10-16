import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Navbar from '../components/layout/Navbar';
import { useAuth } from '../context/AuthContext';
import { fetchMyBookings, cancelBooking } from '../services/bookingService';
import { fetchMyReviewedBookingIds, checkReviewEligibility } from '../services/reviewService';
import ReviewModal from '../features/review/components/ReviewModal';

const DEFAULT_FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1592861956120-e524fc739696?auto=format&fit=crop&w=600&q=80';

/**
 * Dedicated Renter Dashboard Page Component
 * Allows authenticated farmers to track equipment requests, upcoming rentals,
 * rental history, and completed rental spending.
 */
const RenterDashboard = ({ onNavigateToHome, onNavigateToOwnerDashboard }) => {
  const { token, isAuthenticated } = useAuth();

  // Active Tab: 'all' | 'upcoming' | 'history' | 'spending'
  const [activeTab, setActiveTab] = useState('all');

  // History sub-filter: 'ALL' | 'COMPLETED' | 'REJECTED' | 'CANCELLED'
  const [historySubFilter, setHistorySubFilter] = useState('ALL');

  // Bookings state
  const [bookings, setBookings] = useState([]);
  const [reviewedBookingIds, setReviewedBookingIds] = useState([]);
  const [reviewingBooking, setReviewingBooking] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Cancellation state
  const [cancellingId, setCancellingId] = useState(null);
  const [confirmCancelId, setConfirmCancelId] = useState(null);

  /**
   * Load renter's bookings from backend API
   */
  const loadBookings = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setErrorMessage('');
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
      setErrorMessage(err.message || 'Failed to load your rental bookings.');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (isAuthenticated && token) {
      loadBookings();
    }
  }, [isAuthenticated, token, loadBookings]);

  // Derived Booking Categories & Metrics
  const totalRequestsCount = bookings.length;
  const pendingBookings = useMemo(() => bookings.filter((b) => b.status?.toUpperCase() === 'PENDING'), [bookings]);
  const rejectedBookings = useMemo(() => bookings.filter((b) => b.status?.toUpperCase() === 'REJECTED'), [bookings]);
  const completedBookings = useMemo(() => bookings.filter((b) => b.status?.toUpperCase() === 'COMPLETED'), [bookings]);
  const cancelledBookings = useMemo(() => bookings.filter((b) => b.status?.toUpperCase() === 'CANCELLED'), [bookings]);

  // Upcoming Rentals: Status === 'APPROVED' AND startDateTime is in the future
  const upcomingRentals = useMemo(() => {
    const now = new Date();
    return bookings.filter((b) => {
      if (b.status?.toUpperCase() !== 'APPROVED') return false;
      if (!b.startDateTime) return false;
      try {
        return new Date(b.startDateTime) > now;
      } catch (e) {
        return false;
      }
    });
  }, [bookings]);

  // Historical Bookings: COMPLETED, REJECTED, or CANCELLED
  const historyBookings = useMemo(() => {
    return bookings.filter((b) => {
      const s = b.status?.toUpperCase();
      return s === 'COMPLETED' || s === 'REJECTED' || s === 'CANCELLED';
    });
  }, [bookings]);

  const filteredHistory = useMemo(() => {
    if (historySubFilter === 'ALL') return historyBookings;
    return historyBookings.filter((b) => b.status?.toUpperCase() === historySubFilter);
  }, [historyBookings, historySubFilter]);

  // Completed Rental Spend: Sum of totalPrice for all COMPLETED bookings
  const completedRentalSpend = useMemo(() => {
    return completedBookings.reduce((sum, b) => sum + (Number(b.totalPrice) || 0), 0);
  }, [completedBookings]);

  // Monthly Spending Breakdown derived from rental start date
  const monthlySpendingBreakdown = useMemo(() => {
    const groups = {};
    completedBookings.forEach((b) => {
      let monthYear = 'Undated';
      if (b.startDateTime) {
        try {
          const d = new Date(b.startDateTime);
          monthYear = d.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
        } catch (e) {
          monthYear = 'Undated';
        }
      }
      if (!groups[monthYear]) {
        groups[monthYear] = { monthYear, total: 0, count: 0, items: [] };
      }
      groups[monthYear].total += Number(b.totalPrice) || 0;
      groups[monthYear].count += 1;
      groups[monthYear].items.push(b);
    });
    return Object.values(groups);
  }, [completedBookings]);

  // Cancellation Handler
  const handleCancelBooking = async (bookingId) => {
    setCancellingId(bookingId);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const response = await cancelBooking(bookingId, token);
      const updated = response.data;
      setBookings((prev) => prev.map((b) => (b.id === bookingId ? updated : b)));
      setSuccessMessage(`Booking #${bookingId} was successfully cancelled.`);
      setConfirmCancelId(null);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to cancel booking.');
    } finally {
      setCancellingId(null);
    }
  };

  const handleRateOwner = async (booking) => {
    setErrorMessage('');
    try {
      const res = await checkReviewEligibility(booking.id, token);
      if (res?.data?.eligible) {
        setReviewingBooking(booking);
      } else {
        setReviewedBookingIds((prev) => (prev.includes(booking.id) ? prev : [...prev, booking.id]));
        setErrorMessage(res?.data?.reason || 'You have already reviewed this booking or are not eligible.');
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
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Navbar Header */}
      <Navbar
        currentPage="my-bookings"
        onNavigateToHome={onNavigateToHome}
        onOpenMyBookings={() => {}}
        onOpenOwnerDashboard={onNavigateToOwnerDashboard}
      />

      {/* Main Page Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow w-full space-y-6">
        {/* Back Link & Header Title */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={onNavigateToHome}
            className="inline-flex items-center text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
          >
            ← Back to Browse Equipment
          </button>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                My Bookings
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                Track your equipment requests, upcoming rentals, and rental spending.
              </p>
            </div>
            <button
              type="button"
              onClick={onNavigateToHome}
              className="inline-flex items-center justify-center px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors shrink-0 space-x-1.5"
            >
              <span>🔍 Rent More Machinery</span>
            </button>
          </div>
        </div>

        {/* Logged Out Banner */}
        {!isAuthenticated ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center max-w-lg mx-auto space-y-4 shadow-xs">
            <div className="text-4xl">🔐</div>
            <h3 className="text-lg font-bold text-slate-900">Authentication Required</h3>
            <p className="text-xs text-slate-600">
              Please log in to your farmer account to view your bookings, upcoming rentals, and rental spending summary.
            </p>
            <button
              type="button"
              onClick={onNavigateToHome}
              className="inline-flex items-center px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
            >
              Go to Home & Log In
            </button>
          </div>
        ) : (
          <>
            {/* Feedback Banners */}
            {successMessage && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm font-medium flex items-center justify-between animate-in fade-in">
                <span>{successMessage}</span>
                <button
                  type="button"
                  onClick={() => setSuccessMessage('')}
                  className="text-emerald-600 hover:text-emerald-800 text-xs font-bold ml-4"
                >
                  ✕
                </button>
              </div>
            )}

            {errorMessage && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm font-medium flex items-center justify-between animate-in fade-in">
                <span>{errorMessage}</span>
                <button
                  type="button"
                  onClick={() => setErrorMessage('')}
                  className="text-red-600 hover:text-red-800 text-xs font-bold ml-4"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Dashboard Navigation Tabs */}
            <div className="border-b border-slate-200 flex space-x-2 sm:space-x-4 overflow-x-auto pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`py-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-colors whitespace-nowrap flex items-center space-x-2 ${
                  activeTab === 'all'
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>📋 All Bookings</span>
                <span className="px-2 py-0.5 text-[11px] rounded-full bg-slate-100 text-slate-700 font-semibold">
                  {totalRequestsCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('upcoming')}
                className={`py-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-colors whitespace-nowrap flex items-center space-x-2 ${
                  activeTab === 'upcoming'
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>🗓️ Upcoming Rentals</span>
                {upcomingRentals.length > 0 && (
                  <span className="px-2 py-0.5 text-[11px] rounded-full bg-emerald-100 text-emerald-800 font-bold">
                    {upcomingRentals.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={`py-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-colors whitespace-nowrap flex items-center space-x-2 ${
                  activeTab === 'history'
                    ? 'border-slate-800 text-slate-900'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>📜 Rental History</span>
                <span className="px-2 py-0.5 text-[11px] rounded-full bg-slate-100 text-slate-700 font-semibold">
                  {historyBookings.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('spending')}
                className={`py-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-colors whitespace-nowrap flex items-center space-x-2 ${
                  activeTab === 'spending'
                    ? 'border-indigo-600 text-indigo-700'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>💰 Spending Summary</span>
                <span className="px-2 py-0.5 text-[11px] rounded-full bg-indigo-50 text-indigo-700 font-semibold">
                  ₹{completedRentalSpend.toLocaleString('en-IN')}
                </span>
              </button>
            </div>

            {/* TAB 1: ALL BOOKINGS */}
            {activeTab === 'all' && (
              <div className="space-y-4">
                {isLoading ? (
                  <div className="py-16 text-center text-slate-500 space-y-2">
                    <div className="animate-spin inline-block w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full"></div>
                    <p className="text-sm font-medium">Loading your bookings...</p>
                  </div>
                ) : bookings.length === 0 ? (
                  <div className="py-12 text-center bg-white border border-dashed border-slate-300 rounded-2xl space-y-3">
                    <span className="text-4xl">🚜</span>
                    <h4 className="text-base font-bold text-slate-900">No rental bookings yet</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      You haven't requested any farm machinery yet. Browse available tractors and equipment to place a request.
                    </p>
                    <button
                      type="button"
                      onClick={onNavigateToHome}
                      className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                    >
                      Browse Equipment
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bookings.map((booking) => {
                      const badge = getStatusBadge(booking.status);
                      const isPending = booking.status === 'PENDING';
                      const isApproved = booking.status === 'APPROVED';
                      const canCancel = isPending || isApproved;

                      return (
                        <div
                          key={booking.id}
                          className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-5 hover:border-emerald-300 transition-colors"
                        >
                          <div className="flex items-start space-x-4 w-full md:w-auto">
                            <img
                              src={booking.imageUrl && booking.imageUrl.trim() ? booking.imageUrl : DEFAULT_FALLBACK_IMAGE}
                              alt={booking.equipmentName}
                              className="w-20 h-20 rounded-xl object-cover border border-slate-200 shrink-0 bg-slate-100"
                            />
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2 flex-wrap">
                                <h3 className="text-base font-bold text-slate-900">{booking.equipmentName}</h3>
                                {badge && (
                                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${badge.styles}`}>
                                    {badge.label}
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
                                <span>🏷️ {booking.equipmentCategory}</span>
                                <span>📍 {booking.location}</span>
                              </div>
                              <div className="text-xs text-slate-500 space-y-0.5 pt-1">
                                <p>🗓️ <strong>Start:</strong> {formatDateTime(booking.startDateTime)}</p>
                                <p>🏁 <strong>End:</strong> {formatDateTime(booking.endDateTime)} ({booking.duration} {booking.priceUnit}{booking.duration > 1 ? 's' : ''})</p>
                                {booking.notes && (
                                  <p className="italic text-slate-600 mt-1 bg-slate-50 p-2 rounded-md border border-slate-100">
                                    💬 Notes: "{booking.notes}"
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto border-t md:border-t-0 border-slate-100 pt-3 md:pt-0 shrink-0 space-y-2">
                            <div className="text-left md:text-right">
                              <p className="text-xs text-slate-500 font-medium">Rental Total</p>
                              <p className="text-xl font-black text-emerald-700">
                                ₹{booking.totalPrice ? booking.totalPrice.toLocaleString('en-IN') : '0'}
                              </p>
                            </div>

                            {/* Cancel Booking Action */}
                            {canCancel && (
                              <div>
                                {confirmCancelId === booking.id ? (
                                  <div className="flex items-center space-x-2 bg-red-50 p-1.5 rounded-lg border border-red-200">
                                    <span className="text-xs text-red-800 font-semibold">Cancel booking?</span>
                                    <button
                                      type="button"
                                      onClick={() => handleCancelBooking(booking.id)}
                                      disabled={cancellingId === booking.id}
                                      className="px-2.5 py-1 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded transition-colors disabled:opacity-50"
                                    >
                                      {cancellingId === booking.id ? 'Cancelling...' : 'Yes, Cancel'}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setConfirmCancelId(null)}
                                      className="px-2 py-1 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded"
                                    >
                                      Back
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setConfirmCancelId(booking.id)}
                                    className="px-3.5 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
                                  >
                                    Cancel Booking
                                  </button>
                                )}
                              </div>
                            )}

                            {/* Milestone 1: Rate Owner for COMPLETED bookings */}
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
            )}

            {/* TAB 2: UPCOMING RENTALS */}
            {activeTab === 'upcoming' && (
              <div className="space-y-4">
                {isLoading ? (
                  <div className="py-16 text-center text-slate-500 space-y-2">
                    <div className="animate-spin inline-block w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full"></div>
                    <p className="text-sm font-medium">Loading upcoming rentals...</p>
                  </div>
                ) : upcomingRentals.length === 0 ? (
                  <div className="py-12 text-center bg-white border border-dashed border-slate-300 rounded-2xl space-y-2">
                    <span className="text-4xl">🗓️</span>
                    <h4 className="text-base font-bold text-slate-900">No upcoming rentals scheduled</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Approved rentals with future start dates will appear here once confirmed by machinery owners.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingRentals.map((booking) => (
                      <div
                        key={booking.id}
                        className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-5 hover:border-emerald-300 transition-colors"
                      >
                        <div className="flex items-start space-x-4 w-full md:w-auto">
                          <img
                            src={booking.imageUrl && booking.imageUrl.trim() ? booking.imageUrl : DEFAULT_FALLBACK_IMAGE}
                            alt={booking.equipmentName}
                            className="w-20 h-20 rounded-xl object-cover border border-slate-200 shrink-0 bg-slate-100"
                          />
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2 flex-wrap">
                              <h3 className="text-base font-bold text-slate-900">{booking.equipmentName}</h3>
                              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                ✅ Approved • Upcoming
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
                              <span>🏷️ {booking.equipmentCategory}</span>
                              <span>📍 {booking.location}</span>
                            </div>
                            <div className="text-xs text-slate-500 space-y-0.5 pt-1">
                              <p className="font-semibold text-slate-800">
                                🗓️ Starts: {formatDateTime(booking.startDateTime)}
                              </p>
                              <p>🏁 Ends: {formatDateTime(booking.endDateTime)} ({booking.duration} {booking.priceUnit}{booking.duration > 1 ? 's' : ''})</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto border-t md:border-t-0 border-slate-100 pt-3 md:pt-0 shrink-0 space-y-2">
                          <div className="text-left md:text-right">
                            <p className="text-xs text-slate-500 font-medium">Rental Total</p>
                            <p className="text-xl font-black text-emerald-700">
                              ₹{booking.totalPrice ? booking.totalPrice.toLocaleString('en-IN') : '0'}
                            </p>
                          </div>
                          <div>
                            {confirmCancelId === booking.id ? (
                              <div className="flex items-center space-x-2 bg-red-50 p-1.5 rounded-lg border border-red-200">
                                <span className="text-xs text-red-800 font-semibold">Cancel?</span>
                                <button
                                  type="button"
                                  onClick={() => handleCancelBooking(booking.id)}
                                  disabled={cancellingId === booking.id}
                                  className="px-2.5 py-1 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded transition-colors disabled:opacity-50"
                                >
                                  {cancellingId === booking.id ? '...' : 'Yes, Cancel'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmCancelId(null)}
                                  className="px-2 py-1 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded"
                                >
                                  Back
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmCancelId(booking.id)}
                                className="px-3.5 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
                              >
                                Cancel Booking
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: RENTAL HISTORY */}
            {activeTab === 'history' && (
              <div className="space-y-4">
                {/* Sub-filter tabs */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  <span className="text-xs font-semibold text-slate-500 mr-1">Status Filter:</span>
                  {[
                    { id: 'ALL', label: `All History (${historyBookings.length})` },
                    { id: 'COMPLETED', label: `Completed (${completedBookings.length})` },
                    { id: 'REJECTED', label: `Rejected (${rejectedBookings.length})` },
                    { id: 'CANCELLED', label: `Cancelled (${cancelledBookings.length})` },
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => setHistorySubFilter(filter.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
                        historySubFilter === filter.id
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>

                {isLoading ? (
                  <div className="py-16 text-center text-slate-500 space-y-2">
                    <div className="animate-spin inline-block w-8 h-8 border-3 border-slate-800 border-t-transparent rounded-full"></div>
                    <p className="text-sm font-medium">Loading rental history...</p>
                  </div>
                ) : filteredHistory.length === 0 ? (
                  <div className="py-12 text-center bg-white border border-dashed border-slate-300 rounded-2xl space-y-2">
                    <span className="text-4xl">📜</span>
                    <h4 className="text-base font-bold text-slate-900">
                      No {historySubFilter !== 'ALL' ? historySubFilter.toLowerCase() : ''} history records found
                    </h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Completed, rejected, or cancelled rentals will appear here for your records.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredHistory.map((booking) => {
                      const badge = getStatusBadge(booking.status);
                      return (
                        <div
                          key={booking.id}
                          className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-5 opacity-90"
                        >
                          <div className="flex items-start space-x-4 w-full md:w-auto">
                            <img
                              src={booking.imageUrl && booking.imageUrl.trim() ? booking.imageUrl : DEFAULT_FALLBACK_IMAGE}
                              alt={booking.equipmentName}
                              className="w-20 h-20 rounded-xl object-cover border border-slate-200 shrink-0 bg-slate-100"
                            />
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2 flex-wrap">
                                <h3 className="text-base font-bold text-slate-900">{booking.equipmentName}</h3>
                                {badge && (
                                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${badge.styles}`}>
                                    {badge.label}
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
                                <span>🏷️ {booking.equipmentCategory}</span>
                                <span>📍 {booking.location}</span>
                              </div>
                              <div className="text-xs text-slate-500 space-y-0.5 pt-1">
                                <p>🗓️ <strong>Rental Period:</strong> {formatDateTime(booking.startDateTime)} to {formatDateTime(booking.endDateTime)}</p>
                                <p>⏱️ <strong>Duration:</strong> {booking.duration} {booking.priceUnit}{booking.duration > 1 ? 's' : ''}</p>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto border-t md:border-t-0 border-slate-100 pt-3 md:pt-0 shrink-0 space-y-2">
                            <div className="text-left md:text-right">
                              <p className="text-xs text-slate-500 font-medium">Rental Total</p>
                              <p className="text-xl font-black text-slate-800">
                                ₹{booking.totalPrice ? booking.totalPrice.toLocaleString('en-IN') : '0'}
                              </p>
                            </div>

                            {/* Rate Owner action in History tab */}
                            {booking.status?.toUpperCase() === 'COMPLETED' && (
                              <div>
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
            )}

            {/* TAB 4: SPENDING SUMMARY */}
            {activeTab === 'spending' && (
              <div className="space-y-6">
                {/* Spending Overview Banner Card */}
                <div className="bg-gradient-to-br from-indigo-900 to-indigo-800 rounded-2xl p-6 text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-indigo-200">
                      Total Completed Rental Spend
                    </span>
                    <h2 className="text-3xl font-black tracking-tight text-white">
                      ₹{completedRentalSpend.toLocaleString('en-IN')}
                    </h2>
                    <p className="text-xs text-indigo-200 max-w-md">
                      Calculated as the sum of total price across all completed equipment bookings. Does not include pending, cancelled, or rejected requests.
                    </p>
                  </div>
                  <div className="text-right shrink-0 bg-white/10 backdrop-blur-xs px-5 py-3 rounded-xl border border-white/20">
                    <span className="block text-2xl font-black text-white">{completedBookings.length}</span>
                    <span className="text-xs text-indigo-100 font-medium">Completed Bookings</span>
                  </div>
                </div>

                {/* Monthly Spending Breakdown */}
                {monthlySpendingBreakdown.length > 0 && (
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                    <div className="border-b border-slate-200 pb-3">
                      <h3 className="text-base font-bold text-slate-900">
                        Monthly Rental Spending Breakdown
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Grouped by rental scheduled start date for completed bookings.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {monthlySpendingBreakdown.map((group) => (
                        <div
                          key={group.monthYear}
                          className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1"
                        >
                          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                            {group.monthYear}
                          </span>
                          <p className="text-xl font-black text-indigo-700">
                            ₹{group.total.toLocaleString('en-IN')}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {group.count} completed rental{group.count === 1 ? '' : 's'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* List of Completed Rentals Contributing to Spend */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                  <div className="border-b border-slate-200 pb-3">
                    <h3 className="text-base font-bold text-slate-900">
                      Completed Rentals Contributing to Spend
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Itemized list of fulfilled machinery bookings.
                    </p>
                  </div>

                  {completedBookings.length === 0 ? (
                    <div className="py-8 text-center text-slate-500 space-y-1">
                      <p className="text-sm font-semibold">No completed rentals yet.</p>
                      <p className="text-xs text-slate-400">
                        When rental periods end and owners mark bookings as completed, records will appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {completedBookings.map((b) => (
                        <div
                          key={b.id}
                          className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center space-x-3">
                            <img
                              src={b.imageUrl && b.imageUrl.trim() ? b.imageUrl : DEFAULT_FALLBACK_IMAGE}
                              alt={b.equipmentName}
                              className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0 bg-slate-100"
                            />
                            <div>
                              <p className="font-bold text-slate-900 text-sm">{b.equipmentName}</p>
                              <p className="text-slate-500">
                                {b.equipmentCategory} • {formatDateTime(b.startDateTime)} to {formatDateTime(b.endDateTime)}
                              </p>
                            </div>
                          </div>
                          <div className="text-left sm:text-right">
                            <span className="text-sm font-extrabold text-indigo-700">
                              ₹{b.totalPrice ? b.totalPrice.toLocaleString('en-IN') : '0'}
                            </span>
                            <span className="block text-[11px] text-slate-400">
                              {b.duration} {b.priceUnit}{b.duration > 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </main>

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

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8 px-4 border-t border-slate-800 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm">
          <p>© {new Date().getFullYear()} AgroRent - Farmer Equipment Rental Platform. All rights reserved.</p>
          <div className="flex space-x-6">
            <button type="button" onClick={onNavigateToHome} className="hover:text-white transition-colors">
              Browse Equipment
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default RenterDashboard;
