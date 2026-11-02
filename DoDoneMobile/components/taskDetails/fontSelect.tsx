/*
 * Copyright (c) 2025 Larisa Rozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
import React from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../defaultTheme';

interface FontOption {
  name: string;
  fontFamily: string;
  displayName: string;
}

interface IProps {
  onSelect: (fontFamily: string) => void;
}

const fontOptions: FontOption[] = [
  { name: 'default', fontFamily: 'inherit', displayName: 'Default' },
  { name: 'monospace', fontFamily: 'monospace', displayName: 'Monospace' },
  { name: 'fredoka', fontFamily: 'Fredoka-Regular', displayName: 'Fredoka' },
  { name: 'courier', fontFamily: 'Courier New, Courier, monospace', displayName: 'Courier' },
  { name: 'serif', fontFamily: 'serif', displayName: 'Serif' },
  { name: 'sans-serif', fontFamily: 'sans-serif', displayName: 'Sans Serif' },
  { name: 'times', fontFamily: 'Times New Roman, Times, serif', displayName: 'Times New Roman' },
  { name: 'arial', fontFamily: 'Arial, sans-serif', displayName: 'Arial' },
  { name: 'helvetica', fontFamily: 'Helvetica, Arial, sans-serif', displayName: 'Helvetica' },
  { name: 'georgia', fontFamily: 'Georgia, serif', displayName: 'Georgia' },
  { name: 'fantasy', fontFamily: 'fantasy', displayName: 'Fantasy' },
  { name: 'cursive', fontFamily: 'cursive', displayName: 'Cursive' },
];

export function FontView(props: IProps) {
  const { onSelect } = props;
  const insets = useSafeAreaInsets();

  const handleFontSelect = (font: FontOption) => {
    onSelect(font.fontFamily);
  };

  // Calculate dynamic height to fit above safe area, including padding
  const dynamicHeight = Math.max(250, 300 + insets.bottom);

  return (
    <View style={[styles.container, { 
      height: dynamicHeight,
      paddingBottom: insets.bottom, // Add padding to keep content above device navigation
    }]}>
      <Text style={styles.header}>Select Font</Text>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
      >
        <View style={styles.view}>
          {fontOptions.map((font) => (
            <TouchableOpacity
              key={font.name}
              style={styles.item}
              onPress={() => handleFontSelect(font)}
              activeOpacity={0.7}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`Select font: ${font.displayName}`}
              accessibilityHint={`Changes text font to ${font.displayName}`}
            >
              <Text 
                style={[
                  styles.fontText,
                  { 
                    fontFamily: font.fontFamily === 'inherit' ? undefined : 
                      font.fontFamily === 'Fredoka-Regular' ? 'Fredoka-Regular' :
                      font.fontFamily.split(',')[0].trim().replace(/['"]/g, '')
                  }
                ]}
              >
                {font.displayName}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.backgroundDefault,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  scrollView: {
    flex: 1,
    marginTop: 50, // Leave space for the fixed header (same as ColorView)
  },
  view: {
    alignSelf: 'center',
    flexDirection: 'column',
    width: Math.min(Dimensions.get('window').width - 10, 400),
    paddingVertical: 15,
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
    // Fixed positioning at top of container (same as ColorView)
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  item: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.textSecondary,
    backgroundColor: 'white',
    marginHorizontal: 5,
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
  },
  fontText: {
    fontSize: 18,
    color: colors.textPrimary,
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default FontView;