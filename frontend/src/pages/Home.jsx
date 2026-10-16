import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/layout/Navbar';
import HomeSearch from '../components/home/HomeSearch';
import EquipmentCard from '../features/equipment/components/EquipmentCard';
import BookingModal from '../components/home/BookingModal';
import AddEquipmentModal from '../features/equipment/components/AddEquipmentModal';
import MyEquipmentModal from '../features/equipment/components/MyEquipmentModal';
import MyBookingsModal from '../features/booking/components/MyBookingsModal';
import OwnerDashboardModal from '../features/dashboard/components/OwnerDashboardModal';
import { fetchPublicEquipment } from '../services/equipmentService';
import { useAuth } from '../context/AuthContext';

// Default fallback image for listings without a custom image URL
const DEFAULT_FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1592861956120-e524fc739696?auto=format&fit=crop&w=600&q=80';

/**
 * Home Page Component for AgroRent Platform
 * Integrated with Spring Boot REST API for public equipment browsing,
 * rental booking creation, equipment management, and booking history modals.
 */
const Home = ({ onNavigateToOwnerDashboard, onNavigateToMyBookings }) => {
  const { isAuthenticated } = useAuth();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [locationSearch, setLocationSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All Categories');

  // Equipment Data & Loading State
  const [equipmentList, setEquipmentList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState('');

  // Modals and Notices State
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [initialShowReviews, setInitialShowReviews] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isMyModalOpen, setIsMyModalOpen] = useState(false);
  const [isMyBookingsOpen, setIsMyBookingsOpen] = useState(false);
  const [isOwnerDashboardOpen, setIsOwnerDashboardOpen] = useState(false);
  const [unimplementedNotice, setUnimplementedNotice] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  /**
   * Fetch public equipment from backend API with active search parameters.
   */
  const loadEquipment = useCallback(async () => {
    setIsLoading(true);
    setApiError('');
    try {
      const response = await fetchPublicEquipment({
        keyword: searchTerm,
        category: activeCategory,
        location: locationSearch,
      });
      setEquipmentList(response.data || []);
    } catch (err) {
      setApiError(err.message || 'Unable to connect to AgroRent backend server.');
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, activeCategory, locationSearch]);

  // Debounced API fetch when search filters change
  useEffect(() => {
    const handler = setTimeout(() => {
      loadEquipment();
    }, 300);

    return () => clearTimeout(handler);
  }, [loadEquipment]);

  // Automatically refresh equipment cards when a new review is submitted
  useEffect(() => {
    const handleReviewSubmitted = () => {
      loadEquipment();
    };
    window.addEventListener('agrorent:review-submitted', handleReviewSubmitted);
    return () => {
      window.removeEventListener('agrorent:review-submitted', handleReviewSubmitted);
    };
  }, [loadEquipment]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setLocationSearch('');
    setActiveCategory('All Categories');
  };

  const handleNavClick = (navItem) => {
    if (!navItem.implemented) {
      setUnimplementedNotice(
        `Note: "${navItem.label}" page navigation will be enabled in upcoming releases.`
      );
      setTimeout(() => setUnimplementedNotice(null), 4000);
    }
  };

  const handleBookingConfirm = (createdBooking) => {
    setSelectedEquipment(null);
    setInitialShowReviews(false);
    const status = createdBooking?.status?.toUpperCase();
    const bookingId = createdBooking?.id ? `#${createdBooking.id}` : '';

    let msg;
    if (status === 'APPROVED') {
      msg = `🎉 Booking ${bookingId} confirmed! Your rental has been instantly approved.`;
    } else if (status === 'PENDING') {
      msg = `⏳ Booking ${bookingId} request submitted! Awaiting owner decision.`;
    } else {
      msg = `Booking ${bookingId} submitted successfully!`;
    }

    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 5000);
  };

  const handleListingCreated = (message) => {
    setToastMessage(message || 'Equipment listing created successfully!');
    setTimeout(() => setToastMessage(null), 5000);
    loadEquipment();
  };

  const handleSelectEquipmentToRent = (item, openReviews = false) => {
    setInitialShowReviews(openReviews);
    setSelectedEquipment(item);
  };

  const handleOpenAddModal = () => {
    if (isAuthenticated) {
      setIsAddModalOpen(true);
    } else {
      setUnimplementedNotice('Please log in to your farmer account to list equipment.');
      setTimeout(() => setUnimplementedNotice(null), 4000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header Navigation */}
      <Navbar
        currentPage="home"
        onOpenMyBookings={onNavigateToMyBookings}
        onOpenOwnerDashboard={onNavigateToOwnerDashboard}
        onNavigateToHome={() => {}}
      />

      {/* Unobtrusive Notice for Pending Actions */}
      {unimplementedNotice && (
        <div className="bg-amber-50 text-amber-900 border-b border-amber-200 text-center py-2.5 px-4 text-xs font-medium sticky top-16 z-40 transition-all">
          ℹ️ {unimplementedNotice}
        </div>
      )}

      {/* Confirmation Toast */}
      {toastMessage && (
        <div className="bg-emerald-600 text-white text-center py-3 px-4 font-semibold text-sm shadow-md sticky top-16 z-40 animate-in fade-in">
          {toastMessage}
        </div>
      )}

      {/* Main Search & Location Selection (Area 1 & Area 2) */}
      <HomeSearch
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        locationSearch={locationSearch}
        onLocationChange={setLocationSearch}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        onResetFilters={handleResetFilters}
      />

      {/* Area 3: All Equipment */}
      <main id="browse" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow w-full space-y-8">
        <section className="space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              All Equipment
            </h2>
          </div>

          {/* API Loading Spinner */}
          {isLoading ? (
            <div className="py-16 text-center text-slate-500 space-y-3">
              <div className="animate-spin inline-block w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full"></div>
              <p className="text-sm font-medium">Fetching available equipment from AgroRent backend...</p>
            </div>
          ) : apiError ? (
            /* API Error Banner */
            <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center max-w-lg mx-auto space-y-3">
              <div className="text-3xl">⚠️</div>
              <h3 className="text-base font-bold text-red-900">Backend Server Connection Error</h3>
              <p className="text-xs text-red-700">{apiError}</p>
              <button
                type="button"
                onClick={loadEquipment}
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white font-semibold text-xs rounded-xl hover:bg-red-700 transition-colors"
              >
                Retry Connecting
              </button>
            </div>
          ) : equipmentList.length > 0 ? (
            /* Live Equipment Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {equipmentList.map((item) => (
                <EquipmentCard
                  key={item.id}
                  image={item.imageUrl && item.imageUrl.trim() ? item.imageUrl : DEFAULT_FALLBACK_IMAGE}
                  name={item.name}
                  category={item.category}
                  price={item.price}
                  priceUnit={item.priceUnit}
                  bookingType={item.bookingType}
                  distance={item.location}
                  ownerId={item.ownerId}
                  ownerName={item.ownerName}
                  ownerRating={item.ownerRating}
                  ownerTotalReviews={item.ownerTotalReviews}
                  onSelect={() => handleSelectEquipmentToRent(item, false)}
                  onViewReviews={() => handleSelectEquipmentToRent(item, true)}
                />
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center max-w-md mx-auto space-y-3">
              <div className="text-3xl">🌾</div>
              <h3 className="text-base font-bold text-slate-900">No equipment found</h3>
              <p className="text-xs text-slate-500">
                No machinery matched your active keyword or location filter. Try adjusting your search query.
              </p>
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white font-semibold text-xs rounded-xl hover:bg-emerald-700 transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </section>
      </main>

      {/* Modals */}
      {selectedEquipment && (
        <BookingModal
          equipment={selectedEquipment}
          initialShowReviews={initialShowReviews}
          onClose={() => {
            setSelectedEquipment(null);
            setInitialShowReviews(false);
          }}
          onConfirm={handleBookingConfirm}
        />
      )}

      <AddEquipmentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleListingCreated}
      />

      <MyEquipmentModal
        isOpen={isMyModalOpen}
        onClose={() => setIsMyModalOpen(false)}
        onRefreshData={loadEquipment}
        onOpenAddEquipment={() => {
          setIsMyModalOpen(false);
          handleOpenAddModal();
        }}
      />

      <MyBookingsModal
        isOpen={isMyBookingsOpen}
        onClose={() => setIsMyBookingsOpen(false)}
      />

      <OwnerDashboardModal
        isOpen={isOwnerDashboardOpen}
        onClose={() => setIsOwnerDashboardOpen(false)}
      />

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8 px-4 border-t border-slate-800 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm">
          <p>© {new Date().getFullYear()} AgroRent - Farmer Equipment Rental Platform. All rights reserved.</p>
          <div className="flex space-x-6">
            <a href="#home" className="hover:text-white transition-colors">Home</a>
            <a href="#browse" className="hover:text-white transition-colors">Browse Equipment</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
