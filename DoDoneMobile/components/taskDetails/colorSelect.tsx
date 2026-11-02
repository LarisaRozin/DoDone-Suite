/*
 * Copyright (c) 2025 Larisa Rozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
import React from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../defaultTheme';

interface ColorOption {
  name: string;
  value: string;
  displayName: string;
}

interface IProps {
  onSelect: (color: string) => void;
  title: string;
}

const colorOptions: ColorOption[] = [
  // Black, White, Gray
  { name: 'black', value: '#000000', displayName: 'Black' },
  { name: 'white', value: '#FFFFFF', displayName: 'White' },
  { name: 'dark-gray', value: '#404040', displayName: 'Dark Gray' },
  { name: 'gray', value: '#808080', displayName: 'Gray' },
  { name: 'light-gray', value: '#D3D3D3', displayName: 'Light Gray' },
  
  // Reds
  { name: 'highlight', value: colors.highlight, displayName: 'Coral Red' },
  { name: 'red', value: '#FF0000', displayName: 'Red' },
  { name: 'maroon', value: '#800000', displayName: 'Maroon' },
  { name: 'fuchsia', value: '#FF00FF', displayName: 'Fuchsia' },
  
  // Oranges
  { name: 'primaryDark', value: colors.primaryDark, displayName: 'Dark Orange' },
  { name: 'primary', value: colors.primary, displayName: 'Medium Orange' },
  { name: 'primaryLight', value: colors.primaryLight, displayName: 'Light Orange' },
  { name: 'warning', value: colors.warning, displayName: 'Amber Orange' },
  { name: 'orange', value: '#FFA500', displayName: 'Orange' },
  
  // Yellows
  { name: 'yellow', value: '#FFFF00', displayName: 'Yellow' },
  { name: 'olive', value: '#808000', displayName: 'Olive' },
  
  // Greens
  { name: 'accentDark', value: colors.accentDark, displayName: 'Dark Green' },
  { name: 'avatarBg', value: colors.avatarBg, displayName: 'Forest Green' },
  { name: 'accent', value: colors.accent, displayName: 'Medium Green' },
  { name: 'accentLight', value: colors.accentLight, displayName: 'Light Green' },
  { name: 'lime', value: '#00FF00', displayName: 'Lime' },
  { name: 'teal', value: '#008080', displayName: 'Teal' },
  
  // Blues
  { name: 'navy', value: '#000080', displayName: 'Navy' },
  { name: 'secondaryDark', value: colors.secondaryDark, displayName: 'Dark Blue' },
  { name: 'secondary', value: colors.secondary, displayName: 'Medium Blue' },
  { name: 'secondaryLight', value: colors.secondaryLight, displayName: 'Light Blue' },
  { name: 'blue', value: '#0000FF', displayName: 'Blue' },
  { name: 'aqua', value: '#00FFFF', displayName: 'Aqua' },
  
  // Purples and Pinks
  { name: 'purple', value: '#800080', displayName: 'Purple' },
  { name: 'pink', value: '#FFC0CB', displayName: 'Pink' },
  
  // Browns
  { name: 'brown', value: '#A52A2A', displayName: 'Brown' },
];

export function ColorView(props: IProps) {
  const { onSelect, title } = props;
  const insets = useSafeAreaInsets();

  const handleColorSelect = (color: ColorOption) => {
    onSelect(color.value);
  };

  const getTextColor = (backgroundColor: string): string => {
    const lightColors = ['#FFFFFF', '#FFFF00', '#00FF00', '#FFC0CB', '#D3D3D3', '#00FFFF', '#FF00FF'];
    return lightColors.includes(backgroundColor) ? '#000000' : '#FFFFFF';
  };

  // Calculate dynamic height: ensure full content visibility with safe area padding
  const dynamicHeight = Math.max(350, 400 + insets.bottom);

  return (
    <View style={[styles.container, { 
      height: dynamicHeight,
      paddingBottom: insets.bottom, // Add padding to keep content above device navigation
    }]}>
      <Text style={styles.header}>{title}</Text>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
      >
        <View style={styles.view}>
          <View style={styles.colorGrid}>
            {colorOptions.map((color) => (
              <TouchableOpacity
                key={color.name}
                style={[
                  styles.colorItem,
                  { backgroundColor: color.value },
                  color.value === '#FFFFFF' && styles.whiteBorder
                ]}
                onPress={() => handleColorSelect(color)}
                activeOpacity={0.7}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`Select color: ${color.displayName}`}
                accessibilityHint={`Changes color to ${color.displayName}`}
              >
                <Text 
                  style={[
                    styles.colorText,
                    { color: getTextColor(color.value) }
                  ]}
                >
                  {color.displayName}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.backgroundDefault,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  scrollView: {
    flex: 1,
    marginTop: 50, // Leave space for the fixed header
  },
  scrollContent: {
    paddingBottom: 20, // Extra padding to ensure all content is visible
    flexGrow: 1,
  },
  view: {
    alignSelf: 'center',
    flexDirection: 'column',
    width: Math.min(Dimensions.get('window').width - 10, 400),
    paddingVertical: 15, // Increased padding for better spacing
    paddingHorizontal: 5,
  },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    textAlign: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: colors.accent,
    borderTopWidth: 2,
    borderTopColor: colors.accent,
    borderLeftWidth: 2,
    borderLeftColor: colors.accent,
    borderRightWidth: 2,
    borderRightColor: colors.accent,
    backgroundColor: colors.backgroundDefault,
    // Fixed positioning at top of container
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  colorItem: {
    width: '48%',
    paddingHorizontal: 10,
    paddingVertical: 15,
    marginVertical: 3,
    borderRadius: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    alignItems: 'center',
    justifyContent: 'center',
  },
  whiteBorder: {
    borderWidth: 1,
    borderColor: '#CCCCCC',
  },
  colorText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default ColorView;
