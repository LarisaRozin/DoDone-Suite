/*
 * Copyright (c) 2025 Larisa Rozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
import React, {FC, useState, useEffect} from 'react';
import {Text, View, StyleSheet, useWindowDimensions, Platform} from 'react-native';
import Slider, {MarkerProps, SliderProps} from '@react-native-community/slider';
import { colors } from '../defaultTheme';

export interface SliderComponentProps extends SliderProps {
  title: string;
  platform?: string;
};

const CONSTANTS = {
  MAX_VALUE: 100,
  MIN_VALUE: 0,
  STEP: 10,
//   DEFAULT_STEP_RESOLUTION: 100,
} as const;

const CustomStepMarkerComponent: FC<MarkerProps> = ({
  stepMarked,
  currentValue,
  index,
}) => {
  if (stepMarked) {
    return (
      <View style={localStyles.activeMarkerContainer}>
        <View style={localStyles.activeMarkerBubble}>
          <Text style={localStyles.activeMarkerText}>{index}%</Text>
        </View>
        {/* Render pointer with iOS-specific styling to avoid white tail */}
        <View style={Platform.OS === 'ios' ? localStyles.activeMarkerPointerIOS : localStyles.activeMarkerPointer} />
      </View>
    );
  }
  return currentValue !== undefined && currentValue > index ? (
    <View style={[localStyles.trackDot, localStyles.filled]} />
  ) : (
    <View style={[localStyles.trackDot, localStyles.empty]} />
  );
};

export const SliderComponent = (props: SliderComponentProps) => {
  const [value, setValue] = useState(props.value ?? CONSTANTS.MIN_VALUE);
  const { width: screenWidth } = useWindowDimensions();
  
  // Calculate slider width accounting for:
  // - Wrapper padding: 24px * 2 = 48px
  // Total: 48px to subtract from screen width
  const sliderWidth = Math.max(250, screenWidth - 48);
  
  // Update internal state when props.value changes
  useEffect(() => {
    if (props.value !== undefined) {
      setValue(props.value);
    }
  }, [props.value]);
  
  const handleValueChange = (newValue: number) => {
    setValue(newValue);
    if (props.onValueChange) {
      props.onValueChange(newValue);
    }
  };
  
  return (
    <View style={localStyles.container}>
      <Text style={localStyles.text}>{props.title}</Text>
      <View style={localStyles.sliderWrapper}>
        <Slider
          step={CONSTANTS.STEP}
          style={[localStyles.slider, { width: sliderWidth }, props.style]}
          minimumValue={CONSTANTS.MIN_VALUE}
          maximumValue={CONSTANTS.MAX_VALUE}
          renderStepNumber={true}
          tapToSeek={true}
          StepMarker={CustomStepMarkerComponent}
          {...props}
          value={value}
          onValueChange={handleValueChange}
          minimumTrackTintColor={'#00629A'}
          maximumTrackTintColor={'#979EA4'}
          thumbTintColor={Platform.select({
            ios: 'transparent',
            android: undefined,
          })}
          accessible={true}
          accessibilityRole="adjustable"
          accessibilityLabel={`${props.title} slider, current value: ${value}%`}
          accessibilityHint="Drag slider to adjust value or tap on track"
          accessibilityValue={{ text: `${value}%` }}
        />
      </View>
    </View>
  );
};

const localStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
    // Remove container padding - let the wrapper handle all spacing
  },
  sliderWrapper: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 24, // Match other components' padding exactly
    paddingTop: 5, // Top padding to ensure thumb isn't cut off
    paddingBottom: 5, // Reduced bottom padding while still accommodating the iOS pointer
  },
  text: {
    fontSize: 14,
    textAlign: 'left',
    fontWeight: '500',
    marginLeft: 0, // Remove extra margin since wrapper handles padding
    paddingLeft: 16,
    marginBottom: -5, // Negative margin to bring label closer to slider
    color: colors.textSecondary,
    width: '100%',
  },
  trackText: {
    color: colors.primaryContrastText,
    fontSize: 10,
    justifyContent: 'center',
    alignSelf: 'center',
    top: 12,
  },
  trackDot: {
    width: 10,
    height: 10,
    borderRadius: 10,
    top: 4,
  },
  empty: {
    // backgroundColor: '#B3BFC9',
    backgroundColor: colors.secondaryDark,
  },
  filled: {
    // backgroundColor: '#00629A',
    backgroundColor: colors.primary,
  },
  // New clean step marker styles
  activeMarkerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    top: -25, // Move the entire marker up so the bubble centers on the track
    paddingVertical: 10, // Add padding to increase touch target area
    paddingHorizontal: 8, // Add horizontal padding for easier touch
    ...Platform.select({
      ios: {
        // iOS-specific container adjustments - allow overflow for pointer visibility
        overflow: 'visible',
        backgroundColor: 'transparent',
        paddingBottom: 15, // Extra bottom padding to accommodate the pointer
      },
      android: {
        paddingBottom: 5, // Less padding needed for Android border-based pointer
      },
    }),
  },
  activeMarkerBubble: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    minWidth: 50,
    minHeight: 32, // Ensure minimum height for better touch target
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    ...Platform.select({
      ios: {
        // iOS-specific adjustments to eliminate white tail while keeping shadow
        shadowOpacity: 0.1,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 1 },
        borderWidth: 0,
        overflow: 'visible', // Allow pointer to show outside bubble bounds
      },
      android: {
        overflow: 'hidden', // Keep hidden on Android for border-based pointer
      },
    }),
  },
  activeMarkerText: {
    color: colors.primaryContrastText,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  activeMarkerPointer: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.primary,
    marginTop: -1,
    position: 'absolute',
    bottom: -5, // Position the pointer at the bottom of the bubble
    ...Platform.select({
      ios: {
        // iOS-specific fix for white tail issue
        overflow: 'hidden',
        borderBottomWidth: 0,
        borderBottomColor: 'transparent',
      },
      android: {},
    }),
  },
  activeMarkerPointerIOS: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.primary,
    position: 'absolute',
    bottom: -4,
    borderBottomWidth: 0,
    borderBottomColor: 'transparent',
  },
  slider: {
    opacity: 1,
    marginTop: 10,
    marginBottom: 8, // Reduced bottom margin to minimize space under slider
    // Remove excessive margins that were breaking full width
  },
});

export default SliderComponent;
