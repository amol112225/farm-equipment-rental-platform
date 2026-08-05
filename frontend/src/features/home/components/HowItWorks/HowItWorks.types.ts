import type { ReactNode } from 'react';

export interface StepItem {
  /** Numerical step position (e.g., 1, 2, 3, 4) */
  stepNumber: number;
  /** Formatted step badge text (e.g., "01") */
  stepCode: string;
  /** Title of the step */
  title: string;
  /** Detailed description of the action */
  description: string;
  /** Lucide icon element for visual indicator */
  icon: ReactNode;
  /** Optional badge highlight text (e.g., "Instant or Request") */
  badgeText?: string;
}

export interface HowItWorksProps {
  /** Optional override for step items */
  steps?: StepItem[];
  /** Callback fired when user clicks CTA button to get started */
  onGetStartedClick?: () => void;
  /** Additional custom class names */
  className?: string;
}
