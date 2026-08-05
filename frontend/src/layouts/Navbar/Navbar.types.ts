export interface NavItem {
  /** Unique label displayed to the user */
  label: string;
  /** Route path URL destination */
  path: string;
  /** Optional badge flag for highlighting (e.g. Become an Owner) */
  isHighlight?: boolean;
}

export interface NavbarProps {
  /** Optional callback fired when Login button is clicked */
  onLoginClick?: () => void;
  /** Optional callback fired when Register button is clicked */
  onRegisterClick?: () => void;
  /** Optional callback fired when Become an Owner button is clicked */
  onBecomeOwnerClick?: () => void;
  /** Custom class names */
  className?: string;
}
