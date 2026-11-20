import { User } from 'lucide-react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
  BackHandler,
  Image,
  ImageSourcePropType,
  Keyboard,
  KeyboardEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  ScrollViewInstance,
  TextInput,
  TouchableWithoutFeedback,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { SystemBars } from 'react-native-edge-to-edge';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native-unistyles';

import { haptics } from '@/shared/lib/haptics';
import { useBontonStore } from '@/shared/store/bonton-store';
import { PressableScale, Text } from '@/shared/ui';

interface SlideData {
  id: string;
  image: ImageSourcePropType;
  renderTitle: (color: string) => React.ReactNode;
  subtitle: string;
}

function BrushStroke({ width = 110, color }: { width?: number; color: string }) {
  return (
    <View style={[styles.brushContainer, { width }]}>
      <Svg width={width} height={10} viewBox="0 0 100 10">
        <Path
          d="M 3 6 Q 50 1, 97 5"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const completeOnboarding = useBontonStore((s) => s.completeOnboarding);

  const [activeIndex, setActiveIndex] = useState(0);
  const [name, setName] = useState('');
  const pagerRef = useRef<ScrollViewInstance>(null);
  const activeIndexRef = useRef(0);
  activeIndexRef.current = activeIndex;
  const isInputFocusedRef = useRef(false);

  const accentColor = '#C25E00'; // Warm terracotta / bonton theme accent

  // Reanimated shared value for smooth GPU-accelerated keyboard lifting
  const keyboardOffset = useSharedValue(0);

  // Responsive image height: fills top ~44% of viewport or 1:1 with width
  const imageHeight = Math.round(Math.min(screenWidth * 0.98, screenHeight * 0.44));

  const slides: SlideData[] = [
    {
      id: 'slide-1',
      image: require('../../public/onboarding_1.png'),
      renderTitle: (color) => (
        <View style={styles.titleContainer}>
          <View style={styles.inlineRow}>
            <View style={styles.highlightBlock}>
              <Text style={styles.titleText}>বন্ধুদের</Text>
              <BrushStroke width={95} color={color} />
            </View>
            <Text style={styles.titleText}> সাথে ঘুরতে গিয়ে</Text>
          </View>
          <Text style={styles.titleText}>হিসেবের প্রবলেম?</Text>
        </View>
      ),
      subtitle: 'এন্ট্রি করো কে কোথায় কত খরচ করেছো,\nহিসাব দেখতে পাবে নিমিষেই।',
    },
    {
      id: 'slide-2',
      image: require('../../public/onboarding_2.png'),
      renderTitle: (color) => (
        <View style={styles.titleContainer}>
          <Text style={styles.titleText}>হিসাব এখন আর</Text>
          <View style={styles.highlightBlock}>
            <Text style={styles.titleText}>ঝামেলা নয়!</Text>
            <BrushStroke width={125} color={color} />
          </View>
        </View>
      ),
      subtitle: 'সব খরচ এক জায়গায়, সবার ভাগ\nআপনা-আপনি। সহজ, দ্রুত, নির্ভুল।',
    },
    {
      id: 'slide-3',
      image: require('../../public/onboarding_3.png'),
      renderTitle: (color) => (
        <View style={styles.titleContainer}>
          <Text style={styles.titleText}>মনে রাখো</Text>
          <View style={styles.highlightBlock}>
            <Text style={styles.titleText}>ভালো সময়গুলো,</Text>
            <BrushStroke width={155} color={color} />
          </View>
        </View>
      ),
      subtitle: 'আমরা দেখছি তোমার খরচগুলো।\nতুমি শুধু উপভোগ করো!',
    },
  ];

  // Keyboard awareness listener: Lifts the input box & continue button smoothly above the keyboard
  useEffect(() => {
    const onShow = (e: KeyboardEvent) => {
      isInputFocusedRef.current = true;
      const h = e.endCoordinates.height;
      // Calculate offset so bottomControls lands right above keyboard
      const targetOffset = Math.max(0, h - insets.bottom);
      const duration = 'duration' in e && typeof e.duration === 'number' && e.duration > 0
        ? e.duration
        : 240;

      keyboardOffset.value = withTiming(targetOffset, {
        duration,
        easing: Easing.out(Easing.cubic),
      });
    };

    const onHide = (e?: KeyboardEvent) => {
      isInputFocusedRef.current = false;
      const duration = e && 'duration' in e && typeof e.duration === 'number' && e.duration > 0
        ? e.duration
        : 220;

      keyboardOffset.value = withTiming(0, {
        duration,
        easing: Easing.out(Easing.cubic),
      });
    };

    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      onShow
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      onHide
    );

    // On modern Android, keyboardWillShow / keyboardWillHide may also fire for earlier animation sync
    let androidWillShowSub: ReturnType<typeof Keyboard.addListener> | undefined;
    let androidWillHideSub: ReturnType<typeof Keyboard.addListener> | undefined;
    if (Platform.OS === 'android') {
      try {
        androidWillShowSub = Keyboard.addListener('keyboardWillShow', onShow);
        androidWillHideSub = Keyboard.addListener('keyboardWillHide', onHide);
      } catch {
        // Fallback gracefully to keyboardDidShow/keyboardDidHide
      }
    }

    return () => {
      showSub.remove();
      hideSub.remove();
      androidWillShowSub?.remove();
      androidWillHideSub?.remove();
    };
  }, [insets.bottom, keyboardOffset]);

  // Auto-move slider every 2 seconds unless user is typing their name
  useEffect(() => {
    const timer = setInterval(() => {
      if (isInputFocusedRef.current) return;

      const nextIndex = (activeIndexRef.current + 1) % slides.length;
      pagerRef.current?.scrollTo({
        x: nextIndex * screenWidth,
        animated: true,
      });
      setActiveIndex(nextIndex);
    }, 2000);

    return () => clearInterval(timer);
  }, [screenWidth, slides.length]);

  // Prevent bypassing onboarding with Android hardware back button
  useEffect(() => {
    const backAction = () => {
      const completed = useBontonStore.getState().hasCompletedOnboarding;
      if (!completed) {
        BackHandler.exitApp();
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, []);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / screenWidth);
    if (index >= 0 && index < slides.length && index !== activeIndexRef.current) {
      setActiveIndex(index);
    }
  };

  const goToSlide = (idx: number) => {
    haptics.tap();
    pagerRef.current?.scrollTo({
      x: idx * screenWidth,
      animated: true,
    });
    setActiveIndex(idx);
  };

  const handleContinue = () => {
    haptics.tap();
    Keyboard.dismiss();

    // If user typed name or reached the last slide, finish onboarding
    if (name.trim().length > 0 || activeIndex === slides.length - 1) {
      finish();
    } else {
      const nextIndex = (activeIndex + 1) % slides.length;
      pagerRef.current?.scrollTo({
        x: nextIndex * screenWidth,
        animated: true,
      });
      setActiveIndex(nextIndex);
    }
  };

  const finish = () => {
    haptics.success();
    Keyboard.dismiss();
    completeOnboarding(name);
    router.replace('/(tabs)');
  };

  // Animated style that shifts content up when keyboard opens
  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -keyboardOffset.value }],
  }));

  return (
    <View style={styles.root}>
      {/* Phone System Status Bar: Dark icons on light background */}
      <StatusBar style="dark" />
      <SystemBars style={{ statusBar: 'dark', navigationBar: 'dark' }} />

      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <Animated.View style={[styles.innerContainer, animatedContainerStyle]}>
          {/* Center Slides Pager starting from the absolute top */}
          <ScrollView
            ref={pagerRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleScroll}
            onScrollEndDrag={handleScroll}
            scrollEventThrottle={16}
            bounces={false}
            style={styles.pager}
            contentContainerStyle={styles.pagerContent}
          >
            {slides.map((slide) => (
              <View key={slide.id} style={[styles.slide, { width: screenWidth }]}>
                {/* Top Illustration: Bleeds edge-to-edge full width from top */}
                <View style={[styles.imageWrapper, { width: screenWidth, height: imageHeight }]}>
                  <Image
                    source={slide.image}
                    style={[styles.image, { width: screenWidth, height: imageHeight }]}
                    resizeMode="cover"
                  />
                </View>

                {/* Typography */}
                <View style={styles.textWrapper}>
                  {slide.renderTitle(accentColor)}
                  <Text style={styles.subtitleText}>{slide.subtitle}</Text>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Bottom Controls: Dots, Name Input, and Continue Button */}
          <View
            style={[
              styles.bottomControls,
              { paddingBottom: Math.max(insets.bottom, 16) + 8 },
            ]}
          >
            {/* Pagination Dots */}
            <View style={styles.dotsRow}>
              {slides.map((_, idx) => (
                <PressableScale
                  key={idx}
                  onPress={() => goToSlide(idx)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={`Slide ${idx + 1}`}
                  style={[
                    styles.dot,
                    idx === activeIndex
                      ? [styles.activeDot, { backgroundColor: accentColor }]
                      : styles.inactiveDot,
                  ]}
                />
              ))}
            </View>

            {/* Name Input Field */}
            <View style={styles.inputContainer}>
              <User size={20} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder={t('onboarding.namePlaceholder', 'আপনার নাম')}
                placeholderTextColor="#9CA3AF"
                value={name}
                onChangeText={setName}
                onFocus={() => {
                  isInputFocusedRef.current = true;
                }}
                onBlur={() => {
                  isInputFocusedRef.current = false;
                }}
                returnKeyType="done"
                onSubmitEditing={handleContinue}
                maxLength={35}
                autoCorrect={false}
              />
            </View>

            {/* Mandatory Continue Button */}
            <PressableScale
              scaleTo={0.96}
              onPress={handleContinue}
              style={styles.continueButton}
              accessibilityRole="button"
              accessibilityLabel="Continue"
            >
              <Text style={styles.continueButtonText}>
                {t('onboarding.continue', 'Continue →')}
              </Text>
            </PressableScale>
          </View>
        </Animated.View>
      </TouchableWithoutFeedback>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  innerContainer: {
    flex: 1,
  },
  pager: {
    flex: 1,
  },
  pagerContent: {
    alignItems: 'stretch',
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  imageWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  image: {
    top: 0,
    left: 0,
  },
  textWrapper: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 24,
    paddingTop: 14,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlightBlock: {
    position: 'relative',
    alignItems: 'center',
  },
  brushContainer: {
    position: 'absolute',
    bottom: -6,
    alignItems: 'center',
  },
  titleText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    lineHeight: 34,
    letterSpacing: -0.4,
  },
  subtitleText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 6,
  },

  /* --- Bottom Controls --- */
  bottomControls: {
    paddingHorizontal: 24,
    paddingTop: 10,
    backgroundColor: '#FFFFFF',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 16,
  },
  dot: {
    height: 7,
    borderRadius: 4,
  },
  activeDot: {
    width: 24,
  },
  inactiveDot: {
    width: 7,
    backgroundColor: '#E5E7EB',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  continueButton: {
    height: 54,
    borderRadius: 16,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
}));