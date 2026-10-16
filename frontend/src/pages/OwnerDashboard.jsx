import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Navbar from '../components/layout/Navbar';
import AddEquipmentModal from '../features/equipment/components/AddEquipmentModal';
import MyBookingsModal from '../features/booking/components/MyBookingsModal';
import { useAuth } from '../context/AuthContext';
import {
  fetchMyEquipment,
  updateEquipment,
  deleteEquipment,
} from '../services/equipmentService';
import {
  fetchOwnerBookings,
  approveOwnerBooking,
  rejectOwnerBooking,
  completeOwnerBooking,
} from '../services/bookingService';
import {
  fetchOwnerRatingSummary,
  fetchOwnerReviews,
} from '../services/reviewService';

const DEFAULT_FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1592861956120-e524fc739696?auto=format&fit=crop&w=600&q=80';

const CATEGORIES = [
  'Tractors',
  'Harvesters',
  'Rotavators',
  'Seed Drills',
  'Cultivators',
  'Sprayers',
  'Power Tillers',
  'Other Machinery',
];

/**
 * Dedicated Owner Dashboard Page Component
 * Allows authenticated equipment owners to manage listed machinery and handle incoming rental requests.
 */
const OwnerDashboard = ({ onNavigateToHome, onNavigateToMyBookings }) => {
  const { token, isAuthenticated, currentFarmer } = useAuth();

  // Active Tab: 'equipment' | 'requests' | 'approved' | 'history' | 'earnings' | 'reviews'
  const [activeTab, setActiveTab] = useState('equipment');

  // History sub-filter: 'ALL' | 'COMPLETED' | 'REJECTED' | 'CANCELLED'
  const [historySubFilter, setHistorySubFilter] = useState('ALL');

  // Owner Ratings & Reviews state (Milestone 1)
  const [ownerRatingSummary, setOwnerRatingSummary] = useState(null);
  const [ownerReviews, setOwnerReviews] = useState([]);
  const [isReviewsLoading, setIsReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isMyBookingsOpen, setIsMyBookingsOpen] = useState(false);

  // Equipment Data state
  const [myEquipment, setMyEquipment] = useState([]);
  const [isEquipmentLoading, setIsEquipmentLoading] = useState(true);
  const [equipmentError, setEquipmentError] = useState('');

  // Editing state for Equipment
  const [editingItem, setEditingItem] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    category: '',
    description: '',
    price: '',
    priceUnit: 'hour',
    bookingType: 'instant',
    location: '',
    imageUrl: '',
    isAvailable: true,
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [isUpdating, setIsUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Owner Bookings Data state
  const [ownerBookings, setOwnerBookings] = useState([]);
  const [isBookingsLoading, setIsBookingsLoading] = useState(true);
  const [bookingsError, setBookingsError] = useState('');

  // Global Action Feedback Messages
  const [successMessage, setSuccessMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [processingAction, setProcessingAction] = useState('');

  /**
   * Fetch authenticated user's equipment listings
   */
  const loadEquipment = useCallback(async () => {
    if (!token) return;
    setIsEquipmentLoading(true);
    setEquipmentError('');
    try {
      const response = await fetchMyEquipment(token);
      setMyEquipment(response.data || []);
    } catch (err) {
      setEquipmentError(err.message || 'Failed to load equipment listings.');
    } finally {
      setIsEquipmentLoading(false);
    }
  }, [token]);

  /**
   * Fetch all owner bookings
   */
  const loadBookings = useCallback(async () => {
    if (!token) return;
    setIsBookingsLoading(true);
    setBookingsError('');
    try {
      const response = await fetchOwnerBookings(token, 'ALL');
      setOwnerBookings(response.data || []);
    } catch (err) {
      setBookingsError(err.message || 'Failed to load rental requests.');
    } finally {
      setIsBookingsLoading(false);
    }
  }, [token]);

  /**
   * Fetch owner rating summary & received reviews
   */
  const loadReviews = useCallback(async () => {
    if (!currentFarmer?.id) return;
    setIsReviewsLoading(true);
    setReviewsError('');
    try {
      const [summaryRes, reviewsRes] = await Promise.allSettled([
        fetchOwnerRatingSummary(currentFarmer.id),
        fetchOwnerReviews(currentFarmer.id),
      ]);

      if (summaryRes.status === 'fulfilled') {
        setOwnerRatingSummary(summaryRes.value?.data || null);
      }
      if (reviewsRes.status === 'fulfilled') {
        setOwnerReviews(reviewsRes.value?.data || []);
      }
    } catch (err) {
      setReviewsError(err.message || 'Failed to load owner reviews.');
    } finally {
      setIsReviewsLoading(false);
    }
  }, [currentFarmer?.id]);

  /**
   * Initial & Reactive Data Load
   */
  useEffect(() => {
    if (isAuthenticated && token) {
      loadEquipment();
      loadBookings();
      if (currentFarmer?.id) {
        loadReviews();
      }
    }
  }, [isAuthenticated, token, currentFarmer?.id, loadEquipment, loadBookings, loadReviews]);

  useEffect(() => {
    const handleReviewSubmitted = () => {
      if (currentFarmer?.id) {
        loadReviews();
      }
    };
    window.addEventListener('agrorent:review-submitted', handleReviewSubmitted);
    return () => {
      window.removeEventListener('agrorent:review-submitted', handleReviewSubmitted);
    };
  }, [currentFarmer?.id, loadReviews]);

  // Derived Lists for Dashboard Sections
  const totalEquipmentCount = myEquipment.length;
  const pendingRequests = useMemo(() => ownerBookings.filter((b) => b.status?.toUpperCase() === 'PENDING'), [ownerBookings]);
  const approvedRentals = useMemo(() => ownerBookings.filter((b) => b.status?.toUpperCase() === 'APPROVED'), [ownerBookings]);
  const completedBookings = useMemo(() => ownerBookings.filter((b) => b.status?.toUpperCase() === 'COMPLETED'), [ownerBookings]);
  const rejectedBookings = useMemo(() => ownerBookings.filter((b) => b.status?.toUpperCase() === 'REJECTED'), [ownerBookings]);
  const cancelledBookings = useMemo(() => ownerBookings.filter((b) => b.status?.toUpperCase() === 'CANCELLED'), [ownerBookings]);

  // History Bookings: COMPLETED, REJECTED, or CANCELLED (excludes PENDING & APPROVED)
  const historyBookings = useMemo(() => {
    return ownerBookings.filter((b) => {
      const s = b.status?.toUpperCase();
      return s === 'COMPLETED' || s === 'REJECTED' || s === 'CANCELLED';
    });
  }, [ownerBookings]);

  const filteredHistory = useMemo(() => {
    if (historySubFilter === 'ALL') return historyBookings;
    return historyBookings.filter((b) => b.status?.toUpperCase() === historySubFilter);
  }, [historyBookings, historySubFilter]);

  // Completed Rental Value: Sum of totalPrice for all COMPLETED bookings
  const completedRentalValue = useMemo(() => {
    return completedBookings.reduce((sum, b) => sum + (Number(b.totalPrice) || 0), 0);
  }, [completedBookings]);

  // Breakdown of Completed Rental Value by Equipment
  const equipmentEarningsBreakdown = useMemo(() => {
    const groups = {};
    completedBookings.forEach((b) => {
      const key = b.equipmentName || 'Other Machinery';
      if (!groups[key]) {
        groups[key] = {
          equipmentName: key,
          category: b.equipmentCategory || 'Machinery',
          total: 0,
          count: 0,
        };
      }
      groups[key].total += Number(b.totalPrice) || 0;
      groups[key].count += 1;
    });
    return Object.values(groups);
  }, [completedBookings]);

  // Breakdown of Completed Rental Value by Month
  const monthlyEarningsBreakdown = useMemo(() => {
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
        groups[monthYear] = { monthYear, total: 0, count: 0 };
      }
      groups[monthYear].total += Number(b.totalPrice) || 0;
      groups[monthYear].count += 1;
    });
    return Object.values(groups);
  }, [completedBookings]);

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

  // Handlers for Equipment Operations
  const startEdit = (item) => {
    setEditingItem(item);
    setEditFormData({
      name: item.name || '',
      category: item.category || 'Tractors',
      description: item.description || '',
      price: item.price || '',
      priceUnit: item.priceUnit || 'hour',
      bookingType: item.bookingType || 'instant',
      location: item.location || '',
      imageUrl: item.imageUrl || '',
      isAvailable: item.isAvailable !== false,
    });
    setFieldErrors({});
    setActionError('');
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setFieldErrors({});
  };

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    setEditFormData((prev) => ({ ...prev, [name]: val }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!editingItem) return;

    setIsUpdating(true);
    setActionError('');
    setFieldErrors({});

    try {
      const payload = {
        name: editFormData.name.trim(),
        category: editFormData.category,
        description: editFormData.description ? editFormData.description.trim() : '',
        price: parseFloat(editFormData.price),
        priceUnit: editFormData.priceUnit,
        bookingType: editFormData.bookingType,
        location: editFormData.location.trim(),
        imageUrl: editFormData.imageUrl ? editFormData.imageUrl.trim() : '',
        isAvailable: editFormData.isAvailable,
      };

      await updateEquipment(editingItem.id, payload, token);
      setSuccessMessage(`Equipment "${payload.name}" updated successfully.`);
      setEditingItem(null);
      await loadEquipment();
    } catch (err) {
      if (err.errors) {
        setFieldErrors(err.errors);
      }
      setActionError(err.message || 'Failed to update equipment listing.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteConfirm = async (id) => {
    setIsDeleting(true);
    setActionError('');
    try {
      await deleteEquipment(id, token);
      setIsDeleting(false);
      setDeletingId(null);
      setSuccessMessage('Equipment listing deleted successfully.');
      await loadEquipment();
    } catch (err) {
      setIsDeleting(false);
      setDeletingId(null);
      setActionError(err.message || 'Failed to delete equipment listing.');
    }
  };

  // Handlers for Booking Actions
  const handleApprove = async (bookingId) => {
    if (processingId) return;
    setProcessingId(bookingId);
    setProcessingAction('approve');
    setActionError('');
    setSuccessMessage('');

    try {
      await approveOwnerBooking(bookingId, token);
      setSuccessMessage(`Booking #${bookingId} approved successfully!`);
      await loadBookings();
    } catch (err) {
      setActionError(err.message || 'Failed to approve booking.');
    } finally {
      setProcessingId(null);
      setProcessingAction('');
    }
  };

  const handleReject = async (bookingId) => {
    if (processingId) return;
    setProcessingId(bookingId);
    setProcessingAction('reject');
    setActionError('');
    setSuccessMessage('');

    try {
      await rejectOwnerBooking(bookingId, token);
      setSuccessMessage(`Booking #${bookingId} was rejected.`);
      await loadBookings();
    } catch (err) {
      setActionError(err.message || 'Failed to reject booking.');
    } finally {
      setProcessingId(null);
      setProcessingAction('');
    }
  };

  const handleComplete = async (bookingId) => {
    if (processingId) return;
    setProcessingId(bookingId);
    setProcessingAction('complete');
    setActionError('');
    setSuccessMessage('');

    try {
      await completeOwnerBooking(bookingId, token);
      setSuccessMessage(`Booking #${bookingId} marked as completed!`);
      await loadBookings();
    } catch (err) {
      setActionError(err.message || 'Failed to mark booking as completed.');
    } finally {
      setProcessingId(null);
      setProcessingAction('');
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
        currentPage="owner-dashboard"
        onNavigateToHome={onNavigateToHome}
        onOpenMyBookings={onNavigateToMyBookings}
        onOpenOwnerDashboard={() => {}}
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
                Owner Dashboard
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                Manage your equipment and rental requests in one place.
              </p>
            </div>
            {isAuthenticated && (
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center justify-center px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors shrink-0 space-x-1.5"
              >
                <span>+ List New Equipment</span>
              </button>
            )}
          </div>
        </div>

        {/* Logged Out Banner */}
        {!isAuthenticated ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center max-w-lg mx-auto space-y-4 shadow-xs">
            <div className="text-4xl">🔐</div>
            <h3 className="text-lg font-bold text-slate-900">Authentication Required</h3>
            <p className="text-xs text-slate-600">
              Please log in to your farmer account to access your Owner Dashboard and manage equipment or incoming rental requests.
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
            {/* Global Success & Error Feedback Banners */}
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

            {actionError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm font-medium flex items-center justify-between animate-in fade-in">
                <span>{actionError}</span>
                <button
                  type="button"
                  onClick={() => setActionError('')}
                  className="text-red-600 hover:text-red-800 text-xs font-bold ml-4"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Main Navigation Tabs */}
            <div className="border-b border-slate-200 flex space-x-2 sm:space-x-4 overflow-x-auto pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('equipment')}
                className={`py-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-colors whitespace-nowrap flex items-center space-x-2 ${
                  activeTab === 'equipment'
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>🚜 My Equipment</span>
                <span className="px-2 py-0.5 text-[11px] rounded-full bg-slate-100 text-slate-700 font-semibold">
                  {totalEquipmentCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('requests')}
                className={`py-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-colors whitespace-nowrap flex items-center space-x-2 ${
                  activeTab === 'requests'
                    ? 'border-amber-600 text-amber-700'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>⏳ Requests</span>
                {pendingRequests.length > 0 && (
                  <span className="px-2 py-0.5 text-[11px] rounded-full bg-amber-100 text-amber-800 font-bold">
                    {pendingRequests.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('approved')}
                className={`py-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-colors whitespace-nowrap flex items-center space-x-2 ${
                  activeTab === 'approved'
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>✅ Approved Rentals</span>
                <span className="px-2 py-0.5 text-[11px] rounded-full bg-slate-100 text-slate-700 font-semibold">
                  {approvedRentals.length}
                </span>
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
                onClick={() => setActiveTab('earnings')}
                className={`py-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-colors whitespace-nowrap flex items-center space-x-2 ${
                  activeTab === 'earnings'
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>💰 Earnings Summary</span>
                <span className="px-2 py-0.5 text-[11px] rounded-full bg-emerald-50 text-emerald-700 font-semibold">
                  ₹{completedRentalValue.toLocaleString('en-IN')}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('reviews')}
                className={`py-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-colors whitespace-nowrap flex items-center space-x-2 ${
                  activeTab === 'reviews'
                    ? 'border-amber-500 text-amber-700'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>⭐ Reviews & Ratings</span>
                <span className="px-2 py-0.5 text-[11px] rounded-full bg-amber-50 text-amber-800 font-bold">
                  {ownerRatingSummary && ownerRatingSummary.totalReviews > 0
                    ? `⭐ ${ownerRatingSummary.averageRating.toFixed(1)} (${ownerRatingSummary.totalReviews})`
                    : '⭐ 0'}
                </span>
              </button>
            </div>

            {/* TAB 1: MY EQUIPMENT */}
            {activeTab === 'equipment' && (
              <div className="space-y-4">
                {editingItem ? (
                  /* INLINE EDIT FORM */
                  <form
                    onSubmit={handleUpdateSubmit}
                    className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4"
                  >
                    <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                      <h3 className="text-base font-bold text-slate-900">
                        Edit Equipment: {editingItem.name}
                      </h3>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                      >
                        Cancel Edit
                      </button>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        Equipment Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        required
                        maxLength={150}
                        value={editFormData.name}
                        onChange={handleEditChange}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      {fieldErrors.name && (
                        <p className="text-xs text-red-600 font-medium mt-1">{fieldErrors.name}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                          Category *
                        </label>
                        <select
                          name="category"
                          required
                          value={editFormData.category}
                          onChange={handleEditChange}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                          {CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                          Location *
                        </label>
                        <input
                          type="text"
                          name="location"
                          required
                          maxLength={200}
                          value={editFormData.location}
                          onChange={handleEditChange}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                          Rental Price (₹) *
                        </label>
                        <input
                          type="number"
                          name="price"
                          required
                          step="0.01"
                          min="0.01"
                          value={editFormData.price}
                          onChange={handleEditChange}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        {fieldErrors.price && (
                          <p className="text-xs text-red-600 font-medium mt-1">{fieldErrors.price}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                          Price Unit *
                        </label>
                        <select
                          name="priceUnit"
                          required
                          value={editFormData.priceUnit}
                          onChange={handleEditChange}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                          <option value="hour">Per Hour</option>
                          <option value="day">Per Day</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        Image URL (Optional)
                      </label>
                      <input
                        type="url"
                        name="imageUrl"
                        value={editFormData.imageUrl}
                        onChange={handleEditChange}
                        placeholder="https://images.unsplash.com/..."
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        Description
                      </label>
                      <textarea
                        name="description"
                        rows="2"
                        value={editFormData.description}
                        onChange={handleEditChange}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      ></textarea>
                    </div>

                    <div className="flex items-center space-x-2 pt-1">
                      <input
                        type="checkbox"
                        id="isAvailableCheckbox"
                        name="isAvailable"
                        checked={editFormData.isAvailable}
                        onChange={handleEditChange}
                        className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                      />
                      <label htmlFor="isAvailableCheckbox" className="text-xs font-semibold text-slate-800">
                        Mark as Available for Renting
                      </label>
                    </div>

                    <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-100"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isUpdating}
                        className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs disabled:opacity-50"
                      >
                        {isUpdating ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                ) : (
                  /* EQUIPMENT LISTINGS */
                  <div className="space-y-4">
                    {isEquipmentLoading ? (
                      <div className="py-16 text-center text-slate-500 space-y-2">
                        <div className="animate-spin inline-block w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full"></div>
                        <p className="text-sm font-medium">Loading your equipment listings...</p>
                      </div>
                    ) : equipmentError ? (
                      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-800 text-sm">
                        <span>{equipmentError}</span>
                        <button
                          type="button"
                          onClick={loadEquipment}
                          className="ml-3 font-bold text-red-700 underline"
                        >
                          Retry
                        </button>
                      </div>
                    ) : myEquipment.length === 0 ? (
                      <div className="py-12 text-center bg-white border border-dashed border-slate-300 rounded-2xl space-y-3">
                        <span className="text-4xl">🚜</span>
                        <h4 className="text-base font-bold text-slate-900">No equipment listings yet</h4>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto">
                          You haven't added any machinery to AgroRent yet. Click "+ List New Equipment" to register your first tractor or farm tool.
                        </p>
                        <button
                          type="button"
                          onClick={() => setIsAddModalOpen(true)}
                          className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                        >
                          + List New Equipment Now
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {myEquipment.map((item) => (
                          <div
                            key={item.id}
                            className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs hover:border-emerald-300 transition-colors"
                          >
                            <div className="flex items-start space-x-3">
                              <img
                                src={item.imageUrl && item.imageUrl.trim() ? item.imageUrl : DEFAULT_FALLBACK_IMAGE}
                                alt={item.name}
                                className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0 bg-slate-100"
                              />
                              <div className="space-y-1">
                                <div className="flex items-center space-x-2 flex-wrap">
                                  <h4 className="text-base font-bold text-slate-900">{item.name}</h4>
                                  <span
                                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                                      item.isAvailable
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        : 'bg-rose-50 text-rose-700 border-rose-200'
                                    }`}
                                  >
                                    {item.isAvailable ? 'Available' : 'Unavailable'}
                                  </span>
                                </div>
                                <div className="text-xs text-slate-500 space-y-0.5">
                                  <p>🏷️ {item.category} • 📍 {item.location}</p>
                                  <p className="font-semibold text-emerald-700">
                                    ₹{item.price} / {item.priceUnit}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                              {deletingId === item.id ? (
                                <div className="flex items-center space-x-2 bg-red-50 p-1.5 rounded-lg border border-red-200">
                                  <span className="text-xs text-red-800 font-semibold">Delete?</span>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteConfirm(item.id)}
                                    disabled={isDeleting}
                                    className="px-2.5 py-1 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded"
                                  >
                                    {isDeleting ? 'Deleting...' : 'Yes'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDeletingId(null)}
                                    className="px-2 py-1 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded"
                                  >
                                    No
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => startEdit(item)}
                                    className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
                                  >
                                    Edit Listing
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDeletingId(item.id)}
                                    className="px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
                                  >
                                    Delete
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: REQUESTS (PENDING) */}
            {activeTab === 'requests' && (
              <div className="space-y-4">
                {isBookingsLoading ? (
                  <div className="py-16 text-center text-slate-500 space-y-2">
                    <div className="animate-spin inline-block w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full"></div>
                    <p className="text-sm font-medium">Loading incoming requests...</p>
                  </div>
                ) : bookingsError ? (
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-800 text-sm">
                    <span>{bookingsError}</span>
                    <button type="button" onClick={loadBookings} className="ml-3 font-bold text-red-700 underline">
                      Retry
                    </button>
                  </div>
                ) : pendingRequests.length === 0 ? (
                  <div className="py-12 text-center bg-white border border-dashed border-slate-300 rounded-2xl space-y-2">
                    <span className="text-4xl">⏳</span>
                    <h4 className="text-base font-bold text-slate-900">No pending requests</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      When farmers submit requests to rent your equipment, they will appear here for your approval.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingRequests.map((booking) => (
                      <div
                        key={booking.id}
                        className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-5 hover:border-amber-300 transition-colors"
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
                              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                ⏳ Pending Approval
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
                              <span>🏷️ {booking.equipmentCategory}</span>
                              <span>📍 {booking.location}</span>
                              <span>👤 Renter: <strong>{booking.renterName}</strong></span>
                              {booking.renterPhone && <span>📞 {booking.renterPhone}</span>}
                            </div>
                            <div className="text-xs text-slate-500 space-y-0.5 pt-1">
                              <p>🗓️ <strong>Start:</strong> {formatDateTime(booking.startDateTime)}</p>
                              <p>🏁 <strong>End:</strong> {formatDateTime(booking.endDateTime)} ({booking.duration} {booking.priceUnit}{booking.duration > 1 ? 's' : ''})</p>
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
                            <p className="text-xs text-slate-500 font-medium">Total Price</p>
                            <p className="text-xl font-black text-emerald-700">
                              ₹{booking.totalPrice ? booking.totalPrice.toLocaleString('en-IN') : '0'}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => handleApprove(booking.id)}
                              disabled={processingId === booking.id}
                              className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50 shadow-xs"
                            >
                              {processingId === booking.id && processingAction === 'approve' ? 'Approving...' : 'Approve'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReject(booking.id)}
                              disabled={processingId === booking.id}
                              className="px-3.5 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors disabled:opacity-50"
                            >
                              {processingId === booking.id && processingAction === 'reject' ? 'Rejecting...' : 'Reject'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: APPROVED RENTALS */}
            {activeTab === 'approved' && (
              <div className="space-y-4">
                {isBookingsLoading ? (
                  <div className="py-16 text-center text-slate-500 space-y-2">
                    <div className="animate-spin inline-block w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full"></div>
                    <p className="text-sm font-medium">Loading approved rentals...</p>
                  </div>
                ) : approvedRentals.length === 0 ? (
                  <div className="py-12 text-center bg-white border border-dashed border-slate-300 rounded-2xl space-y-2">
                    <span className="text-4xl">✅</span>
                    <h4 className="text-base font-bold text-slate-900">No active approved rentals</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Approved equipment bookings will appear here. You can mark them as completed when the rental period ends.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {approvedRentals.map((booking) => (
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
                                ✅ Approved
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
                              <span>🏷️ {booking.equipmentCategory}</span>
                              <span>📍 {booking.location}</span>
                              <span>👤 Renter: <strong>{booking.renterName}</strong></span>
                              {booking.renterPhone && <span>📞 {booking.renterPhone}</span>}
                            </div>
                            <div className="text-xs text-slate-500 space-y-0.5 pt-1">
                              <p>🗓️ <strong>Start:</strong> {formatDateTime(booking.startDateTime)}</p>
                              <p>🏁 <strong>End:</strong> {formatDateTime(booking.endDateTime)} ({booking.duration} {booking.priceUnit}{booking.duration > 1 ? 's' : ''})</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto border-t md:border-t-0 border-slate-100 pt-3 md:pt-0 shrink-0 space-y-2">
                          <div className="text-left md:text-right">
                            <p className="text-xs text-slate-500 font-medium">Total Price</p>
                            <p className="text-xl font-black text-emerald-700">
                              ₹{booking.totalPrice ? booking.totalPrice.toLocaleString('en-IN') : '0'}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleComplete(booking.id)}
                            disabled={processingId === booking.id}
                            className="px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 shadow-xs"
                          >
                            {processingId === booking.id && processingAction === 'complete' ? 'Completing...' : 'Mark Completed'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: RENTAL HISTORY */}
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

                {isBookingsLoading ? (
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
                                {booking.renterName && (
                                  <span>👤 Renter: <strong>{booking.renterName}</strong></span>
                                )}
                                {booking.renterPhone && (
                                  <span>📞 {booking.renterPhone}</span>
                                )}
                              </div>
                              <div className="text-xs text-slate-500 space-y-0.5 pt-1">
                                <p>🗓️ <strong>Rental Period:</strong> {formatDateTime(booking.startDateTime)} to {formatDateTime(booking.endDateTime)}</p>
                                {booking.duration && (
                                  <p>⏱️ <strong>Duration:</strong> {booking.duration} {booking.priceUnit}{booking.duration > 1 ? 's' : ''}</p>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="text-left md:text-right shrink-0 border-t md:border-t-0 border-slate-100 pt-3 md:pt-0 w-full md:w-auto">
                            <p className="text-xs text-slate-500 font-medium">Rental Total</p>
                            <p className="text-xl font-black text-slate-800">
                              ₹{booking.totalPrice ? booking.totalPrice.toLocaleString('en-IN') : '0'}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: EARNINGS SUMMARY */}
            {activeTab === 'earnings' && (
              <div className="space-y-6">
                {/* Earnings Overview Banner Card */}
                <div className="bg-gradient-to-br from-emerald-900 to-emerald-800 rounded-2xl p-6 text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-emerald-200">
                      Completed Rental Value
                    </span>
                    <h2 className="text-3xl font-black tracking-tight text-white">
                      ₹{completedRentalValue.toLocaleString('en-IN')}
                    </h2>
                    <p className="text-xs text-emerald-100 max-w-md">
                      Calculated as the sum of total price across all completed equipment rentals. Does not include pending, approved, rejected, or cancelled bookings.
                    </p>
                  </div>
                  <div className="text-right shrink-0 bg-white/10 backdrop-blur-xs px-5 py-3 rounded-xl border border-white/20">
                    <span className="block text-2xl font-black text-white">{completedBookings.length}</span>
                    <span className="text-xs text-emerald-100 font-medium">Completed Rentals</span>
                  </div>
                </div>

                {/* Equipment Value Breakdown */}
                {equipmentEarningsBreakdown.length > 0 && (
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                    <div className="border-b border-slate-200 pb-3">
                      <h3 className="text-base font-bold text-slate-900">
                        Completed Rental Value by Equipment
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Breakdown of completed rental totals across your listed machinery.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {equipmentEarningsBreakdown.map((group) => (
                        <div
                          key={group.equipmentName}
                          className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800 truncate" title={group.equipmentName}>
                              {group.equipmentName}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 bg-slate-200 text-slate-700 rounded-full font-medium">
                              {group.category}
                            </span>
                          </div>
                          <p className="text-xl font-black text-emerald-700">
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

                {/* Monthly Value Breakdown */}
                {monthlyEarningsBreakdown.length > 0 && (
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                    <div className="border-b border-slate-200 pb-3">
                      <h3 className="text-base font-bold text-slate-900">
                        Monthly Completed Rental Value
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Grouped by rental scheduled start date for completed bookings.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {monthlyEarningsBreakdown.map((group) => (
                        <div
                          key={group.monthYear}
                          className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1"
                        >
                          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                            {group.monthYear}
                          </span>
                          <p className="text-xl font-black text-emerald-700">
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

                {/* List of Completed Rentals Contributing to Value */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                  <div className="border-b border-slate-200 pb-3">
                    <h3 className="text-base font-bold text-slate-900">
                      Completed Rentals Contributing to Value
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Itemized list of fulfilled machinery bookings.
                    </p>
                  </div>

                  {completedBookings.length === 0 ? (
                    <div className="py-8 text-center text-slate-500 space-y-1">
                      <p className="text-sm font-semibold">No completed rentals yet.</p>
                      <p className="text-xs text-slate-400">
                        When rental periods conclude and you mark bookings as completed, records will appear here.
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
                              {b.renterName && (
                                <p className="text-slate-600 font-medium">👤 Renter: {b.renterName}</p>
                              )}
                            </div>
                          </div>
                          <div className="text-left sm:text-right">
                            <span className="text-sm font-extrabold text-emerald-700">
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

            {/* TAB 6: REVIEWS & RATINGS (Milestone 1) */}
            {activeTab === 'reviews' && (
              <div className="space-y-6">
                {/* Rating Overview Card */}
                <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200/80 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                  <div className="space-y-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                      Equipment Owner Reputation
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
                      <span className="text-amber-500">★</span>
                      <span>
                        {ownerRatingSummary && ownerRatingSummary.totalReviews > 0
                          ? ownerRatingSummary.averageRating.toFixed(1)
                          : '0.0'}
                      </span>
                      <span className="text-slate-400 text-lg font-normal">/ 5.0</span>
                    </h2>
                    <p className="text-xs text-slate-600 max-w-md">
                      Calculated from authentic reviews submitted by farmers who completed equipment rentals with you.
                    </p>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl px-5 py-3.5 text-right shrink-0 shadow-xs">
                    <span className="block text-2xl font-black text-slate-900">
                      {ownerRatingSummary ? ownerRatingSummary.totalReviews : 0}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      Verified Rental Reviews
                    </span>
                  </div>
                </div>

                {reviewsError && (
                  <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs font-medium">
                    {reviewsError}
                  </div>
                )}

                {/* Reviews List */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                  <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
                    Feedback from Renters
                  </h3>

                  {isReviewsLoading ? (
                    <div className="py-12 text-center text-slate-500 space-y-2">
                      <div className="animate-spin inline-block w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full" />
                      <p className="text-xs font-medium">Loading your feedback history...</p>
                    </div>
                  ) : ownerReviews.length === 0 ? (
                    <div className="py-12 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl space-y-2">
                      <span className="text-3xl">⭐</span>
                      <h4 className="text-sm font-bold text-slate-800">No reviews received yet</h4>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        When renters complete machinery rentals and rate your equipment and service, their reviews will appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4 divide-y divide-slate-100">
                      {ownerReviews.map((rev) => (
                        <div key={rev.id} className="pt-4 first:pt-0 space-y-2">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                            <div className="flex items-center space-x-2">
                              {/* 5-star visual representation */}
                              <div className="text-amber-500 font-bold text-sm tracking-widest">
                                {'★'.repeat(rev.rating)}
                                <span className="text-slate-200">{'★'.repeat(5 - rev.rating)}</span>
                              </div>
                              <span className="font-bold text-slate-800 text-sm">
                                {rev.reviewerName}
                              </span>
                              {rev.reviewerLocation && (
                                <span className="text-slate-500 text-[11px]">
                                  📍 {rev.reviewerLocation}
                                </span>
                              )}
                            </div>

                            <div className="text-slate-400 text-[11px] flex items-center space-x-2">
                              {rev.equipmentName && (
                                <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium">
                                  🚜 {rev.equipmentName}
                                </span>
                              )}
                              <span>
                                {rev.createdAt
                                  ? new Date(rev.createdAt).toLocaleDateString('en-IN', {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric',
                                    })
                                  : ''}
                              </span>
                            </div>
                          </div>

                          {rev.feedback ? (
                            <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 italic">
                              "{rev.feedback}"
                            </p>
                          ) : (
                            <p className="text-[11px] text-slate-400 italic">No written comments provided.</p>
                          )}
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

      {/* Shared Modals */}
      <AddEquipmentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={(msg) => {
          setIsAddModalOpen(false);
          setSuccessMessage(msg || 'Equipment listing created successfully!');
          loadEquipment();
        }}
      />

      <MyBookingsModal
        isOpen={isMyBookingsOpen}
        onClose={() => setIsMyBookingsOpen(false)}
      />

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

export default OwnerDashboard;
