import React, { useState } from 'react';

/**
 * HomeSearch Component
 * Displays the main search bar and category/suggestion navigation row
 * for the Farm Equipment Rental Platform.
 */
const HomeSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('For You');

  const categories = [
    'For You',
    'Tractors',
    'Harvesters',
    'Tillage Equipment',
    'Planting Equipment',
    'Irrigation',
    'Tools',
    'More',
  ];

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    // Search input state managed locally for frontend display
  };

  return (
    <div className="w-full bg-white border-b border-slate-200">
      {/* 1. Search Bar Section */}
      <div className="max-w-4xl mx-auto px-4 pt-6 pb-4 sm:pt-8 sm:pb-6">
        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <div className="relative flex items-center w-full bg-white border border-slate-300 focus-within:border-emerald-600 focus-within:ring-3 focus-within:ring-emerald-500/20 rounded-full shadow-xs hover:shadow-md transition-all duration-200 px-4 py-2.5 sm:py-3">
            {/* Search Icon */}
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6 text-slate-400 shrink-0 ml-1 mr-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>

            {/* Input Field */}
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search for tractors, harvesters, equipment and more"
              className="w-full bg-transparent text-slate-900 placeholder-slate-400 text-sm sm:text-base focus:outline-none pr-2"
            />

            {/* Search Button */}
            <button
              type="submit"
              className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs sm:text-sm px-4 sm:px-5 py-2 rounded-full transition-colors duration-200 flex items-center space-x-1.5 shadow-xs"
            >
              <span>Search</span>
            </button>
          </div>
        </form>
      </div>

      {/* 2. Category / Suggestion Navigation Row */}
      <div className="max-w-5xl mx-auto px-4">
        <nav
          className="flex items-center space-x-6 sm:space-x-8 overflow-x-auto scrollbar-none py-3 text-sm font-medium border-t border-slate-100"
          aria-label="Equipment categories"
        >
          {categories.map((category) => {
            const isActive = activeCategory === category;
            return (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={`whitespace-nowrap transition-all duration-200 pb-2.5 -mb-3 focus:outline-none ${
                  isActive
                    ? 'text-emerald-700 font-semibold border-b-2 border-emerald-600'
                    : 'text-slate-600 hover:text-emerald-700 hover:border-b-2 hover:border-slate-300'
                }`}
              >
                {category}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default HomeSearch;
