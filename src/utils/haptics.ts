import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { Storage } from './storage';

/**
 * Haptic feedback utility for consistent haptic responses across the app
 */

const hapticOptions = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
};

export const Haptics = {
  /**
   * Light haptic feedback for subtle interactions
   * Use for: switch toggles, selections, context menu items
   */
  light(): void {
    if (!Storage.getHapticsEnabled()) {
      return;
    }
    ReactNativeHapticFeedback.trigger('impactLight', hapticOptions);
  },

  /**
   * Medium haptic feedback for standard interactions
   * Use for: button presses, confirmations
   */
  medium(): void {
    if (!Storage.getHapticsEnabled()) {
      return;
    }
    ReactNativeHapticFeedback.trigger('impactMedium', hapticOptions);
  },

  /**
   * Heavy haptic feedback for important interactions
   * Use for: deletions, errors, important confirmations
   */
  heavy(): void {
    if (!Storage.getHapticsEnabled()) {
      return;
    }
    ReactNativeHapticFeedback.trigger('impactHeavy', hapticOptions);
  },

  /**
   * Selection haptic feedback
   * Use for: picker changes, carousel scrolling
   */
  selection(): void {
    if (!Storage.getHapticsEnabled()) {
      return;
    }
    ReactNativeHapticFeedback.trigger('selection', hapticOptions);
  },

  /**
   * Notification feedback - success
   */
  success(): void {
    if (!Storage.getHapticsEnabled()) {
      return;
    }
    ReactNativeHapticFeedback.trigger('notificationSuccess', hapticOptions);
  },

  /**
   * Notification feedback - warning
   */
  warning(): void {
    if (!Storage.getHapticsEnabled()) {
      return;
    }
    ReactNativeHapticFeedback.trigger('notificationWarning', hapticOptions);
  },

  /**
   * Notification feedback - error
   */
  error(): void {
    if (!Storage.getHapticsEnabled()) {
      return;
    }
    ReactNativeHapticFeedback.trigger('notificationError', hapticOptions);
  },
};
