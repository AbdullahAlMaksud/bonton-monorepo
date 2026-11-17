import { createTheme } from '../tokens';
import type { AppTheme } from '../types';

export const forest: AppTheme = createTheme('forest', false, {
  background: '#F0F7F4',
  card: '#E1EDD9',
  primary: '#15803D',
  primaryText: '#136B34',
  onPrimary: '#FFFFFF',
  primaryMuted: '#15803D22',
  secondary: '#166534',
  secondaryText: '#166534',
  secondaryMuted: '#16653418',
  accent: '#22C55E',
  accentText: '#15803D',
  accentMuted: '#22C55E20',
  text: '#14281D',
  textSecondary: '#46604F',
  border: '#C5D9C0',
  success: '#166534',
  successMuted: '#16653420',
  danger: '#B91C1C',
  dangerMuted: '#B91C1C18',
  warning: '#92400E',
  overlay: '#0B1F1266',
  shadow: '#14281D',
});
