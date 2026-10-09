import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { createEquipment } from '../../../services/equipmentService';

/**
 * AddEquipmentModal Component
 * Dialog allowing authenticated farmers to list new agricultural equipment.
 */
const AddEquipmentModal = ({ isOpen, onClose, onSuccess }) => {
  if (!isOpen) return null;

  const { token, isAuthenticated } = useAuth();

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

  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    setFormData((prev) => ({ ...prev, [name]: val }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});
    setGeneralError('');

    if (!isAuthenticated || !token) {
      setGeneralError('Please log in to your farmer account to list equipment.');
      return;
    }

    // Client-side positive price validation
    const numericPrice = parseFloat(formData.price);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      setFieldErrors((prev) => ({
        ...prev,
        price: 'Price must be a positive value greater than zero.',
      }));
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        name: formData.name.trim(),
        category: formData.category.trim(),
        description: formData.description ? formData.description.trim() : '',
        price: numericPrice,
        priceUnit: formData.priceUnit,
        bookingType: formData.bookingType,
        location: formData.location.trim(),
        imageUrl: formData.imageUrl ? formData.imageUrl.trim() : null,
        isAvailable: formData.isAvailable,
      };

      await createEquipment(payload, token);
      setIsSubmitting(false);

      if (onSuccess) {
        onSuccess('Equipment listing created successfully!');
      }
      onClose();
    } catch (err) {
      setIsSubmitting(false);
      if (err.errors) {
        setFieldErrors(err.errors);
      }
      setGeneralError(err.message || 'Failed to create equipment listing. Please check fields.');
    }
  };

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
            className="absolute top-4 right-4 text-emerald-100 hover:text-white p-1 rounded-full hover:bg-emerald-600/50 transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <h2 className="text-xl font-bold tracking-tight">List Your Equipment</h2>
          <p className="text-xs text-emerald-100 mt-1">
            Fill in your machinery details to offer rentals to local farmers
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
                Equipment Name *
              </label>
              <input
                type="text"
                name="name"
                required
                maxLength={150}
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. John Deere 5050D Tractor"
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
                  Category *
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
                      {cat}
                    </option>
                  ))}
                </select>
                {fieldErrors.category && (
                  <p className="text-xs text-red-600 font-medium mt-1">{fieldErrors.category}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Location (Village / District) *
                </label>
                <input
                  type="text"
                  name="location"
                  required
                  maxLength={200}
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g. Khed, Pune"
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
                  Rental Price (₹) *
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
                  Price Unit *
                </label>
                <select
                  name="priceUnit"
                  required
                  value={formData.priceUnit}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-colors"
                >
                  <option value="hour">Per Hour</option>
                  <option value="day">Per Day</option>
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
                  Booking Preference *
                </label>
                <select
                  name="bookingType"
                  required
                  value={formData.bookingType}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-colors"
                >
                  <option value="instant">Instant Booking</option>
                  <option value="request">Request to Book</option>
                  <option value="both">Both (Instant / Request)</option>
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
                  <span className="text-sm font-semibold text-slate-800">Currently Available for Rent</span>
                </label>
              </div>
            </div>

            {/* Image URL */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Image URL (Optional)
              </label>
              <input
                type="url"
                name="imageUrl"
                maxLength={500}
                value={formData.imageUrl}
                onChange={handleChange}
                placeholder="https://example.com/tractor-image.jpg"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-colors"
              />
              {fieldErrors.imageUrl && (
                <p className="text-xs text-red-600 font-medium mt-1">{fieldErrors.imageUrl}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Description (Optional)
              </label>
              <textarea
                name="description"
                rows={3}
                maxLength={2000}
                value={formData.description}
                onChange={handleChange}
                placeholder="Specify HP, implements included, driver availability, etc."
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
                className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-800 border border-slate-300 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-lg shadow-sm transition-all duration-200 disabled:opacity-60 flex items-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Saving Listing...</span>
                  </>
                ) : (
                  <span>Publish Listing</span>
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
