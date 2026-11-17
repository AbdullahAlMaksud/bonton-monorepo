import { createTheme } from '../tokens';
import type { AppTheme } from '../types';

export const ocean: AppTheme = createTheme('ocean', false, {
  background: '#F0F4F8',
  card: '#D9E2EC',
  primary: '#1976D2',
  primaryText: '#0F5FAE',
  onPrimary: '#FFFFFF',
  primaryMuted: '#1976D222',
  secondary: '#1E40AF',
  secondaryText: '#1E40AF',
  secondaryMuted: '#1E40AF18',
  accent: '#38BDF8',
  accentText: '#0284C7',
  accentMuted: '#38BDF820',
  text: '#102A43',
  textSecondary: '#486581',
  border: '#BCCCDC',
  success: '#0B6B62',
  successMuted: '#0B6B6220',
  danger: '#B42626',
  dangerMuted: '#B4262618',
  warning: '#8F4400',
  overlay: '#102A4366',
  shadow: '#102A43',
});
