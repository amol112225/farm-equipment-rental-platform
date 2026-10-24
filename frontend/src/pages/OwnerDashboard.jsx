import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Navbar from '../components/layout/Navbar';
import AddEquipmentModal from '../features/equipment/components/AddEquipmentModal';
import MyBookingsModal from '../features/booking/components/MyBookingsModal';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  fetchMyEquipment,
  updateEquipment,
  deleteEquipment,
  uploadEquipmentPhotos,
  deleteEquipmentPhoto,
  setPrimaryEquipmentPhoto,
  resolveImageUrl,
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
  const {
    t,
    formatDateTime,
    formatNumber,
    getBookingStatusLabel,
    getCategoryLabel,
    locale,
  } = useLanguage();

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
  const [editingItemPhotos, setEditingItemPhotos] = useState([]);
  const [selectedPrimaryPhotoId, setSelectedPrimaryPhotoId] = useState(null);
  const [photoActionLoading, setPhotoActionLoading] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const editPhotoInputRef = useRef(null);
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
          monthYear = d.toLocaleString(locale || 'en-IN', { month: 'long', year: 'numeric' });
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
  }, [completedBookings, locale]);

  const getStatusBadge = (status) => {
    if (!status) return null;
    switch (status.toUpperCase()) {
      case 'APPROVED':
        return {
          label: t('booking.statusApproved'),
          styles: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        };
      case 'PENDING':
        return {
          label: t('booking.statusPending'),
          styles: 'bg-amber-50 text-amber-700 border-amber-200',
        };
      case 'REJECTED':
        return {
          label: t('booking.statusRejected'),
          styles: 'bg-rose-50 text-rose-700 border-rose-200',
        };
      case 'CANCELLED':
        return {
          label: t('booking.statusCancelled'),
          styles: 'bg-slate-100 text-slate-600 border-slate-300',
        };
      case 'COMPLETED':
        return {
          label: t('booking.statusCompleted'),
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
    const photos =
      item.images && item.images.length > 0
        ? item.images
        : item.imageUrl
        ? [{ id: null, imageUrl: item.imageUrl, isPrimary: true }]
        : [];
    setEditingItemPhotos(photos);
    const activePrimary = photos.find((p) => p.isPrimary) || photos[0] || null;
    setSelectedPrimaryPhotoId(activePrimary?.id || null);
    setPhotoError('');
    setEditFormData({
      name: item.name || '',
      category: item.category || 'Tractors',
      description: item.description || '',
      price: item.price || '',
      priceUnit: item.priceUnit || 'hour',
      bookingType: item.bookingType || 'instant',
      location: item.location || '',
      imageUrl: item.imageUrl || activePrimary?.imageUrl || '',
      isAvailable: item.isAvailable !== false,
    });
    setFieldErrors({});
    setActionError('');
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setEditingItemPhotos([]);
    setSelectedPrimaryPhotoId(null);
    setFieldErrors({});
    setPhotoError('');
  };

  const handleOwnerUploadPhotos = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !editingItem) return;
    setPhotoError('');
    if (editingItemPhotos.length + files.length > 5) {
      setPhotoError(t('equipment.maxPhotosLimit', { max: 5 }));
      return;
    }
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const allowedExts = ['.jpg', '.jpeg', '.png', '.webp'];
    for (const f of files) {
      const lowerName = f.name ? f.name.toLowerCase() : '';
      const hasValidExt = allowedExts.some((ext) => lowerName.endsWith(ext));

      if (!allowed.includes(f.type.toLowerCase()) || !hasValidExt) {
        setPhotoError(t('equipment.unsupportedFormat', { name: f.name }));
        return;
      }
      if (f.size > 5 * 1024 * 1024) {
        setPhotoError(t('equipment.fileTooLarge', { name: f.name }));
        return;
      }
      if (f.size === 0) {
        setPhotoError(t('equipment.fileEmpty', { name: f.name }));
        return;
      }

      try {
        await new Promise((resolve, reject) => {
          const testUrl = URL.createObjectURL(f);
          const img = new Image();
          img.onload = () => {
            URL.revokeObjectURL(testUrl);
            resolve(true);
          };
          img.onerror = () => {
            URL.revokeObjectURL(testUrl);
            reject(new Error(t('equipment.invalidImageContent', { name: f.name })));
          };
          img.src = testUrl;
        });
      } catch (err) {
        setPhotoError(err.message);
        return;
      }
    }
    setPhotoActionLoading(true);
    try {
      const res = await uploadEquipmentPhotos(editingItem.id, files, token);
      if (res?.data) {
        setEditingItem(res.data);
        const updatedPhotos = res.data.images || [];
        setEditingItemPhotos(updatedPhotos);
        const activePrimary = updatedPhotos.find((p) => p.isPrimary) || updatedPhotos[0] || null;
        setSelectedPrimaryPhotoId(activePrimary?.id || null);
        if (res.data.imageUrl || activePrimary?.imageUrl) {
          setEditFormData((prev) => ({
            ...prev,
            imageUrl: res.data.imageUrl || activePrimary.imageUrl,
          }));
        }
        setSuccessMessage(t('equipment.photoUploadedSuccess'));
        await loadEquipment();
      }
    } catch (err) {
      setPhotoError(err.message || 'Failed to upload photos.');
    } finally {
      setPhotoActionLoading(false);
      if (editPhotoInputRef.current) editPhotoInputRef.current.value = '';
    }
  };

  const handleOwnerDeletePhoto = async (photoId) => {
    if (!editingItem) return;
    if (!photoId) {
      setEditFormData((prev) => ({ ...prev, imageUrl: '' }));
      setEditingItemPhotos([]);
      setSelectedPrimaryPhotoId(null);
      return;
    }
    setPhotoActionLoading(true);
    setPhotoError('');
    try {
      const res = await deleteEquipmentPhoto(editingItem.id, photoId, token);
      if (res?.data) {
        setEditingItem(res.data);
        const updatedPhotos = res.data.images || [];
        setEditingItemPhotos(updatedPhotos);
        const newPrimary = updatedPhotos.find((p) => p.isPrimary) || updatedPhotos[0] || null;
        setSelectedPrimaryPhotoId(newPrimary?.id || null);
        setEditFormData((prev) => ({
          ...prev,
          imageUrl: res.data.imageUrl || newPrimary?.imageUrl || '',
        }));
        setSuccessMessage(t('equipment.photoDeletedSuccess'));
        await loadEquipment();
      }
    } catch (err) {
      setPhotoError(err.message || 'Failed to remove photo.');
    } finally {
      setPhotoActionLoading(false);
    }
  };

  const handleOwnerSetPrimary = async (photoId) => {
    if (!editingItem || !photoId) return;

    // Immediately update UI selection
    setSelectedPrimaryPhotoId(photoId);
    setEditingItemPhotos((prev) =>
      prev.map((photo) => ({
        ...photo,
        isPrimary: photo.id === photoId,
      }))
    );
    const chosen = editingItemPhotos.find((p) => p.id === photoId);
    if (chosen) {
      setEditFormData((prev) => ({ ...prev, imageUrl: chosen.imageUrl }));
    }

    setPhotoActionLoading(true);
    setPhotoError('');
    try {
      const res = await setPrimaryEquipmentPhoto(editingItem.id, photoId, token);
      if (res?.data) {
        setEditingItem(res.data);
        setEditingItemPhotos(res.data.images || []);
        if (res.data.imageUrl) {
          setEditFormData((prev) => ({ ...prev, imageUrl: res.data.imageUrl }));
        }
        setSuccessMessage(t('equipment.primaryPhotoSuccess'));
        await loadEquipment();
      }
    } catch (err) {
      setPhotoError(err.message || 'Failed to update primary photo.');
    } finally {
      setPhotoActionLoading(false);
    }
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
        primaryImageId: selectedPrimaryPhotoId || (editingItemPhotos.find((p) => p.isPrimary)?.id) || null,
        isAvailable: editFormData.isAvailable,
      };

      await updateEquipment(editingItem.id, payload, token);
      setSuccessMessage(t('equipment.updateSuccess'));
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
      const itemToDelete = myEquipment.find((it) => it.id === id);
      await deleteEquipment(id, token);
      setIsDeleting(false);
      setDeletingId(null);
      setSuccessMessage(t('equipment.deleteSuccess', { name: itemToDelete?.name || '' }));
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
      setSuccessMessage(t('ownerDashboard.approveSuccess', { id: bookingId }));
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
      setSuccessMessage(t('ownerDashboard.rejectSuccess', { id: bookingId }));
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
      setSuccessMessage(t('ownerDashboard.completeSuccess', { id: bookingId }));
      await loadBookings();
    } catch (err) {
      setActionError(err.message || 'Failed to mark booking as completed.');
    } finally {
      setProcessingId(null);
      setProcessingAction('');
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
            {t('ownerDashboard.backToBrowse')}
          </button>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {t('ownerDashboard.title')}
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                {t('ownerDashboard.subtitle')}
              </p>
            </div>
            {isAuthenticated && (
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center justify-center px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors shrink-0 space-x-1.5"
              >
                <span>{t('nav.listNewEquipment')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Logged Out Banner */}
        {!isAuthenticated ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center max-w-lg mx-auto space-y-4 shadow-xs">
            <div className="text-4xl">🔐</div>
            <h3 className="text-lg font-bold text-slate-900">{t('common.authRequiredTitle')}</h3>
            <p className="text-xs text-slate-600">
              {t('ownerDashboard.authDesc')}
            </p>
            <button
              type="button"
              onClick={onNavigateToHome}
              className="inline-flex items-center px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
            >
              {t('common.goToHomeLogin')}
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
                <span>{t('ownerDashboard.tabMyEquipment')}</span>
                <span className="px-2 py-0.5 text-[11px] rounded-full bg-slate-100 text-slate-700 font-semibold">
                  {formatNumber(totalEquipmentCount)}
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
                <span>{t('ownerDashboard.tabRequests')}</span>
                {pendingRequests.length > 0 && (
                  <span className="px-2 py-0.5 text-[11px] rounded-full bg-amber-100 text-amber-800 font-bold">
                    {formatNumber(pendingRequests.length)}
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
                <span>{t('ownerDashboard.tabApproved')}</span>
                <span className="px-2 py-0.5 text-[11px] rounded-full bg-slate-100 text-slate-700 font-semibold">
                  {formatNumber(approvedRentals.length)}
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
                <span>{t('ownerDashboard.tabHistory')}</span>
                <span className="px-2 py-0.5 text-[11px] rounded-full bg-slate-100 text-slate-700 font-semibold">
                  {formatNumber(historyBookings.length)}
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
                <span>{t('ownerDashboard.tabEarnings')}</span>
                <span className="px-2 py-0.5 text-[11px] rounded-full bg-emerald-50 text-emerald-700 font-semibold">
                  ₹{formatNumber(completedRentalValue)}
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
                <span>{t('ownerDashboard.tabReviews')}</span>
                <span className="px-2 py-0.5 text-[11px] rounded-full bg-amber-50 text-amber-800 font-bold">
                  {ownerRatingSummary && ownerRatingSummary.totalReviews > 0
                    ? `⭐ ${ownerRatingSummary.averageRating.toFixed(1)} (${formatNumber(ownerRatingSummary.totalReviews)})`
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
                        {t('equipment.editEquipment', { name: editingItem.name })}
                      </h3>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                      >
                        {t('equipment.cancelEdit')}
                      </button>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        {t('equipment.name')} *
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
                          {t('equipment.category')} *
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
                              {getCategoryLabel(cat)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                          {t('equipment.location')} *
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
                          {t('equipment.price')} (₹) *
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
                          {t('equipment.priceUnit')} *
                        </label>
                        <select
                          name="priceUnit"
                          required
                          value={editFormData.priceUnit}
                          onChange={handleEditChange}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                          <option value="hour">{t('common.perHour')}</option>
                          <option value="day">{t('common.perDay')}</option>
                        </select>
                      </div>
                    </div>

                    {/* Photos Management Section in Edit Mode */}
                    <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                            {t('equipment.photosCount', { count: editingItemPhotos.length })}
                          </label>
                          <p className="text-[11px] text-slate-500">
                            {t('equipment.photosLimitDesc')}
                          </p>
                        </div>
                        {editingItemPhotos.length < 5 && (
                          <div>
                            <input
                              ref={editPhotoInputRef}
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              multiple
                              onChange={handleOwnerUploadPhotos}
                              disabled={photoActionLoading}
                              className="hidden"
                              id="owner-dash-photo-upload"
                            />
                            <label
                              htmlFor="owner-dash-photo-upload"
                              className={`px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer flex items-center space-x-1 ${
                                photoActionLoading ? 'opacity-50 pointer-events-none' : ''
                              }`}
                            >
                              <span>{photoActionLoading ? t('equipment.uploadingPhotos') : t('equipment.uploadPhotos')}</span>
                            </label>
                          </div>
                        )}
                      </div>

                      {photoError && (
                        <div className="p-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs font-medium">
                          ⚠️ {photoError}
                        </div>
                      )}

                      {editingItemPhotos.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                          {editingItemPhotos.map((photo, idx) => {
                            const photoUrl = resolveImageUrl(photo.imageUrl);
                            const isPhotoPrimary = photo.id
                              ? (selectedPrimaryPhotoId === photo.id || Boolean(photo.isPrimary))
                              : Boolean(photo.isPrimary);
                            return (
                              <div
                                key={photo.id || idx}
                                className={`relative rounded-lg overflow-hidden border-2 bg-slate-100 h-28 group transition-all ${
                                  isPhotoPrimary
                                    ? 'border-emerald-600 ring-2 ring-emerald-500/40 shadow-xs'
                                    : 'border-slate-200'
                                }`}
                              >
                                <img
                                  src={photoUrl}
                                  alt={`Equipment photo ${idx + 1}`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />

                                {/* Primary Badge or Action */}
                                {isPhotoPrimary ? (
                                  <span className="absolute top-1.5 left-1.5 bg-emerald-700 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs flex items-center gap-1">
                                    <span>★</span>
                                    <span>{t('equipment.primaryPhoto')}</span>
                                  </span>
                                ) : (
                                  photo.id && (
                                    <button
                                      type="button"
                                      disabled={photoActionLoading}
                                      onClick={() => handleOwnerSetPrimary(photo.id)}
                                      className="absolute top-1.5 left-1.5 bg-slate-900/80 hover:bg-emerald-700 text-white text-[10px] font-semibold px-2 py-0.5 rounded transition-colors disabled:opacity-50 shadow-xs"
                                      title={t('equipment.setAsPrimary')}
                                    >
                                      {t('equipment.setAsPrimary')}
                                    </button>
                                  )
                                )}

                                {/* Delete Button */}
                                <button
                                  type="button"
                                  disabled={photoActionLoading}
                                  onClick={() => handleOwnerDeletePhoto(photo.id)}
                                  className="absolute top-1.5 right-1.5 bg-red-600 text-white hover:bg-red-700 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition-colors shadow-xs disabled:opacity-50"
                                  aria-label={t('equipment.removePhoto')}
                                  title={t('equipment.removePhoto')}
                                >
                                  ✕
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic py-2">
                          {t('equipment.noPhotosUploaded')}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        {t('equipment.description')}
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
                        {t('equipment.markAvailable')}
                      </label>
                    </div>

                    <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-100"
                      >
                        {t('common.cancel')}
                      </button>
                      <button
                        type="submit"
                        disabled={isUpdating}
                        className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs disabled:opacity-50"
                      >
                        {isUpdating ? t('common.saving') : t('common.saveChanges')}
                      </button>
                    </div>
                  </form>
                ) : (
                  /* EQUIPMENT LISTINGS */
                  <div className="space-y-4">
                    {isEquipmentLoading ? (
                      <div className="py-16 text-center text-slate-500 space-y-2">
                        <div className="animate-spin inline-block w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full"></div>
                        <p className="text-sm font-medium">{t('equipment.loadingEquipment')}</p>
                      </div>
                    ) : equipmentError ? (
                      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-800 text-sm">
                        <span>{equipmentError}</span>
                        <button
                          type="button"
                          onClick={loadEquipment}
                          className="ml-3 font-bold text-red-700 underline"
                        >
                          {t('common.retry')}
                        </button>
                      </div>
                    ) : myEquipment.length === 0 ? (
                      <div className="py-12 text-center bg-white border border-dashed border-slate-300 rounded-2xl space-y-3">
                        <span className="text-4xl">🚜</span>
                        <h4 className="text-base font-bold text-slate-900">{t('equipment.noEquipmentListingsYet')}</h4>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto">
                          {t('equipment.noEquipmentListingsDesc')}
                        </p>
                        <button
                          type="button"
                          onClick={() => setIsAddModalOpen(true)}
                          className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                        >
                          {t('equipment.listNewEquipmentNow')}
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
                              <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 shrink-0 bg-slate-100 flex items-center justify-center text-slate-400">
                                {resolveImageUrl(item.imageUrl) ? (
                                  <img
                                    src={resolveImageUrl(item.imageUrl)}
                                    alt={item.name}
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
                                  style={{ display: resolveImageUrl(item.imageUrl) ? 'none' : 'flex' }}
                                >
                                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                </div>
                                {item.images && item.images.length > 1 && (
                                  <span className="absolute bottom-0 right-0 bg-slate-900/80 text-white text-[9px] font-bold px-1 rounded-tl">
                                    📷{item.images.length}
                                  </span>
                                )}
                              </div>
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
                                    {item.isAvailable ? t('equipment.available') : t('equipment.unavailable')}
                                  </span>
                                </div>
                                <div className="text-xs text-slate-500 space-y-0.5">
                                  <p>🏷️ {getCategoryLabel(item.category)} • 📍 {item.location}</p>
                                  <p className="font-semibold text-emerald-700">
                                    ₹{formatNumber(item.price)} / {item.priceUnit === 'day' ? t('common.day') : t('common.hour')}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                              {deletingId === item.id ? (
                                <div className="flex items-center space-x-2 bg-red-50 p-1.5 rounded-lg border border-red-200">
                                  <span className="text-xs text-red-800 font-semibold">{t('equipment.deleteQuestion')}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteConfirm(item.id)}
                                    disabled={isDeleting}
                                    className="px-2.5 py-1 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded"
                                  >
                                    {isDeleting ? t('equipment.deleting') : t('common.yes')}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDeletingId(null)}
                                    className="px-2 py-1 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded"
                                  >
                                    {t('common.no')}
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => startEdit(item)}
                                    className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
                                  >
                                    {t('equipment.editListing')}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDeletingId(item.id)}
                                    className="px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
                                  >
                                    {t('common.delete')}
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
                    <p className="text-sm font-medium">{t('ownerDashboard.loadingRequests')}</p>
                  </div>
                ) : bookingsError ? (
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-800 text-sm">
                    <span>{bookingsError}</span>
                    <button type="button" onClick={loadBookings} className="ml-3 font-bold text-red-700 underline">
                      {t('common.retry')}
                    </button>
                  </div>
                ) : pendingRequests.length === 0 ? (
                  <div className="py-12 text-center bg-white border border-dashed border-slate-300 rounded-2xl space-y-2">
                    <span className="text-4xl">⏳</span>
                    <h4 className="text-base font-bold text-slate-900">{t('ownerDashboard.noPendingRequests')}</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      {t('ownerDashboard.noPendingRequestsDesc')}
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
                            src={resolveImageUrl(booking.imageUrl) || DEFAULT_FALLBACK_IMAGE}
                            alt={booking.equipmentName}
                            className="w-20 h-20 rounded-xl object-cover border border-slate-200 shrink-0 bg-slate-100"
                            onError={(e) => { e.currentTarget.src = DEFAULT_FALLBACK_IMAGE; }}
                          />
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2 flex-wrap">
                              <h3 className="text-base font-bold text-slate-900">{booking.equipmentName}</h3>
                              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                {t('booking.statusPending')}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
                              <span>🏷️ {getCategoryLabel(booking.equipmentCategory)}</span>
                              <span>📍 {booking.location}</span>
                              <span>👤 {t('booking.renter')} <strong>{booking.renterName}</strong></span>
                              {booking.renterPhone && <span>📞 {booking.renterPhone}</span>}
                            </div>
                            <div className="text-xs text-slate-500 space-y-0.5 pt-1">
                              <p>🗓️ <strong>{t('booking.start')}</strong> {formatDateTime(booking.startDateTime)}</p>
                              <p>🏁 <strong>{t('booking.end')}</strong> {formatDateTime(booking.endDateTime)} ({booking.duration} {booking.priceUnit === 'day' ? t('common.day') : t('common.hour')})</p>
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
                              ₹{booking.totalPrice ? formatNumber(booking.totalPrice) : '0'}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => handleApprove(booking.id)}
                              disabled={processingId === booking.id}
                              className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50 shadow-xs"
                            >
                              {processingId === booking.id && processingAction === 'approve' ? t('ownerDashboard.approving') : t('ownerDashboard.approve')}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReject(booking.id)}
                              disabled={processingId === booking.id}
                              className="px-3.5 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors disabled:opacity-50"
                            >
                              {processingId === booking.id && processingAction === 'reject' ? t('ownerDashboard.rejecting') : t('ownerDashboard.reject')}
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
                    <p className="text-sm font-medium">{t('ownerDashboard.loadingApproved')}</p>
                  </div>
                ) : approvedRentals.length === 0 ? (
                  <div className="py-12 text-center bg-white border border-dashed border-slate-300 rounded-2xl space-y-2">
                    <span className="text-4xl">✅</span>
                    <h4 className="text-base font-bold text-slate-900">{t('ownerDashboard.noApprovedRentals')}</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      {t('ownerDashboard.noApprovedRentalsDesc')}
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
                            src={resolveImageUrl(booking.imageUrl) || DEFAULT_FALLBACK_IMAGE}
                            alt={booking.equipmentName}
                            className="w-20 h-20 rounded-xl object-cover border border-slate-200 shrink-0 bg-slate-100"
                            onError={(e) => { e.currentTarget.src = DEFAULT_FALLBACK_IMAGE; }}
                          />
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2 flex-wrap">
                              <h3 className="text-base font-bold text-slate-900">{booking.equipmentName}</h3>
                              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {t('booking.statusApproved')}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
                              <span>🏷️ {getCategoryLabel(booking.equipmentCategory)}</span>
                              <span>📍 {booking.location}</span>
                              <span>👤 {t('booking.renter')} <strong>{booking.renterName}</strong></span>
                              {booking.renterPhone && <span>📞 {booking.renterPhone}</span>}
                            </div>
                            <div className="text-xs text-slate-500 space-y-0.5 pt-1">
                              <p>🗓️ <strong>{t('booking.start')}</strong> {formatDateTime(booking.startDateTime)}</p>
                              <p>🏁 <strong>{t('booking.end')}</strong> {formatDateTime(booking.endDateTime)} ({booking.duration} {booking.priceUnit === 'day' ? t('common.day') : t('common.hour')})</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto border-t md:border-t-0 border-slate-100 pt-3 md:pt-0 shrink-0 space-y-2">
                          <div className="text-left md:text-right">
                            <p className="text-xs text-slate-500 font-medium">{t('booking.totalPrice')}</p>
                            <p className="text-xl font-black text-emerald-700">
                              ₹{booking.totalPrice ? formatNumber(booking.totalPrice) : '0'}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleComplete(booking.id)}
                            disabled={processingId === booking.id}
                            className="px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 shadow-xs"
                          >
                            {processingId === booking.id && processingAction === 'complete' ? t('ownerDashboard.completing') : t('ownerDashboard.markCompleted')}
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
                  <span className="text-xs font-semibold text-slate-500 mr-1">{t('ownerDashboard.statusFilter')}</span>
                  {[
                    { id: 'ALL', label: t('ownerDashboard.allHistory', { count: formatNumber(historyBookings.length) }) },
                    { id: 'COMPLETED', label: t('ownerDashboard.completedHistory', { count: formatNumber(completedBookings.length) }) },
                    { id: 'REJECTED', label: t('ownerDashboard.rejectedHistory', { count: formatNumber(rejectedBookings.length) }) },
                    { id: 'CANCELLED', label: t('ownerDashboard.cancelledHistory', { count: formatNumber(cancelledBookings.length) }) },
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
                    <p className="text-sm font-medium">{t('ownerDashboard.loadingHistory')}</p>
                  </div>
                ) : filteredHistory.length === 0 ? (
                  <div className="py-12 text-center bg-white border border-dashed border-slate-300 rounded-2xl space-y-2">
                    <span className="text-4xl">📜</span>
                    <h4 className="text-base font-bold text-slate-900">
                      {t('ownerDashboard.noHistoryRecords', { status: historySubFilter !== 'ALL' ? getBookingStatusLabel(historySubFilter) : '' })}
                    </h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      {t('ownerDashboard.noHistoryRecordsDesc')}
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
                              src={resolveImageUrl(booking.imageUrl)}
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
                                <span>🏷️ {getCategoryLabel(booking.equipmentCategory)}</span>
                                <span>📍 {booking.location}</span>
                                {booking.renterName && (
                                  <span>👤 {t('booking.renter')} <strong>{booking.renterName}</strong></span>
                                )}
                                {booking.renterPhone && (
                                  <span>📞 {booking.renterPhone}</span>
                                )}
                              </div>
                              <div className="text-xs text-slate-500 space-y-0.5 pt-1">
                                <p>🗓️ <strong>{t('booking.rentalPeriod')}</strong> {formatDateTime(booking.startDateTime)} to {formatDateTime(booking.endDateTime)}</p>
                                {booking.duration && (
                                  <p>⏱️ <strong>{t('booking.duration')}</strong> {booking.duration} {booking.priceUnit === 'day' ? t('common.day') : t('common.hour')}</p>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="text-left md:text-right shrink-0 border-t md:border-t-0 border-slate-100 pt-3 md:pt-0 w-full md:w-auto">
                            <p className="text-xs text-slate-500 font-medium">{t('booking.rentalTotal')}</p>
                            <p className="text-xl font-black text-slate-800">
                              ₹{booking.totalPrice ? formatNumber(booking.totalPrice) : '0'}
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
                      {t('ownerDashboard.completedRentalValue')}
                    </span>
                    <h2 className="text-3xl font-black tracking-tight text-white">
                      ₹{formatNumber(completedRentalValue)}
                    </h2>
                    <p className="text-xs text-emerald-100 max-w-md">
                      {t('ownerDashboard.completedRentalValueDesc')}
                    </p>
                  </div>
                  <div className="text-right shrink-0 bg-white/10 backdrop-blur-xs px-5 py-3 rounded-xl border border-white/20">
                    <span className="block text-2xl font-black text-white">{formatNumber(completedBookings.length)}</span>
                    <span className="text-xs text-emerald-100 font-medium">{t('ownerDashboard.completedRentalsCount')}</span>
                  </div>
                </div>

                {/* Equipment Value Breakdown */}
                {equipmentEarningsBreakdown.length > 0 && (
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                    <div className="border-b border-slate-200 pb-3">
                      <h3 className="text-base font-bold text-slate-900">
                        {t('ownerDashboard.valueByEquipment')}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {t('ownerDashboard.valueByEquipmentDesc')}
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
                              {getCategoryLabel(group.category)}
                            </span>
                          </div>
                          <p className="text-xl font-black text-emerald-700">
                            ₹{formatNumber(group.total)}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {t('ownerDashboard.completedRentalsCountUnit', { count: formatNumber(group.count) })}
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
                        {t('ownerDashboard.monthlyValue')}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {t('ownerDashboard.monthlyValueDesc')}
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
                            ₹{formatNumber(group.total)}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {t('ownerDashboard.completedRentalsCountUnit', { count: formatNumber(group.count) })}
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
                      {t('ownerDashboard.contributingRentals')}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {t('ownerDashboard.contributingRentalsDesc')}
                    </p>
                  </div>

                  {completedBookings.length === 0 ? (
                    <div className="py-8 text-center text-slate-500 space-y-1">
                      <p className="text-sm font-semibold">{t('ownerDashboard.noCompletedRentalsYet')}</p>
                      <p className="text-xs text-slate-400">
                        {t('ownerDashboard.noCompletedRentalsYetDesc')}
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
                              src={resolveImageUrl(b.imageUrl)}
                              alt={b.equipmentName}
                              className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0 bg-slate-100"
                            />
                            <div>
                              <p className="font-bold text-slate-900 text-sm">{b.equipmentName}</p>
                              <p className="text-slate-500">
                                {getCategoryLabel(b.equipmentCategory)} • {formatDateTime(b.startDateTime)} to {formatDateTime(b.endDateTime)}
                              </p>
                              {b.renterName && (
                                <p className="text-slate-600 font-medium">👤 {t('booking.renter')} {b.renterName}</p>
                              )}
                            </div>
                          </div>
                          <div className="text-left sm:text-right">
                            <span className="text-sm font-extrabold text-emerald-700">
                              ₹{b.totalPrice ? formatNumber(b.totalPrice) : '0'}
                            </span>
                            <span className="block text-[11px] text-slate-400">
                              {b.duration} {b.priceUnit === 'day' ? t('common.day') : t('common.hour')}
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
                      {t('ownerDashboard.ownerReputation')}
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
                      {t('ownerDashboard.ownerReputationDesc')}
                    </p>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl px-5 py-3.5 text-right shrink-0 shadow-xs">
                    <span className="block text-2xl font-black text-slate-900">
                      {formatNumber(ownerRatingSummary ? ownerRatingSummary.totalReviews : 0)}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {t('ownerDashboard.verifiedReviews')}
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
                    {t('ownerDashboard.feedbackFromRenters')}
                  </h3>

                  {isReviewsLoading ? (
                    <div className="py-12 text-center text-slate-500 space-y-2">
                      <div className="animate-spin inline-block w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full" />
                      <p className="text-xs font-medium">{t('ownerDashboard.loadingFeedback')}</p>
                    </div>
                  ) : ownerReviews.length === 0 ? (
                    <div className="py-12 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl space-y-2">
                      <span className="text-3xl">⭐</span>
                      <h4 className="text-sm font-bold text-slate-800">{t('ownerDashboard.noReviewsYetOwner')}</h4>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        {t('ownerDashboard.noReviewsYetOwnerDesc')}
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
                                  ? formatDateTime(rev.createdAt, { hour: undefined, minute: undefined })
                                  : ''}
                              </span>
                            </div>
                          </div>

                          {rev.feedback ? (
                            <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 italic">
                              "{rev.feedback}"
                            </p>
                          ) : (
                            <p className="text-[11px] text-slate-400 italic">{t('reviews.noWrittenComments')}</p>
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
          setSuccessMessage(msg || t('equipment.createSuccess', { name: '' }));
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
          <p>{t('home.footerCopyright', { year: new Date().getFullYear() })}</p>
          <div className="flex space-x-6">
            <button type="button" onClick={onNavigateToHome} className="hover:text-white transition-colors">
              {t('home.footerBrowse')}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default OwnerDashboard;
