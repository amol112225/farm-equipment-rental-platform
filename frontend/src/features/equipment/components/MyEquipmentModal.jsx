import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { fetchMyEquipment, updateEquipment, deleteEquipment } from '../../../services/equipmentService';

/**
 * MyEquipmentModal Component
 * Allows authenticated farmers to manage (view, edit availability, update, delete) their own equipment listings.
 */
const MyEquipmentModal = ({ isOpen, onClose, onRefreshData }) => {
  if (!isOpen) return null;

  const { token, isAuthenticated, currentFarmer } = useAuth();

  const [myListings, setMyListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [generalError, setGeneralError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Editing state
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

  // Deleting confirmation state
  const [deletingId, setDeletingId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const categories = [
    'Tractors',
    'Harvesters',
    'Rotavators',
    'Seed Drills',
    'Cultivators',
    'Sprayers',
    'Power Tillers',
    'Other Machinery',
  ];

  const loadListings = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setGeneralError('');
    try {
      const response = await fetchMyEquipment(token);
      setMyListings(response.data || []);
    } catch (err) {
      setGeneralError(err.message || 'Failed to load your equipment listings.');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (isOpen) {
      loadListings();
      setEditingItem(null);
      setDeletingId(null);
      setSuccessMessage('');
    }
  }, [isOpen, loadListings]);

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
    setGeneralError('');
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
    setFieldErrors({});
    setGeneralError('');

    if (!editingItem) return;

    const numericPrice = parseFloat(editFormData.price);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      setFieldErrors((prev) => ({
        ...prev,
        price: 'Price must be a positive value greater than zero.',
      }));
      return;
    }

    setIsUpdating(true);

    try {
      const payload = {
        name: editFormData.name.trim(),
        category: editFormData.category.trim(),
        description: editFormData.description ? editFormData.description.trim() : '',
        price: numericPrice,
        priceUnit: editFormData.priceUnit,
        bookingType: editFormData.bookingType,
        location: editFormData.location.trim(),
        imageUrl: editFormData.imageUrl ? editFormData.imageUrl.trim() : null,
        isAvailable: editFormData.isAvailable,
      };

      await updateEquipment(editingItem.id, payload, token);
      setIsUpdating(false);
      setSuccessMessage(`Listing "${payload.name}" updated successfully.`);
      setEditingItem(null);
      await loadListings();
      if (onRefreshData) onRefreshData();
    } catch (err) {
      setIsUpdating(false);
      if (err.errors) {
        setFieldErrors(err.errors);
      }
      setGeneralError(err.message || 'Failed to update equipment listing.');
    }
  };

  const handleDeleteConfirm = async (id) => {
    setIsDeleting(true);
    setGeneralError('');
    try {
      await deleteEquipment(id, token);
      setIsDeleting(false);
      setDeletingId(null);
      setSuccessMessage('Equipment listing deleted successfully.');
      await loadListings();
      if (onRefreshData) onRefreshData();
    } catch (err) {
      setIsDeleting(false);
      setDeletingId(null);
      setGeneralError(err.message || 'Failed to delete equipment listing.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-emerald-700 px-6 py-5 text-white relative">
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
          <h2 className="text-xl font-bold tracking-tight">My Equipment Listings</h2>
          <p className="text-xs text-emerald-100 mt-1">
            Manage, edit, or remove your registered agricultural machinery
          </p>
        </div>

        {/* Scroll Body */}
        <div className="p-6 overflow-y-auto space-y-4">
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

          {editingItem ? (
            /* EDIT FORM INLINE */
            <form onSubmit={handleUpdateSubmit} className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="text-base font-bold text-slate-900">
                  Editing: {editingItem.name}
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    {categories.map((cat) => (
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Booking Preference *
                  </label>
                  <select
                    name="bookingType"
                    required
                    value={editFormData.bookingType}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="instant">Instant Booking</option>
                    <option value="request">Request to Book</option>
                    <option value="both">Both (Instant / Request)</option>
                  </select>
                </div>

                <div className="flex items-center pt-6">
                  <label className="relative flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="isAvailable"
                      checked={editFormData.isAvailable}
                      onChange={handleEditChange}
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                    />
                    <span className="text-sm font-semibold text-slate-800">Available for Rent</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Image URL (Optional)
                </label>
                <input
                  type="url"
                  name="imageUrl"
                  maxLength={500}
                  value={editFormData.imageUrl}
                  onChange={handleEditChange}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Description (Optional)
                </label>
                <textarea
                  name="description"
                  rows={2}
                  maxLength={2000}
                  value={editFormData.description}
                  onChange={handleEditChange}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm disabled:opacity-60"
                >
                  {isUpdating ? 'Saving Changes...' : 'Update Listing'}
                </button>
              </div>
            </form>
          ) : (
            /* LISTINGS TABLE/CARDS */
            <div>
              {isLoading ? (
                <div className="py-12 text-center text-slate-500 space-y-2">
                  <div className="animate-spin inline-block w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full"></div>
                  <p className="text-sm">Loading your equipment listings...</p>
                </div>
              ) : myListings.length === 0 ? (
                <div className="py-10 text-center bg-slate-50 border border-dashed border-slate-300 rounded-xl space-y-2">
                  <span className="text-3xl">🚜</span>
                  <h4 className="text-sm font-bold text-slate-800">No equipment listings yet</h4>
                  <p className="text-xs text-slate-500">
                    You haven't added any machinery to AgroRent. Click "List Your Equipment" to create your first listing.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {myListings.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-emerald-300 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-base font-bold text-slate-900">{item.name}</h4>
                          <span
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${item.isAvailable
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}
                          >
                            {item.isAvailable ? 'Available' : 'Unavailable'}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                          <span>🏷️ {item.category}</span>
                          <span>💰 ₹{item.price} / {item.priceUnit}</span>
                          <span>📍 {item.location}</span>
                          <span>⚡ {item.bookingType}</span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center space-x-2 shrink-0">
                        {deletingId === item.id ? (
                          <div className="flex items-center space-x-2 bg-red-50 p-2 rounded-lg border border-red-200">
                            <span className="text-xs text-red-800 font-semibold">Delete?</span>
                            <button
                              type="button"
                              onClick={() => handleDeleteConfirm(item.id)}
                              disabled={isDeleting}
                              className="px-2.5 py-1 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded transition-colors"
                            >
                              {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingId(null)}
                              className="px-2.5 py-1 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded"
                            >
                              Cancel
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
      </div>
    </div>
  );
};

export default MyEquipmentModal;
