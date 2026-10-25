import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useLanguage } from '../../../context/LanguageContext';
import { createEquipment } from '../../../services/equipmentService';

/**
 * AddEquipmentModal Component
 * Dialog allowing authenticated farmers to list new agricultural equipment
 * with direct photo upload (JPEG, PNG, WebP up to 5MB, multiple photos) and multilingual support.
 */
const AddEquipmentModal = ({ isOpen, onClose, onSuccess }) => {
  const { token, isAuthenticated } = useAuth();
  const { t, getCategoryLabel } = useLanguage();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    category: 'Tractors',
    description: '',
    price: '',
    priceUnit: 'hour',
    bookingType: 'instant',
    location: '',
    imageUrl: '',
    isAvailable: true,
  });

  const [selectedPhotos, setSelectedPhotos] = useState([]); // [{ file, previewUrl, id }]
  const [primaryPhotoIndex, setPrimaryPhotoIndex] = useState(0);
  const [photoError, setPhotoError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showUrlFallback, setShowUrlFallback] = useState(false);

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

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
  const MAX_PHOTOS = 5;
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  // Cleanup object URLs on unmount or photo list changes
  useEffect(() => {
    return () => {
      selectedPhotos.forEach((photo) => {
        if (photo.previewUrl) {
          URL.revokeObjectURL(photo.previewUrl);
        }
      });
    };
  }, [selectedPhotos]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    setFormData((prev) => ({ ...prev, [name]: val }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleFileChange = async (e) => {
    setPhotoError('');
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (selectedPhotos.length + files.length > MAX_PHOTOS) {
      setPhotoError(t('equipment.maxPhotosLimit', { max: MAX_PHOTOS }));
      return;
    }

    const allowedExts = ['.jpg', '.jpeg', '.png', '.webp'];
    const newPhotos = [];

    for (const file of files) {
      const lowerName = file.name ? file.name.toLowerCase() : '';
      const hasValidExt = allowedExts.some((ext) => lowerName.endsWith(ext));

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

      try {
        const validatedPhoto = await new Promise((resolve, reject) => {
          const previewUrl = URL.createObjectURL(file);
          const img = new Image();
          img.onload = () => {
            resolve({
              file,
              previewUrl,
              id: `${file.name}-${Date.now()}-${Math.random()}`,
            });
          };
          img.onerror = () => {
            URL.revokeObjectURL(previewUrl);
            reject(new Error(t('equipment.invalidImageContent', { name: file.name })));
          };
          img.src = previewUrl;
        });
        newPhotos.push(validatedPhoto);
      } catch (err) {
        setPhotoError(err.message);
        return;
      }
    }

    setSelectedPhotos((prev) => [...prev, ...newPhotos]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = (indexToRemove) => {
    setSelectedPhotos((prev) => {
      const removed = prev[indexToRemove];
      if (removed && removed.previewUrl) {
        URL.revokeObjectURL(removed.previewUrl);
      }
      const updated = prev.filter((_, idx) => idx !== indexToRemove);
      if (updated.length === 0) {
        setPrimaryPhotoIndex(0);
      } else if (indexToRemove === primaryPhotoIndex) {
        setPrimaryPhotoIndex(0);
      } else if (indexToRemove < primaryPhotoIndex) {
        setPrimaryPhotoIndex(primaryPhotoIndex - 1);
      }
      return updated;
    });
  };

  const handleSetPrimary = (index) => {
    setPrimaryPhotoIndex(index);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});
    setGeneralError('');
    setPhotoError('');

    if (!isAuthenticated || !token) {
      setGeneralError(t('home.loginRequiredToList'));
      return;
    }

    // Client-side positive price validation
    const numericPrice = parseFloat(formData.price);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      setFieldErrors((prev) => ({
        ...prev,
        price: t('equipment.price'),
      }));
      return;
    }

    setIsSubmitting(true);

    try {
      const multipartData = new FormData();
      multipartData.append('name', formData.name.trim());
      multipartData.append('category', formData.category.trim());
      multipartData.append('description', formData.description ? formData.description.trim() : '');
      multipartData.append('price', numericPrice);
      multipartData.append('priceUnit', formData.priceUnit);
      multipartData.append('bookingType', formData.bookingType);
      multipartData.append('location', formData.location.trim());
      multipartData.append('isAvailable', formData.isAvailable);

      if (formData.imageUrl && formData.imageUrl.trim()) {
        multipartData.append('imageUrl', formData.imageUrl.trim());
      }

      // Reorder photos so designated primary is appended first
      const orderedPhotos = [...selectedPhotos];
      if (primaryPhotoIndex > 0 && primaryPhotoIndex < orderedPhotos.length) {
        const [primaryPhoto] = orderedPhotos.splice(primaryPhotoIndex, 1);
        orderedPhotos.unshift(primaryPhoto);
      }

      multipartData.append('primaryIndex', 0);

      orderedPhotos.forEach((item) => {
        multipartData.append('photos', item.file);
      });

      await createEquipment(multipartData, token);
      setIsSubmitting(false);

      if (onSuccess) {
        onSuccess(t('equipment.createSuccess', { name: formData.name.trim() }));
      }
      onClose();
    } catch (err) {
      setIsSubmitting(false);
      if (err.errors) {
        setFieldErrors(err.errors);
      }
      setGeneralError(err.message || t('common.serverError'));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-emerald-700 px-6 py-5 text-white relative">
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
          <h2 className="text-xl font-bold tracking-tight">{t('equipment.addNewEquipmentTitle')}</h2>
          <p className="text-xs text-emerald-100 mt-1">
            {t('equipment.addNewEquipmentSubtitle')}
          </p>
        </div>

        {/* Scroll Content Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {generalError && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm font-medium flex items-center space-x-2">
              <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{generalError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                {t('equipment.name')} *
              </label>
              <input
                type="text"
                name="name"
                required
                maxLength={150}
                value={formData.name}
                onChange={handleChange}
                placeholder={t('equipment.equipmentNamePlaceholder')}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-colors"
              />
              {fieldErrors.name && (
                <p className="text-xs text-red-600 font-medium mt-1">{fieldErrors.name}</p>
              )}
            </div>

            {/* Category & Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  {t('equipment.category')} *
                </label>
                <select
                  name="category"
                  required
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-colors"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {getCategoryLabel(cat)}
                    </option>
                  ))}
                </select>
                {fieldErrors.category && (
                  <p className="text-xs text-red-600 font-medium mt-1">{fieldErrors.category}</p>
                )}
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
                  value={formData.location}
                  onChange={handleChange}
                  placeholder={t('equipment.locationPlaceholder')}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-colors"
                />
                {fieldErrors.location && (
                  <p className="text-xs text-red-600 font-medium mt-1">{fieldErrors.location}</p>
                )}
              </div>
            </div>

            {/* Price & Price Unit */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="e.g. 500"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-colors"
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
                  value={formData.priceUnit}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-colors"
                >
                  <option value="hour">{t('common.perHour')}</option>
                  <option value="day">{t('common.perDay')}</option>
                </select>
                {fieldErrors.priceUnit && (
                  <p className="text-xs text-red-600 font-medium mt-1">{fieldErrors.priceUnit}</p>
                )}
              </div>
            </div>

            {/* Booking Preference & Availability */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  {t('equipment.bookingMode')}
                </label>
                <select
                  name="bookingType"
                  required
                  value={formData.bookingType}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-colors"
                >
                  <option value="instant">{t('equipment.instantBookingOption')}</option>
                  <option value="request">{t('equipment.requestBookingOption')}</option>
                  <option value="both">{t('equipment.bothBookingOption')}</option>
                </select>
                {fieldErrors.bookingType && (
                  <p className="text-xs text-red-600 font-medium mt-1">{fieldErrors.bookingType}</p>
                )}
              </div>

              <div className="flex items-center pt-6">
                <label className="relative flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="isAvailable"
                    checked={formData.isAvailable}
                    onChange={handleChange}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <span className="text-sm font-semibold text-slate-800">{t('equipment.markAvailable')}</span>
                </label>
              </div>
            </div>

            {/* Photo Upload Section */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/70 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    {t('equipment.equipmentPhotosLabel')}
                  </label>
                  <p className="text-[11px] text-slate-500">
                    {t('equipment.photosLimitDesc')}
                  </p>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md">
                  {t('equipment.photosSelectedCount', { count: selectedPhotos.length })}
                </span>
              </div>

              {photoError && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs font-medium flex items-center gap-1.5">
                  <span>⚠️</span>
                  <span>{photoError}</span>
                </div>
              )}

              {/* File Input Trigger Button */}
              {selectedPhotos.length < MAX_PHOTOS && (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                    id="equipment-photo-upload"
                  />
                  <label
                    htmlFor="equipment-photo-upload"
                    className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl bg-white cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center space-x-2 text-slate-600 group-hover:text-emerald-700">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-xs sm:text-sm font-semibold">{t('equipment.dragDropOrBrowse')}</span>
                    </div>
                    <span className="text-[11px] text-slate-400 mt-1">{t('equipment.photoRulesHint')}</span>
                  </label>
                </div>
              )}

              {/* Photo Previews Strip */}
              {selectedPhotos.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                  {selectedPhotos.map((photo, idx) => (
                    <div
                      key={photo.id}
                      className={`relative rounded-lg overflow-hidden border-2 bg-slate-100 h-28 group transition-all ${idx === primaryPhotoIndex
                          ? 'border-emerald-600 ring-2 ring-emerald-500/30'
                          : 'border-slate-200'
                        }`}
                    >
                      <img
                        src={photo.previewUrl}
                        alt={`Preview ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />

                      {/* Primary Badge or Set Primary Button */}
                      {idx === primaryPhotoIndex ? (
                        <span className="absolute top-1.5 left-1.5 bg-emerald-700 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs flex items-center gap-1">
                          <span>★</span>
                          <span>{t('equipment.primaryCover')}</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSetPrimary(idx)}
                          className="absolute top-1.5 left-1.5 bg-slate-900/80 hover:bg-emerald-700 text-white text-[10px] font-semibold px-2 py-0.5 rounded transition-colors shadow-xs cursor-pointer"
                          title={t('equipment.setAsPrimary')}
                        >
                          {t('equipment.setAsPrimary')}
                        </button>
                      )}

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(idx)}
                        className="absolute top-1.5 right-1.5 bg-red-600 text-white hover:bg-red-700 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition-colors shadow-xs cursor-pointer"
                        aria-label={t('equipment.removePhoto')}
                        title={t('equipment.removePhoto')}
                      >
                        ✕
                      </button>

                      {/* File Name & Size Footer */}
                      <div className="absolute bottom-0 inset-x-0 bg-slate-900/80 px-1.5 py-0.5 text-[9px] text-white truncate">
                        {photo.file.name} ({(photo.file.size / 1024).toFixed(0)} KB)
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Optional Image URL Toggle */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowUrlFallback(!showUrlFallback)}
                  className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>{showUrlFallback ? `▲ ${t('equipment.hideUrlInput')}` : `▼ ${t('equipment.enterUrlManually')}`}</span>
                </button>
                {showUrlFallback && (
                  <div className="mt-2">
                    <input
                      type="url"
                      name="imageUrl"
                      maxLength={500}
                      value={formData.imageUrl}
                      onChange={handleChange}
                      placeholder={t('equipment.urlFallbackPlaceholder')}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                {t('equipment.description')}
              </label>
              <textarea
                name="description"
                rows={3}
                maxLength={2000}
                value={formData.description}
                onChange={handleChange}
                placeholder={t('equipment.descriptionPlaceholder')}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-colors"
              />
              {fieldErrors.description && (
                <p className="text-xs text-red-600 font-medium mt-1">{fieldErrors.description}</p>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="pt-3 flex items-center justify-end space-x-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-800 border border-slate-300 rounded-lg transition-colors cursor-pointer"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-lg shadow-sm transition-all duration-200 disabled:opacity-60 flex items-center space-x-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>{t('equipment.submittingListing')}</span>
                  </>
                ) : (
                  <span>{t('equipment.submitListingButton')}</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddEquipmentModal;
