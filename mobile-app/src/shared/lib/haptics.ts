import * as Haptics from 'expo-haptics';

/** Haptics are a nicety: never let an unsupported device or a native error surface. */
function run(effect: () => Promise<void>): void {
  try {
    void effect().catch(() => undefined);
  } catch {
    // ignore
  }
}

export const haptics = {
  /** Selection changes (chips, segmented controls, toggles). */
  select: () => run(() => Haptics.selectionAsync()),
  /** Button presses. */
  tap: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  success: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  warning: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
  error: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
};
