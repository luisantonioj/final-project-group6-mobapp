/**
 * SplashScreen.tsx — Animated launch screen
 * ─────────────────────────────────────────────────────────────────────────────
 * Plays a 3-step entrance animation, then replaces itself with either
 * 'Login' or 'App' depending on whether a session already exists.
 *
 * ANIMATION SEQUENCE (all using React Native's built-in Animated API):
 *   0 ms  — screen mounts, everything invisible / scaled down
 *   200ms — logo fades in + scales up (spring)
 *   600ms — title text fades in + slides up
 *   900ms — loading bar fills from 0% to 100% over 1400ms
 *   2300ms — navigate away (fade transition)
 *
 * CUSTOMISATION:
 *   • Swap the "AQ" text logo for an <Image> once the real logo asset is ready:
 *       <Image source={require('../../assets/images/logoCrop.png')}
 *              style={{ width: 80, height: 80 }} resizeMode="contain" />
 *   • Adjust TOTAL_DURATION to speed up / slow down the sequence.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Animated,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { StatusBar }  from 'expo-status-bar';
import { useRoute }   from '@react-navigation/native';
import { useAuthStore } from '../stores/authStore';

const { width } = Dimensions.get('window');
const TOTAL_DURATION = 2400;

export function SplashScreen() {
  const route  = useRoute();
  const { setSplashReady } = useAuthStore();

  // Animated values
  const logoOpacity     = useRef(new Animated.Value(0)).current;
  const logoScale       = useRef(new Animated.Value(0.6)).current;
  const titleOpacity    = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(18)).current;
  const barWidth        = useRef(new Animated.Value(0)).current;
  const screenOpacity   = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Step 1 — Logo entrance
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1, duration: 500, delay: 200, useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1, delay: 200, useNativeDriver: true,
        tension: 80, friction: 7,
      }),
    ]).start();

    // Step 2 — Title entrance
    Animated.parallel([
      Animated.timing(titleOpacity, {
        toValue: 1, duration: 450, delay: 650, useNativeDriver: true,
      }),
      Animated.timing(titleTranslateY, {
        toValue: 0, duration: 450, delay: 650, useNativeDriver: true,
      }),
    ]).start();

    // Step 3 — Loading bar
    Animated.timing(barWidth, {
      toValue: 1, duration: 1300, delay: 900, useNativeDriver: false,
    }).start();

    // Step 4 — Fade out + signal RootNavigator that splash is done
    const timer = setTimeout(() => {
      Animated.timing(screenOpacity, {
        toValue: 0, duration: 300, useNativeDriver: true,
      }).start(() => {
    console.log('splash animation done, setting splashReady');
    setSplashReady(true); // ✅ no function in params
    });
    }, TOTAL_DURATION);

    return () => clearTimeout(timer);
  }, []);

  const barWidthInterpolated = barWidth.interpolate({
    inputRange:  [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View style={[s.container, { opacity: screenOpacity }]}>
      <StatusBar style="light" />

      {/* ── Logo ── */}
      <Animated.View style={[s.logoWrap, {
        opacity: logoOpacity,
        transform: [{ scale: logoScale }],
      }]}>
        <View style={s.logoCircle}>
          <Text style={s.logoLetters}>AQ</Text>
        </View>
      </Animated.View>

      {/* ── Title + tagline ── */}
      <Animated.View style={{
        opacity: titleOpacity,
        transform: [{ translateY: titleTranslateY }],
        alignItems: 'center',
      }}>
        <Text style={s.appName}>AnimoQuorum</Text>
        <Text style={s.tagline}>DLSL COMELEC · Student Elections</Text>
      </Animated.View>

      {/* ── Loading bar ── */}
      <View style={s.barTrack}>
        <Animated.View style={[s.barFill, { width: barWidthInterpolated }]} />
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0F0A',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  logoWrap: {
    marginBottom: 8,
  },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: '#0F6E56',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#22C55E',
  },
  logoLetters: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#F0FFF0',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 12,
    color: '#4B6B4B',
    letterSpacing: 0.8,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  barTrack: {
    position: 'absolute',
    bottom: 60,
    width: width * 0.45,
    height: 3,
    backgroundColor: '#1E2E1E',
    borderRadius: 99,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#22C55E',
    borderRadius: 99,
  },
});