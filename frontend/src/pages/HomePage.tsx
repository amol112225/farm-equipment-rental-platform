import { Navbar } from '@/layouts/Navbar';
import { Hero } from '@/features/home/components/Hero';
import { Categories } from '@/features/home/components/Categories';
import { FeaturedEquipment } from '@/features/home/components/FeaturedEquipment';
import { HowItWorks } from '@/features/home/components/HowItWorks';
import { Footer } from '@/layouts/Footer';

/**
 * Assembled Home Page for the Farm Equipment Rental Platform.
 * Seamlessly integrates Navbar, Hero, Categories, Featured Equipment, How It Works, and Footer.
 */
export const HomePage = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 selection:bg-emerald-500 selection:text-white">
      {/* Top Sticky Application Header */}
      <Navbar />

      {/* Main Page Content Landmark */}
      <main className="flex-1">
        {/* 1. Hero Section */}
        <Hero />

        {/* 2. Categories Section */}
        <Categories />

        {/* 3. Featured Equipment Section */}
        <FeaturedEquipment />

        {/* 4. How It Works Section */}
        <HowItWorks />
      </main>

      {/* Application Footer */}
      <Footer />
    </div>
  );
};

export default HomePage;