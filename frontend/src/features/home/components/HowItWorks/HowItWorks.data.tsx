import type { StepItem } from './HowItWorks.types';
import { Search, Tractor, Zap, KeyRound } from 'lucide-react';

export const MOCK_STEPS: StepItem[] = [
  {
    stepNumber: 1,
    stepCode: '01',
    title: 'Search Equipment',
    description:
      'Enter your location and target rental dates to find available tractors, harvesters, and tillage implements nearby.',
    icon: <Search className="w-6 h-6 text-emerald-400" />,
  },
  {
    stepNumber: 2,
    stepCode: '02',
    title: 'Select Machinery',
    description:
      'Review verified machine horsepower, daily rental rates, owner reviews, and proximity to choose the ideal equipment.',
    icon: <Tractor className="w-6 h-6 text-emerald-400" />,
  },
  {
    stepNumber: 3,
    stepCode: '03',
    title: 'Instant or Request Booking',
    description:
      'Lock your schedule instantly with Instant Booking or send a flexible rental request directly to the equipment owner.',
    icon: <Zap className="w-6 h-6 text-amber-400 fill-amber-400/20" />,
    badgeText: 'Instant & Request Modes',
  },
  {
    stepNumber: 4,
    stepCode: '04',
    title: 'Pick Up & Operate',
    description:
      'Self pickup or request doorstep delivery to your farm. Complete your agricultural operations and return hassle-free.',
    icon: <KeyRound className="w-6 h-6 text-emerald-400" />,
  },
];
