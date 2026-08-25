import React from 'react';
import Navbar from '../components/layout/Navbar/Navbar';

/**
 * Minimal Home Page rendering ONLY the Navbar component.
 */
const Home = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
    </div>
  );
};

export default Home;
