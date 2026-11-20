import { createTheme } from '../tokens';
import type { AppTheme } from '../types';

/**
 * Light theme
 * - Primary: Black (#000000)
 * - Secondary: Gray (#4B5563)
 * - Accent: Ash (#9CA3AF)
 */
export const light: AppTheme = createTheme('light', false, {
  background: '#FFFFFF',
  card: '#F9FAFB',
  primary: '#000000',
  primaryText: '#000000',
  onPrimary: '#FFFFFF',
  primaryMuted: '#00000010',
  secondary: '#4B5563',
  secondaryText: '#4B5563',
  secondaryMuted: '#202020',
  accent: '#9CA3AF',
  accentText: '#4B5563',
  accentMuted: '#9CA3AF24',
  text: '#111827',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  success: '#16A34A',
  successMuted: '#16A34A18',
  danger: '#DC2626',
  dangerMuted: '#DC262618',
  warning: '#D97706',
  overlay: '#00000066',
  shadow: '#000000',
});
