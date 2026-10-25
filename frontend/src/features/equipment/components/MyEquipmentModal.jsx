import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useLanguage } from '../../../context/LanguageContext';
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
 * their own equipment listings with multilingual support.
 */
const MyEquipmentModal = ({ isOpen, onClose, onRefreshData, onOpenAddEquipment }) => {
  const { token, isAuthenticated } = useAuth();
  const { t, formatCurrency, getCategoryLabel } = useLanguage();
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
      setGeneralError(err.message || t('common.serverError'));
    } finally {
      setIsLoading(false);
    }
  }, [token, t]);

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
    const primary = photos.find((p) => p && (p.isPrimary || p.primary));
    setSelectedPrimaryPhotoId(primary?.id || null);
    setPhotoError('');
    setEditFormData({
      name: item.name || '',
      category: item.category || 'Tractors',
      description: item.description || '',
      price: item.price || '',
      priceUnit: item.priceUnit || 'hour',
      bookingType: item.bookingType || 'instant',
      location: item.location || '',
      imageUrl: item.imageUrl || '',
      isAvailable: item.isAvailable !== undefined ? item.isAvailable : true,
    });
    setFieldErrors({});
    setGeneralError('');
    setSuccessMessage('');
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

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!editingItem) return;
    setFieldErrors({});
    setGeneralError('');
    setIsUpdating(true);

    const numericPrice = parseFloat(editFormData.price);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      setFieldErrors((prev) => ({
        ...prev,
        price: t('equipment.price'),
      }));
      setIsUpdating(false);
      return;
    }

    try {
      const payload = {
        name: editFormData.name.trim(),
        category: editFormData.category.trim(),
        description: editFormData.description ? editFormData.description.trim() : null,
        price: numericPrice,
        priceUnit: editFormData.priceUnit,
        bookingType: editFormData.bookingType,
        location: editFormData.location.trim(),
        imageUrl: editFormData.imageUrl ? editFormData.imageUrl.trim() : null,
        isAvailable: editFormData.isAvailable,
      };

      const res = await updateEquipment(editingItem.id, payload, token);
      const updatedListing = res.data;

      setMyListings((prev) =>
        prev.map((item) => (item.id === editingItem.id ? updatedListing : item))
      );
      setSuccessMessage(t('equipment.updateSuccess'));
      setEditingItem(null);
      if (onRefreshData) onRefreshData();
    } catch (err) {
      if (err.errors) {
        setFieldErrors(err.errors);
      }
      setGeneralError(err.message || t('common.serverError'));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUploadNewPhotos = async (e) => {
    if (!editingItem) return;
    setPhotoError('');
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (editingItemPhotos.length + files.length > MAX_PHOTOS) {
      setPhotoError(t('equipment.maxPhotosLimit', { max: MAX_PHOTOS }));
      return;
    }

    const allowedExts = ['.jpg', '.jpeg', '.png', '.webp'];
    for (const file of files) {
      const lower = file.name ? file.name.toLowerCase() : '';
      const hasValidExt = allowedExts.some((ext) => lower.endsWith(ext));
      if (!ALLOWED_TYPES.includes(file.type.toLowerCase()) || !hasValidExt) {
        setPhotoError(t('equipment.unsupportedFormat', { name: file.name }));
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setPhotoError(t('equipment.fileTooLarge', { name: file.name }));
        return;
      }
      if (file.size === 0) {
        setPhotoError(t('equipment.fileEmpty', { name: file.name }));
        return;
      }
    }

    setPhotoActionLoading(true);
    try {
      const res = await uploadEquipmentPhotos(editingItem.id, files, token);
      const updatedItem = res.data;
      if (updatedItem && updatedItem.images) {
        setEditingItemPhotos(updatedItem.images);
        const primary = updatedItem.images.find((img) => img && (img.isPrimary || img.primary));
        setSelectedPrimaryPhotoId(primary?.id || null);
        setMyListings((prev) =>
          prev.map((item) => (item.id === editingItem.id ? updatedItem : item))
        );
        setSuccessMessage(t('equipment.photoUploadedSuccess'));
      }
    } catch (err) {
      setPhotoError(err.message || t('common.serverError'));
    } finally {
      setPhotoActionLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSetPrimaryPhoto = async (photoId) => {
    if (!editingItem || !photoId) return;
    setPhotoActionLoading(true);
    setPhotoError('');
    try {
      const res = await setPrimaryEquipmentPhoto(editingItem.id, photoId, token);
      const updatedItem = res.data;
      if (updatedItem && updatedItem.images) {
        setEditingItemPhotos(updatedItem.images);
        setSelectedPrimaryPhotoId(photoId);
        setMyListings((prev) =>
          prev.map((item) => (item.id === editingItem.id ? updatedItem : item))
        );
        setSuccessMessage(t('equipment.primaryPhotoSuccess'));
      }
    } catch (err) {
      setPhotoError(err.message || t('common.serverError'));
    } finally {
      setPhotoActionLoading(false);
    }
  };

  const handleDeletePhoto = async (photoId) => {
    if (!editingItem || !photoId) return;
    setPhotoActionLoading(true);
    setPhotoError('');
    try {
      const res = await deleteEquipmentPhoto(editingItem.id, photoId, token);
      const updatedItem = res.data;
      if (updatedItem && updatedItem.images) {
        setEditingItemPhotos(updatedItem.images);
        const primary = updatedItem.images.find((img) => img && (img.isPrimary || img.primary));
        setSelectedPrimaryPhotoId(primary?.id || null);
        setMyListings((prev) =>
          prev.map((item) => (item.id === editingItem.id ? updatedItem : item))
        );
        setSuccessMessage(t('equipment.photoDeletedSuccess'));
      }
    } catch (err) {
      setPhotoError(err.message || t('common.serverError'));
    } finally {
      setPhotoActionLoading(false);
    }
  };

  const handleDeleteConfirm = async (id) => {
    setIsDeleting(true);
    setGeneralError('');
    try {
      await deleteEquipment(id, token);
      const deletedItem = myListings.find((item) => item.id === id);
      setMyListings((prev) => prev.filter((item) => item.id !== id));
      setSuccessMessage(t('equipment.deleteSuccess', { name: deletedItem ? deletedItem.name : '' }));
      setDeletingId(null);
      if (onRefreshData) onRefreshData();
    } catch (err) {
      setGeneralError(err.message || t('common.serverError'));
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-emerald-700 px-6 py-5 text-white flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight">{t('equipment.myListings')}</h2>
            <p className="text-xs text-emerald-100 mt-0.5">
              {myListings.length} {t('equipment.myEquipment')}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onOpenAddEquipment}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              {t('nav.listNewEquipment')}
            </button>
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

          {editingItem ? (
            /* Inline Edit Form */
            <form onSubmit={handleUpdateSubmit} className="space-y-4 bg-slate-50 p-5 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="text-base font-bold text-slate-900">
                  {t('equipment.editEquipment', { name: editingItem.name })}
                </h3>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
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
                    {categories.map((cat) => (
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
                  {editingItemPhotos.length < MAX_PHOTOS && (
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        onChange={handleUploadNewPhotos}
                        disabled={photoActionLoading}
                        className="hidden"
                        id="modal-edit-photo-upload"
                      />
                      <label
                        htmlFor="modal-edit-photo-upload"
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
                        ? selectedPrimaryPhotoId === photo.id || Boolean(photo.isPrimary)
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
                                onClick={() => handleSetPrimaryPhoto(photo.id)}
                                className="absolute top-1.5 left-1.5 bg-slate-900/80 hover:bg-emerald-700 text-white text-[10px] font-semibold px-2 py-0.5 rounded transition-colors disabled:opacity-50 shadow-xs cursor-pointer"
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
                            onClick={() => handleDeletePhoto(photo.id)}
                            className="absolute top-1.5 right-1.5 bg-red-600 text-white hover:bg-red-700 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
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
                  id="isAvailableCheckboxModal"
                  name="isAvailable"
                  checked={editFormData.isAvailable}
                  onChange={handleEditChange}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                />
                <label htmlFor="isAvailableCheckboxModal" className="text-xs font-semibold text-slate-800">
                  {t('equipment.markAvailable')}
                </label>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isUpdating ? t('common.saving') : t('common.saveChanges')}
                </button>
              </div>
            </form>
          ) : (
            /* Listings Grid */
            <>
              {isLoading ? (
                <div className="py-16 text-center text-slate-500 space-y-2">
                  <div className="animate-spin inline-block w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full"></div>
                  <p className="text-sm font-medium">{t('equipment.loadingEquipment')}</p>
                </div>
              ) : myListings.length === 0 ? (
                <div className="py-12 text-center bg-slate-50 border border-dashed border-slate-300 rounded-2xl space-y-3">
                  <span className="text-4xl">🚜</span>
                  <h4 className="text-base font-bold text-slate-900">{t('equipment.noEquipmentListingsYet')}</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    {t('equipment.noEquipmentListingsDesc')}
                  </p>
                  <button
                    type="button"
                    onClick={onOpenAddEquipment}
                    className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    {t('equipment.listNewEquipmentNow')}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {myListings.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs hover:border-emerald-300 transition-colors"
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
                            <p>🏷️ {item.category ? getCategoryLabel(item.category) : ''} • 📍 {item.location}</p>
                            <p className="font-semibold text-emerald-700">
                              {formatCurrency(item.price)} / {item.priceUnit === 'day' ? t('common.unitDay') : t('common.unitHour')}
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
                              className="px-2.5 py-1 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded cursor-pointer"
                            >
                              {isDeleting ? t('equipment.deleting') : t('equipment.yesDelete')}
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingId(null)}
                              className="px-2 py-1 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded cursor-pointer"
                            >
                              {t('equipment.noCancel')}
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => startEdit(item)}
                              className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
                            >
                              {t('equipment.editListing')}
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingId(item.id)}
                              className="px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors cursor-pointer"
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyEquipmentModal;
