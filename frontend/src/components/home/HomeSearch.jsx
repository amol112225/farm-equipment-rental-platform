import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';

/**
 * HomeSearch Component
 * Main search interface supporting keyword search, manual location input,
 * explicit browser geolocation detection, and multilingual support.
 */
const HomeSearch = ({
  searchTerm = '',
  onSearchChange = () => { },
  locationSearch = '',
  onLocationChange = () => { },
  activeCategory = 'All Categories',
  onCategoryChange = () => { },
  onResetFilters = () => { },
}) => {
  const { t } = useLanguage();
  const [geoStatus, setGeoStatus] = useState(null);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
  };

  // Request browser location ONLY on explicit user button click
  const handleRequestLocation = () => {
    if (!navigator.geolocation) {
      setGeoStatus({
        type: 'error',
        message: t('search.geoNotSupported'),
      });
      return;
    }

    setGeoStatus({ type: 'loading', message: t('search.detectingLocation') });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        onLocationChange(t('search.currentLocationDetected'));
        setGeoStatus({
          type: 'success',
          message: t('search.locationDetected', {
            lat: position.coords.latitude.toFixed(2),
            lng: position.coords.longitude.toFixed(2),
          }),
        });
        setTimeout(() => setGeoStatus(null), 4000);
      },
      (error) => {
        let msg = t('search.geoError');
        if (error.code === error.PERMISSION_DENIED) {
          msg = t('search.geoPermissionDenied');
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = t('search.geoUnavailable');
        } else if (error.code === error.TIMEOUT) {
          msg = t('search.geoTimeout');
        }
        setGeoStatus({ type: 'error', message: msg });
        setTimeout(() => setGeoStatus(null), 5000);
      },
      { timeout: 8000 }
    );
  };

  return (
    <div className="w-full bg-white border-b border-slate-200 py-6">
      <div className="max-w-4xl mx-auto px-4 space-y-4">

        {/* Area 1: Equipment Search Bar */}
        <form onSubmit={handleSearchSubmit} className="w-full">
          <div className="flex items-center bg-slate-50 border border-slate-300 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:bg-white rounded-xl shadow-xs p-1.5 gap-2">
            <svg
              className="w-5 h-5 text-slate-400 shrink-0 ml-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={t('search.placeholder')}
              className="w-full bg-transparent text-slate-900 placeholder-slate-400 text-sm focus:outline-none px-2 py-1.5"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                aria-label={t('search.clearSearch')}
              >
                ✕
              </button>
            )}
            <button
              type="submit"
              className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-6 py-2 rounded-lg transition-colors cursor-pointer"
            >
              {t('search.searchButton')}
            </button>
          </div>
        </form>

        {/* Area 2: Location Selection */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center bg-slate-50 border border-slate-200 rounded-xl p-3 gap-3">
          <div className="flex items-center flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2">
            <svg
              className="w-5 h-5 text-emerald-600 shrink-0 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <input
              type="text"
              value={locationSearch}
              onChange={(e) => onLocationChange(e.target.value)}
              placeholder={t('search.locationPlaceholder')}
              className="w-full bg-transparent text-slate-900 placeholder-slate-400 text-sm focus:outline-none"
            />
            {locationSearch && (
              <button
                type="button"
                onClick={() => onLocationChange('')}
                className="text-slate-400 hover:text-slate-600 p-1 mr-1 cursor-pointer"
                aria-label={t('search.clearLocation')}
              >
                ✕
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleRequestLocation}
            title={t('search.useCurrentLocation')}
            className="shrink-0 text-slate-700 hover:text-emerald-700 bg-white hover:bg-emerald-50 border border-slate-300 px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>{t('search.useCurrentLocation')}</span>
          </button>
        </div>

        {/* Geolocation Feedback Message */}
        {geoStatus && (
          <div
            className={`text-xs px-3.5 py-2 rounded-lg flex items-center justify-between border ${
              geoStatus.type === 'error'
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : geoStatus.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            <span>{geoStatus.message}</span>
            <button
              type="button"
              onClick={() => setGeoStatus(null)}
              className="font-bold text-slate-500 hover:text-slate-700 ml-2 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default HomeSearch;
