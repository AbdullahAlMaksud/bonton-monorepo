import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  Keyboard,
  type KeyboardEvent,
  Modal,
  Platform,
  Pressable,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';

export interface BottomSheetModalProps {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  maxHeight?: number | `${number}%`;
  height?: number | `${number}%`;
  keyboardBehavior?: 'padding' | 'height' | 'position';
  keyboardVerticalOffset?: number;
}

export function BottomSheetModal({
  visible,
  onClose,
  children,
  maxHeight = '85%',
  height,
  keyboardVerticalOffset = 0,
}: BottomSheetModalProps) {
  const { height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = useState(visible);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const translateY = useSharedValue(screenHeight);
  const backdropOpacity = useSharedValue(0);
  const animatedKeyboardPadding = useSharedValue(0);

  useEffect(() => {
    const onKeyboardShow = (e: KeyboardEvent) => {
      const h = e.endCoordinates.height;
      setIsKeyboardVisible(true);
      setKeyboardHeight(h);
      const targetPadding = Math.max(0, h + keyboardVerticalOffset);
      animatedKeyboardPadding.value = withTiming(targetPadding, {
        duration: Platform.OS === 'ios' ? (e.duration || 250) : 220,
        easing: Easing.out(Easing.cubic),
      });
    };

    const onKeyboardHide = (e?: KeyboardEvent) => {
      setIsKeyboardVisible(false);
      setKeyboardHeight(0);
      animatedKeyboardPadding.value = withTiming(0, {
        duration: Platform.OS === 'ios' ? (e?.duration || 200) : 180,
        easing: Easing.out(Easing.cubic),
      });
    };

    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      onKeyboardShow,
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      onKeyboardHide,
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [animatedKeyboardPadding, keyboardVerticalOffset]);

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const isShownRef = useRef(false);
  const isAnimatingRef = useRef(false);

  const finishClose = useCallback(() => {
    isShownRef.current = false;
    isAnimatingRef.current = false;
    setMounted(false);
    onCloseRef.current();
  }, []);

  const startOpenAnimation = useCallback(() => {
    if (isShownRef.current && translateY.value === 0) return;
    isAnimatingRef.current = false;
    isShownRef.current = true;
    translateY.value = withTiming(0, {
      duration: 320,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    });
    backdropOpacity.value = withTiming(1, {
      duration: 280,
      easing: Easing.out(Easing.cubic),
    });
  }, [translateY, backdropOpacity]);

  const handleDismiss = useCallback(() => {
    Keyboard.dismiss();
    isShownRef.current = false;
    isAnimatingRef.current = true;
    translateY.value = withTiming(
      screenHeight,
      {
        duration: 250,
        easing: Easing.bezier(0.4, 0, 1, 1),
      },
      (finished) => {
        if (finished) {
          runOnJS(finishClose)();
        }
      },
    );
    backdropOpacity.value = withTiming(0, {
      duration: 200,
      easing: Easing.bezier(0.4, 0, 1, 1),
    });
  }, [finishClose, translateY, backdropOpacity, screenHeight]);

  useEffect(() => {
    let raf: number | null = null;
    if (visible) {
      if (!isShownRef.current && !isAnimatingRef.current) {
        isAnimatingRef.current = true;
        setMounted(true);
        translateY.value = screenHeight;
        backdropOpacity.value = 0;
        raf = requestAnimationFrame(() => {
          startOpenAnimation();
        });
      }
    } else {
      if (isShownRef.current || isAnimatingRef.current) {
        handleDismiss();
      }
    }
    return () => {
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }, [visible, startOpenAnimation, handleDismiss, translateY, backdropOpacity, screenHeight]);

  // Compute safe maxHeight: if keyboard is open, constrain the modal so it never goes off-screen
  const resolvedMaxHeight = useMemo(() => {
    if (height !== undefined) {
      if (isKeyboardVisible && keyboardHeight > 0) {
        const topSafe = Math.max(insets.top, 24);
        const availableHeight = screenHeight - keyboardHeight - topSafe - 16;
        const baseHeight =
          typeof height === 'number'
            ? height
            : (parseFloat(height) / 100) * screenHeight;
        return Math.min(baseHeight, Math.max(220, availableHeight));
      }
      return height;
    }

    const baseMax =
      typeof maxHeight === 'number'
        ? maxHeight
        : (parseFloat(maxHeight) / 100) * screenHeight;

    if (isKeyboardVisible && keyboardHeight > 0) {
      const topSafe = Math.max(insets.top, 24);
      const availableHeight = screenHeight - keyboardHeight - topSafe - 16;
      return Math.min(baseMax, Math.max(220, availableHeight));
    }

    return maxHeight;
  }, [height, maxHeight, isKeyboardVisible, keyboardHeight, screenHeight, insets.top]);

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const keyboardAnimatedStyle = useAnimatedStyle(() => ({
    paddingBottom: animatedKeyboardPadding.value,
  }));

  if (!mounted) return null;

  return (
    <Modal
      visible={mounted}
      transparent
      statusBarTranslucent
      animationType="none"
      onRequestClose={handleDismiss}
    >
      <View style={styles.container}>
        {/* Animated backdrop with tap to dismiss */}
        <Animated.View style={[styles.backdrop, backdropAnimatedStyle]}>
          <Pressable style={styles.dismissArea} onPress={handleDismiss} />
        </Animated.View>

        {/* Smooth hardware-accelerated keyboard container */}
        <Animated.View
          style={[styles.keyboardContainer, keyboardAnimatedStyle]}
          pointerEvents="box-none"
        >
          {/* Animated sliding sheet */}
          <Animated.View
            style={[
              styles.sheet,
              height !== undefined
                ? { height: resolvedMaxHeight, maxHeight: resolvedMaxHeight }
                : { maxHeight: resolvedMaxHeight },
              sheetAnimatedStyle,
              isKeyboardVisible && styles.sheetKeyboardActive,
            ]}
          >
            {/* Drag handle pill indicator */}
            <View style={styles.handleContainer}>
              <View style={styles.handle} />
            </View>
            {height !== undefined ? (
              <View style={styles.fixedHeightContainer}>{children}</View>
            ) : (
              children
            )}
          </Animated.View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.overlay,
  },
  dismissArea: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: theme.colors.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.sm,
    paddingBottom: Math.max(rt.insets.bottom, 20) + 24,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: theme.isDark ? 0.35 : 0.12,
    shadowRadius: 18,
    elevation: 20,
  },
  sheetKeyboardActive: {
    paddingBottom: theme.spacing.md,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 8,
    width: '100%',
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.border,
    opacity: 0.8,
  },
  fixedHeightContainer: {
    flex: 1,
  },
}));
