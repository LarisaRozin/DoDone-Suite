/*
 * Copyright (c) 2025 Larisa Rozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
/**
 * Custom Segmented Control Component
 * @format
 */

import React from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Text } from './StyledText';
import { colors } from '../defaultTheme';

interface SegmentOption {
  value: string;
  label: string;
  icon?: string;
  shortLabel?: string;
}

interface CustomSegmentedControlProps {
  options: SegmentOption[];
  selectedValue: string;
  onValueChange: (value: string) => void;
  style?: any;
}

const CustomSegmentedControl: React.FC<CustomSegmentedControlProps> = ({
  options,
  selectedValue,
  onValueChange,
  style
}) => {
  return (
    <View 
      style={[styles.container, style]}
      accessible={true}
      accessibilityRole="tablist"
      accessibilityLabel="Segment control with options"
    >
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        accessible={false}
      >
        {options.map((option, index) => {
          const isSelected = option.value === selectedValue;
          const isFirst = index === 0;
          const isLast = index === options.length - 1;
          
          return (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.segment,
                isSelected && styles.selectedSegment,
                isFirst && styles.firstSegment,
                isLast && styles.lastSegment,
              ]}
              onPress={() => onValueChange(option.value)}
              activeOpacity={0.7}
              accessible={true}
              accessibilityRole="tab"
              accessibilityLabel={option.label}
              accessibilityHint={`Double tap to select ${option.label}`}
              accessibilityState={{ selected: isSelected }}
            >
              <Text
                variant="labelSmall"
                style={[
                  styles.segmentText,
                  isSelected && styles.selectedSegmentText,
                ]}
                numberOfLines={1}
                accessible={false}
              >
                {option.shortLabel || option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 10,
    padding: 2,
    minHeight: 44,
  },
  scrollContent: {
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  segment: {
    flex: 1,
    minWidth: 60,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderRadius: 8,
    marginHorizontal: 1,
  },
  firstSegment: {
    marginLeft: 0,
  },
  lastSegment: {
    marginRight: 0,
  },
  selectedSegment: {
    backgroundColor: colors.backgroundDefault,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  segmentText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textOnPrimary,
    textAlign: 'center',
  },
  selectedSegmentText: {
    color: colors.primary,
    fontWeight: '700',
  },
});

export default CustomSegmentedControl;
