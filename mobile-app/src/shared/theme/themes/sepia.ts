import { createTheme } from '../tokens';
import type { AppTheme } from '../types';

export const sepia: AppTheme = createTheme('sepia', false, {
  background: '#FDF6E3',
  card: '#F4EDD8',
  primary: '#C25E00',
  primaryText: '#9A4A00',
  onPrimary: '#FFFFFF',
  primaryMuted: '#C25E0022',
  secondary: '#78350F',
  secondaryText: '#78350F',
  secondaryMuted: '#78350F18',
  accent: '#B45309',
  accentText: '#92400E',
  accentMuted: '#B4530920',
  text: '#3B2F1E',
  textSecondary: '#6F5F47',
  border: '#E2D6B8',
  success: '#36701B',
  successMuted: '#36701B20',
  danger: '#B42318',
  dangerMuted: '#B4231818',
  warning: '#8A5A00',
  overlay: '#2B1F0F66',
  shadow: '#3B2F1E',
});
