import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext';
import {
  fetchMyEquipment,
  updateEquipment,
  deleteEquipment,
  uploadEquipmentPhotos,
  deleteEquipmentPhoto,
  setPrimaryEquipmentPhoto,
  resolveImageUrl,
} from '../../../services/equipmentService';

/**
 * MyEquipmentModal Component
 * Allows authenticated farmers to manage (view, edit, upload/remove photos, delete)
 * their own equipment listings.
 */
const MyEquipmentModal = ({ isOpen, onClose, onRefreshData, onOpenAddEquipment }) => {
  if (!isOpen) return null;

  const { token, isAuthenticated } = useAuth();
  const fileInputRef = useRef(null);

  const [myListings, setMyListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [generalError, setGeneralError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Editing state
  const [editingItem, setEditingItem] = useState(null);
  const [editingItemPhotos, setEditingItemPhotos] = useState([]);
  const [selectedPrimaryPhotoId, setSelectedPrimaryPhotoId] = useState(null);
  const [photoActionLoading, setPhotoActionLoading] = useState(false);
  const [photoError, setPhotoError] = useState('');
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

  const MAX_PHOTOS = 5;
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

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
      setPhotoError('');
    }
  }, [isOpen, loadListings]);

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
    setGeneralError('');
    setPhotoError('');
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setEditingItemPhotos([]);
    setSelectedPrimaryPhotoId(null);
    setFieldErrors({});
    setPhotoError('');
  };

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    setEditFormData((prev) => ({ ...prev, [name]: val }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleUploadPhotos = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !editingItem) return;
    setPhotoError('');

    if (editingItemPhotos.length + files.length > MAX_PHOTOS) {
      setPhotoError(`Maximum ${MAX_PHOTOS} photos allowed per equipment listing.`);
      return;
    }

    const allowedExts = ['.jpg', '.jpeg', '.png', '.webp'];
    for (const file of files) {
      const lowerName = file.name ? file.name.toLowerCase() : '';
      const hasValidExt = allowedExts.some((ext) => lowerName.endsWith(ext));

      if (!ALLOWED_TYPES.includes(file.type.toLowerCase()) || !hasValidExt) {
        setPhotoError(`"${file.name}" has an unsupported format. Only JPEG, PNG, and WebP are allowed.`);
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setPhotoError(`"${file.name}" exceeds the maximum 5MB size limit.`);
        return;
      }
      if (file.size === 0) {
        setPhotoError(`"${file.name}" is empty. Please choose a valid photo.`);
        return;
      }

      try {
        await new Promise((resolve, reject) => {
          const testUrl = URL.createObjectURL(file);
          const img = new Image();
          img.onload = () => {
            URL.revokeObjectURL(testUrl);
            resolve(true);
          };
          img.onerror = () => {
            URL.revokeObjectURL(testUrl);
            reject(new Error(`"${file.name}" contains invalid or unreadable image content.`));
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
        setSuccessMessage('Photos uploaded successfully.');
        await loadListings();
        if (onRefreshData) onRefreshData();
      }
    } catch (err) {
      setPhotoError(err.message || 'Failed to upload photos.');
    } finally {
      setPhotoActionLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeletePhoto = async (photoId) => {
    if (!editingItem) return;
    if (!photoId) {
      // Legacy photo without database ID: clear imageUrl locally
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
        setSuccessMessage('Photo removed successfully.');
        await loadListings();
        if (onRefreshData) onRefreshData();
      }
    } catch (err) {
      setPhotoError(err.message || 'Failed to remove photo.');
    } finally {
      setPhotoActionLoading(false);
    }
  };

  const handleSetPrimary = async (photoId) => {
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
        setSuccessMessage('Primary photo updated.');
        await loadListings();
        if (onRefreshData) onRefreshData();
      }
    } catch (err) {
      setPhotoError(err.message || 'Failed to update primary photo.');
    } finally {
      setPhotoActionLoading(false);
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
        primaryImageId: selectedPrimaryPhotoId || (editingItemPhotos.find((p) => p.isPrimary)?.id) || null,
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
        <div className="bg-emerald-700 px-6 py-5 text-white relative flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight">My Equipment Listings</h2>
            <p className="text-xs text-emerald-100 mt-1">
              Manage, edit photos, update availability, or remove your machinery
            </p>
          </div>
          <div className="flex items-center space-x-3 pr-8">
            {onOpenAddEquipment && (
              <button
                type="button"
                onClick={onOpenAddEquipment}
                className="px-3.5 py-1.5 bg-white text-emerald-800 hover:bg-emerald-50 font-bold text-xs rounded-lg shadow-sm transition-colors flex items-center space-x-1 shrink-0"
              >
                <span>+ List New Equipment</span>
              </button>
            )}
          </div>
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

              {/* Photos Management Section in Edit Mode */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Equipment Photos ({editingItemPhotos.length}/{MAX_PHOTOS})
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Manage uploaded photos or add new ones (JPEG, PNG, WebP up to 5MB)
                    </p>
                  </div>
                  {editingItemPhotos.length < MAX_PHOTOS && (
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        onChange={handleUploadPhotos}
                        disabled={photoActionLoading}
                        className="hidden"
                        id="edit-equipment-photo-upload"
                      />
                      <label
                        htmlFor="edit-equipment-photo-upload"
                        className={`px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer flex items-center space-x-1 ${
                          photoActionLoading ? 'opacity-50 pointer-events-none' : ''
                        }`}
                      >
                        <span>{photoActionLoading ? 'Uploading...' : '+ Upload Photos'}</span>
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
                              <span>Primary Photo</span>
                            </span>
                          ) : (
                            photo.id && (
                              <button
                                type="button"
                                disabled={photoActionLoading}
                                onClick={() => handleSetPrimary(photo.id)}
                                className="absolute top-1.5 left-1.5 bg-slate-900/80 hover:bg-emerald-700 text-white text-[10px] font-semibold px-2 py-0.5 rounded transition-colors disabled:opacity-50 shadow-xs"
                                title="Click to set this as the main cover photo"
                              >
                                Set as Primary
                              </button>
                            )
                          )}

                          {/* Delete Button */}
                          <button
                            type="button"
                            disabled={photoActionLoading}
                            onClick={() => handleDeletePhoto(photo.id)}
                            className="absolute top-1.5 right-1.5 bg-red-600 text-white hover:bg-red-700 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition-colors shadow-xs disabled:opacity-50"
                            aria-label="Remove photo"
                            title="Remove photo"
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic py-2">
                    No photos currently uploaded for this equipment. Click "+ Upload Photos" above to add photos.
                  </p>
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
                <div className="py-10 px-6 text-center bg-slate-50 border border-dashed border-slate-300 rounded-xl space-y-2">
                  <span className="text-3xl">🚜</span>
                  <h4 className="text-sm font-bold text-slate-800">No equipment listings yet</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    You haven't added any machinery to AgroRent yet. Use the "+ List New Equipment" button above to add a listing.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-emerald-50/60 border border-emerald-100 rounded-xl px-4 py-2.5">
                    <span className="text-xs font-semibold text-emerald-900">
                      Total Listed Machinery: <strong>{myListings.length}</strong>
                    </span>
                  </div>
                  {myListings.map((item) => {
                    const primaryThumb = resolveImageUrl(item.imageUrl);
                    return (
                      <div
                        key={item.id}
                        className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-emerald-300 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          {/* Primary Thumbnail */}
                          <div className="w-16 h-16 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200 relative">
                            {primaryThumb ? (
                              <img
                                src={primaryThumb}
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
                              className="w-full h-full flex items-center justify-center text-slate-400 text-xl"
                              style={{ display: primaryThumb ? 'none' : 'flex' }}
                            >
                              🚜
                            </div>
                            {item.images && item.images.length > 1 && (
                              <div className="absolute bottom-0 right-0 bg-slate-900/80 text-white text-[9px] font-bold px-1 rounded-tl">
                                📷{item.images.length}
                              </div>
                            )}
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <h4 className="text-base font-bold text-slate-900">{item.name}</h4>
                              <span
                                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                                  item.isAvailable
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
                                Edit & Photos
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
                    );
                  })}
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
