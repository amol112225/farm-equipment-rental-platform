import type { ReactNode } from 'react';

export interface FooterLink {
  label: string;
  path: string;
}

export interface SocialLink {
  label: string;
  path: string;
  icon: ReactNode;
}

export interface FooterProps {
  className?: string;
}
