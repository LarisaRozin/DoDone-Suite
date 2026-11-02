/*
 * Copyright (c) 2025 Larisa Rozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Dimensions, Animated, Text } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { colors, fonts } from '../defaultTheme';
import { NotificationType } from '@larisarozin/dodone-shared';
// import { NotificationData } from '../services/PushNotificationService';

interface CelebrationOverlayProps {
  visible: boolean;
  type: NotificationType;
  // title: string;
  body: string;
  // data: NotificationData;
  onAnimationComplete: () => void;
}

const CelebrationOverlay: React.FC<CelebrationOverlayProps> = ({
  visible,
  type,
  // title,
  body,
  // data,
  onAnimationComplete,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const confettiRef = useRef<any>(null);

  const { width, height } = Dimensions.get('window');

  const hideAnimation = React.useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.5,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onAnimationComplete();
    });
  }, [fadeAnim, scaleAnim, onAnimationComplete]);

  useEffect(() => {
    if (visible) {
      // Start celebration animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();

      // Trigger confetti
      if (confettiRef.current) {
        confettiRef.current.start();
      }

      // Auto-hide after 4 seconds
      const timer = setTimeout(() => {
        hideAnimation();
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [visible, fadeAnim, scaleAnim, hideAnimation]);

  if (!visible) return null;

  const getMessage = () => {
    if (type === NotificationType.AllowanceApproved) {
      return `🎉 ${body}`;
    } else if (type === NotificationType.BonusApproved) {
      return `🌟 ${body} 🎁`;
    } else if (type === NotificationType.TaskAllowanceApproved) {
      return `🎉 ${body}`;
    }
    return '🎉 Congratulations!';
  };

  const getColors = () => {
    // if (type === 'allowanceApproved') {
    //   return {
    //     primary: colors.success,
    //     secondary: colors.accent,
    //     confetti: ['#00ff00', '#32cd32', '#90ee90', '#98fb98', '#f0fff0'],
        // confetti: ['#ffd700', '#ffff00', '#ffffe0', '#fffacd', '#f0e68c'],
    //   };
    // } else {
      return {
        primary: colors.primary,
        secondary: colors.accent,
        confetti: ['#00ff00', '#f70606ff', '#c800ffff', '#0040ffd6', '#02f4fcff'],
      };
    // }
  };

  const celebrationColors = getColors();

  return (
    <View 
      style={styles.overlay} 
      pointerEvents="none"
      accessible={true}
      accessibilityRole="alert"
      accessibilityLabel={getMessage()}
      accessibilityLiveRegion="assertive"
    >
      {/* Confetti cannons from multiple positions */}
      <ConfettiCannon
        // @ts-ignore - ref prop type issue in newer TypeScript versions
        ref={confettiRef}
        count={200}
        origin={{ x: -10, y: 0 }}
        autoStart={false}
        fadeOut={true}
        colors={celebrationColors.confetti}
        explosionSpeed={350}
        fallSpeed={2500}
      />
      <ConfettiCannon
        count={200}
        origin={{ x: width + 10, y: 0 }}
        autoStart={visible}
        fadeOut={true}
        colors={celebrationColors.confetti}
        explosionSpeed={350}
        fallSpeed={2500}
      />
      <ConfettiCannon
        count={150}
        origin={{ x: width / 2, y: height / 3 }}
        autoStart={visible}
        fadeOut={true}
        colors={celebrationColors.confetti}
        explosionSpeed={300}
        fallSpeed={2000}
      />

      {/* Celebration message */}
      <Animated.View
        style={[
          styles.messageContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
        accessible={true}
        accessibilityRole="text"
        accessibilityLabel={getMessage()}
      >
        <View 
          style={[styles.messageCard, { borderColor: celebrationColors.primary }]}
          accessible={false}
        >
          <Text 
            style={[styles.celebrationText, { color: celebrationColors.primary }]}
            accessible={false}
          >
            {getMessage()}
          </Text>
        </View>
      </Animated.View>

      {/* Floating sparkles animation */}
      <View style={styles.sparklesContainer}>
        {[...Array(8)].map((_, index) => (
          <FloatingSparkle
            key={index}
            delay={index * 200}
            color={celebrationColors.secondary}
          />
        ))}
      </View>
    </View>
  );
};

interface FloatingSparkleProps {
  delay: number;
  color: string;
}

const FloatingSparkle: React.FC<FloatingSparkleProps> = ({ delay, color }) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const { width, height } = Dimensions.get('window');

  useEffect(() => {
    const startAnimation = () => {
      setTimeout(() => {
        Animated.loop(
          Animated.parallel([
            Animated.sequence([
              Animated.timing(opacity, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
              }),
              Animated.timing(opacity, {
                toValue: 0,
                duration: 800,
                useNativeDriver: true,
              }),
            ]),
            Animated.timing(translateY, {
              toValue: -height,
              duration: 3000,
              useNativeDriver: true,
            }),
          ])
        ).start();
      }, delay);
    };

    startAnimation();
  }, [delay, opacity, translateY, height]);

  const randomX = Math.random() * width;

  return (
    <Animated.View
      style={[
        styles.sparkle,
        {
          left: randomX,
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <Text style={[styles.sparkleText, { color }]}>🎈</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageCard: {
    backgroundColor: colors.backgroundDefault,
    borderRadius: 20,
    padding: 24,
    borderWidth: 3,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  celebrationText: {
    fontFamily: fonts.fredokaBold,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 32,
  },
  sparklesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sparkle: {
    position: 'absolute',
    bottom: 0,
  },
  sparkleText: {
    fontSize: 20,
  },
});

export default CelebrationOverlay;