import type { NavItem } from './Navbar.types';

export const NAV_ITEMS: NavItem[] = [
  { label: 'Home', path: '/' },
  { label: 'Equipment', path: '/equipment' },
  { label: 'About', path: '/about' },
  { label: 'Contact', path: '/contact' },
  { label: 'Become an Owner', path: '/become-owner', isHighlight: true },
];
