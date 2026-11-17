import { createTheme } from '../tokens';
import type { AppTheme } from '../types';

/**
 * Dark theme
 * - Background: Rich Black (#09090B)
 * - Card: Dark Gray (#18181B)
 * - Primary: White on Dark (#FFFFFF fill, #000000 onPrimary)
 * - Secondary: Gray (#9CA3AF)
 * - Accent: Ash (#A1A1AA)
 */
export const dark: AppTheme = createTheme('dark', true, {
  background: '#09090B',
  card: '#18181B',
  primary: '#FFFFFF',
  primaryText: '#FFFFFF',
  onPrimary: '#000000',
  primaryMuted: '#FFFFFF18',
  secondary: '#9CA3AF',
  secondaryText: '#9CA3AF',
  secondaryMuted: '#9CA3AF20',
  accent: '#A1A1AA',
  accentText: '#D4D4D8',
  accentMuted: '#A1A1AA20',
  text: '#F9FAFB',
  textSecondary: '#9CA3AF',
  border: '#27272A',
  success: '#22C55E',
  successMuted: '#22C55E22',
  danger: '#EF4444',
  dangerMuted: '#EF444422',
  warning: '#F59E0B',
  overlay: '#000000AA',
  shadow: '#000000',
});
