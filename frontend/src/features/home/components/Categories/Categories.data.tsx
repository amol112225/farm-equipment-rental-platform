import type { CategoryItem } from '../CategoryCard';
import {
  Tractor,
  Wheat,
  RotateCw,
  Sprout,
  Grid2X2,
  Droplets,
  Truck,
  Disc,
} from 'lucide-react';

/**
 * Mock Equipment Categories matching agricultural rental domain.
 */
export const MOCK_CATEGORIES: CategoryItem[] = [
  {
    id: 'cat-1',
    name: 'Tractor',
    slug: 'tractor',
    equipmentCount: 420,
    description: 'High-horsepower, mini, and heavy utility tractors for tilling & haulage.',
    icon: <Tractor className="w-full h-full" />,
  },
  {
    id: 'cat-2',
    name: 'Harvester',
    slug: 'harvester',
    equipmentCount: 185,
    description: 'Combine and multi-crop harvesters for fast grain & paddy harvesting.',
    icon: <Wheat className="w-full h-full" />,
  },
  {
    id: 'cat-3',
    name: 'Rotavator',
    slug: 'rotavator',
    equipmentCount: 310,
    description: 'Multi-speed rotary tillers for soil preparation and seedbed mixing.',
    icon: <RotateCw className="w-full h-full" />,
  },
  {
    id: 'cat-4',
    name: 'Seeder',
    slug: 'seeder',
    equipmentCount: 140,
    description: 'Zero-till drills, pneumatic seeders, and planter machinery.',
    icon: <Sprout className="w-full h-full" />,
  },
  {
    id: 'cat-5',
    name: 'Cultivator',
    slug: 'cultivator',
    equipmentCount: 230,
    description: 'Rigid tine & spring-loaded cultivators for secondary tillage.',
    icon: <Grid2X2 className="w-full h-full" />,
  },
  {
    id: 'cat-6',
    name: 'Sprayer',
    slug: 'sprayer',
    equipmentCount: 195,
    description: 'Tractor-mounted boom sprayers and high-pressure crop protectors.',
    icon: <Droplets className="w-full h-full" />,
  },
  {
    id: 'cat-7',
    name: 'Trailer',
    slug: 'trailer',
    equipmentCount: 275,
    description: 'Hydraulic tipping & heavy-capacity transport trailers.',
    icon: <Truck className="w-full h-full" />,
  },
  {
    id: 'cat-8',
    name: 'Plough',
    slug: 'plough',
    equipmentCount: 160,
    description: 'Mouldboard & disc ploughs for primary deep soil turning.',
    icon: <Disc className="w-full h-full" />,
  },
];
