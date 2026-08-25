import React from 'react';
import Navbar from '../components/layout/Navbar/Navbar';
import HomeSearch from '../components/home/HomeSearch';

/**
 * Home Page rendering Navbar and Search + Category Navigation section.
 */
const Home = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <HomeSearch />
    </div>
  );
};

export default Home;
