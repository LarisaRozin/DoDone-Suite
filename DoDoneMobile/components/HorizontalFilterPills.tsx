/*
 * Copyright (c) 2025 Larisa Rozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
/**
 * Horizontal Filter Pills Component
 * @format
 */

import React from 'react';
import { TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { IconButton } from 'react-native-paper';
import { Text } from './StyledText';
import { colors } from '../defaultTheme';

interface FilterOption {
  value: string;
  label: string;
  icon?: string;
  count?: number;
}

interface HorizontalFilterPillsProps {
  options: FilterOption[];
  selectedValue: string;
  onValueChange: (value: string) => void;
  style?: any;
  showCounts?: boolean;
}

const HorizontalFilterPills: React.FC<HorizontalFilterPillsProps> = ({
  options,
  selectedValue,
  onValueChange,
  style,
  showCounts = false
}) => {
  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.container, style]}
      style={styles.scrollView}
      accessible={true}
      accessibilityRole="tablist"
      accessibilityLabel="Filter options"
    >
      {options.map((option) => {
        const isSelected = option.value === selectedValue;
        
        return (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.pill,
              isSelected && styles.selectedPill,
            ]}
            onPress={() => onValueChange(option.value)}
            activeOpacity={0.7}
            accessible={true}
            accessibilityRole="tab"
            accessibilityLabel={`${option.label}${showCounts && option.count !== undefined ? ` with ${option.count} items` : ''}`}
            accessibilityHint={`Double tap to filter by ${option.label}`}
            accessibilityState={{ selected: isSelected }}
          >
            {option.icon && (
              <IconButton
                icon={option.icon}
                size={16}
                iconColor={isSelected ? colors.primary : colors.textOnPrimary}
                style={styles.pillIcon}
                accessible={false}
              />
            )}
            <Text
              variant="labelSmall"
              style={[
                styles.pillText,
                isSelected && styles.selectedPillText,
              ]}
              numberOfLines={1}
              accessible={false}
            >
              {option.label}
              {showCounts && option.count !== undefined ? ` (${option.count})` : ''}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flexGrow: 0,
  },
  container: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    minHeight: 36,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  selectedPill: {
    backgroundColor: colors.backgroundPaper,
    borderColor: colors.primaryDark,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  pillIcon: {
    margin: 0,
    marginRight: 4,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textOnPrimary,
    textAlign: 'center',
  },
  selectedPillText: {
    color: colors.primary,
    fontWeight: '700',
  },
});

export default HorizontalFilterPills;
