import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  View,
} from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { StyleSheet } from 'react-native-unistyles';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface BottomSheetModalProps {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  maxHeight?: number | `${number}%`;
  height?: number | `${number}%`;
}

export function BottomSheetModal({
  visible,
  onClose,
  children,
  maxHeight = '85%',
  height,
}: BottomSheetModalProps) {
  const [mounted, setMounted] = useState(visible);
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);

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
      SCREEN_HEIGHT,
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
  }, [finishClose, translateY, backdropOpacity]);

  useEffect(() => {
    let raf: number | null = null;
    if (visible) {
      if (!isShownRef.current && !isAnimatingRef.current) {
        isAnimatingRef.current = true;
        setMounted(true);
        translateY.value = SCREEN_HEIGHT;
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
  }, [visible, startOpenAnimation, handleDismiss, translateY, backdropOpacity]);

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
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

        {/* KeyboardAvoidingView keeps the bottom sheet and its input fields above the keyboard */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardContainer}
          pointerEvents="box-none"
        >
          {/* Animated sliding sheet */}
          <Animated.View
            style={[
              styles.sheet,
              height !== undefined ? { height, maxHeight: height } : { maxHeight },
              sheetAnimatedStyle,
            ]}
          >
            {/* Drag handle pill indicator */}
            <View style={styles.handleContainer}>
              <View style={styles.handle} />
            </View>
            <View style={height !== undefined ? styles.fixedHeightContainer : undefined}>
              {children}
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
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
