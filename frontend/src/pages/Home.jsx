import React from 'react';
import Navbar from '../components/layout/Navbar';
import HomeSearch from '../components/home/HomeSearch';
import EquipmentCard from '../features/equipment/components/EquipmentCard';

// Temporary local dummy dataset for farm equipment discovery
const dummyEquipment = [
  {
    id: '1',
    name: 'John Deere 5050D Tractor',
    price: 800,
    priceUnit: 'hour',
    bookingType: 'instant',
    distance: '4.2 km',
    image: 'https://images.unsplash.com/photo-1592861956120-e524fc739696?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: '2',
    name: 'Mahindra Yuvo 575 DI Tractor',
    price: 750,
    priceUnit: 'hour',
    bookingType: 'instant',
    distance: '6.1 km',
    image: 'https://images.unsplash.com/photo-1530267981601-0738096f92cf?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: '3',
    name: 'Combine Harvester 930',
    price: 4500,
    priceUnit: 'day',
    bookingType: 'request',
    distance: '8.7 km',
    image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: '4',
    name: 'Shaktiman Heavy Rotavator',
    price: 350,
    priceUnit: 'hour',
    bookingType: 'instant',
    distance: '3.5 km',
    image: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: '5',
    name: 'Automatic 9-Tyne Seed Drill',
    price: 2200,
    priceUnit: 'day',
    bookingType: 'both',
    distance: '5.4 km',
    image: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: '6',
    name: 'Heavy Duty Disc Harrow Cultivator',
    price: 400,
    priceUnit: 'hour',
    bookingType: 'request',
    distance: '7.2 km',
    image: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: '7',
    name: 'VST Shakti 135 DI Power Tiller',
    price: 1800,
    priceUnit: 'day',
    bookingType: 'instant',
    distance: '2.9 km',
    image: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: '8',
    name: 'Tractor Mounted Boom Sprayer',
    price: 500,
    priceUnit: 'hour',
    bookingType: 'both',
    distance: '10.3 km',
    image: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=600&q=80',
  },
];

/**
 * Home Page Component
 */
const Home = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header Navigation */}
      <Navbar />

      {/* Search and Category Navigation */}
      <HomeSearch />

      {/* Equipment Discovery Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Explore Equipment
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mt-1">
            Find the right equipment for your farming needs
          </p>
        </div>

        {/* Responsive Grid: 1 col on mobile, 2 sm, 3 md, 4 lg/desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 justify-items-center sm:justify-items-stretch">
          {dummyEquipment.map((item) => (
            <EquipmentCard
              key={item.id}
              image={item.image}
              name={item.name}
              price={item.price}
              priceUnit={item.priceUnit}
              bookingType={item.bookingType}
              distance={item.distance}
            />
          ))}
        </div>
      </main>
    </div>
  );
};

export default Home;
