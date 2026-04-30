/**
 * SplashScreen.tsx — Animated launch screen
 * ─────────────────────────────────────────────────────────────────────────────
 * Plays a 3-step entrance animation, then replaces itself with either
 * 'Login' or 'App' depending on whether a session already exists.
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
import { StatusBar }    from 'expo-status-bar';
import { useRoute }     from '@react-navigation/native';
import { useAuthStore } from '../stores/authStore';
import { T }            from '../theme';

const { width } = Dimensions.get('window');
const TOTAL_DURATION = 2400;

export function SplashScreen() {
  const route  = useRoute();
  const { setSplashReady } = useAuthStore();

  const logoOpacity     = useRef(new Animated.Value(0)).current;
  const logoScale       = useRef(new Animated.Value(0.6)).current;
  const titleOpacity    = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(18)).current;
  const barWidth        = useRef(new Animated.Value(0)).current;
  const screenOpacity   = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1, duration: 500, delay: 200, useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1, delay: 200, useNativeDriver: true,
        tension: 80, friction: 7,
      }),
    ]).start();

    Animated.parallel([
      Animated.timing(titleOpacity, {
        toValue: 1, duration: 450, delay: 650, useNativeDriver: true,
      }),
      Animated.timing(titleTranslateY, {
        toValue: 0, duration: 450, delay: 650, useNativeDriver: true,
      }),
    ]).start();

    Animated.timing(barWidth, {
      toValue: 1, duration: 1300, delay: 900, useNativeDriver: false,
    }).start();

    const timer = setTimeout(() => {
      Animated.timing(screenOpacity, {
        toValue: 0, duration: 300, useNativeDriver: true,
      }).start(() => {
        console.log('splash animation done, setting splashReady');
        setSplashReady(true);
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
      <StatusBar style="dark" />

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
    backgroundColor: T.bg,
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
    backgroundColor: T.green,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: T.green,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.30,
    shadowRadius: 14,
    elevation: 8,
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
    color: T.text,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 12,
    color: T.textMuted,
    letterSpacing: 0.8,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  barTrack: {
    position: 'absolute',
    bottom: 60,
    width: width * 0.45,
    height: 3,
    backgroundColor: T.border,
    borderRadius: 99,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: T.green,
    borderRadius: 99,
  },
});