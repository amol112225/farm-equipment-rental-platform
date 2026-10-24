import React, { useState, useEffect } from 'react';
import Home from './pages/Home';
import OwnerDashboard from './pages/OwnerDashboard';
import RenterDashboard from './pages/RenterDashboard';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import './App.css';

/**
 * Root Application Component with Lightweight View Navigation
 * Routes between Home page, OwnerDashboard page, and RenterDashboard page via state and URL hash.
 */
function App() {
  const [currentPage, setCurrentPage] = useState(() => {
    const hash = window.location.hash;
    if (hash === '#owner-dashboard') return 'owner-dashboard';
    if (hash === '#my-bookings' || hash === '#renter-dashboard') return 'my-bookings';
    return 'home';
  });

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === '#owner-dashboard') {
        setCurrentPage('owner-dashboard');
      } else if (hash === '#my-bookings' || hash === '#renter-dashboard') {
        setCurrentPage('my-bookings');
      } else {
        setCurrentPage('home');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateToOwnerDashboard = () => {
    window.location.hash = 'owner-dashboard';
    setCurrentPage('owner-dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToMyBookings = () => {
    window.location.hash = 'my-bookings';
    setCurrentPage('my-bookings');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToHome = () => {
    window.location.hash = 'home';
    setCurrentPage('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <LanguageProvider>
      <AuthProvider>
        <div className="App">
          {currentPage === 'owner-dashboard' ? (
            <OwnerDashboard
              onNavigateToHome={navigateToHome}
              onNavigateToMyBookings={navigateToMyBookings}
            />
          ) : currentPage === 'my-bookings' ? (
            <RenterDashboard
              onNavigateToHome={navigateToHome}
              onNavigateToOwnerDashboard={navigateToOwnerDashboard}
            />
          ) : (
            <Home
              onNavigateToOwnerDashboard={navigateToOwnerDashboard}
              onNavigateToMyBookings={navigateToMyBookings}
            />
          )}
        </div>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
