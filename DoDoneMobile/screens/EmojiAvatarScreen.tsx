/*
 * Copyright (c) 2025 Larisa Rozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, TextInput, Platform } from 'react-native';
import { Chip } from 'react-native-paper';
import { Text, Button } from '../components/StyledText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../defaultTheme';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { useConfirmationDialog } from '../hooks/useConfirmationDialog';

interface EmojiAvatarScreenProps {
  navigation: any;
  route: {
    params: {
      onSelect: (emoji: string, backgroundColor: string) => void;
      currentEmoji?: string;
      currentBackgroundColor?: string;
    };
  };
}

const EMOJI_CATEGORIES = {
  Happy: ['😊', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😋', '😛', '😝', '😜', '🤪', '😇', '😍', '🥰', '😘', '😗'],
  Animals: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐻‍❄️', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🙈', '🙉'],
  Nature: ['🌸', '🌺', '🌻', '🌷', '🌹', '🌲', '🌳', '🌴', '🍀', '🌿', '🌱', '🌾', '🌵', '🌊', '⭐', '🌟', '✨', '🌈'],
  Food: ['🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🥝', '🍑', '🥭', '🍍', '🥥', '🥕', '🌽', '🍕', '🍰', '🧁', '🍪'],
  Fun: ['🎈', '🎉', '🎊', '🎁', '🎀', '🏆', '🎯', '🎨', '🎭', '🎪', '🎡', '🎢', '🚀', '⚽', '🏀', '🎵', '🎶', '💫']
};

const BACKGROUND_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
  '#BB8FCE', '#85C1E9', '#F8C471', '#82E0AA', '#F1948A', '#AED6F1', '#A9DFBF', '#F9E79F',
  // Add theme colors
  colors.primary, // '#F57C00' - Primary Orange
  colors.primaryLight, // '#FFB74D' - Light Orange
  colors.primaryDark, // '#E65100' - Dark Orange
  colors.secondary, // '#2196F3' - Blue
  colors.secondaryLight, // '#64B5F6' - Light Blue
  colors.secondaryDark, // '#1565C0' - Dark Blue
  colors.accent, // '#4CAF50' - Green
  colors.accentLight, // '#81C784' - Light Green
  colors.accentDark, // '#388E3C' - Dark Green
  colors.success, // '#4CAF50' - Success Green
  colors.successLight, // '#81C784' - Light Success
  colors.error, // '#F44336' - Error Red
  colors.errorLight, // '#E57373' - Light Error
  colors.warning, // '#FF9800' - Warning Orange
  colors.warningLight, // '#FFB74D' - Light Warning
  colors.highlight, // '#FF5722' - Bright red-orange
  colors.avatarBg, // '#4CAF50' - Avatar background
];

export default function EmojiAvatarScreen({ navigation, route }: EmojiAvatarScreenProps) {
  // Extract params immediately to avoid re-accessing route.params
  const { onSelect, currentEmoji = '😊', currentBackgroundColor = '#FF6B6B' } = route.params;
  
  // Store callback in ref immediately to avoid serialization issues
  // Note: The warning about non-serializable values is benign since we're using the ref
  const onSelectRef = useRef(onSelect);
  
  // isDirty state tracking
  const [isDirty, setIsDirty] = useState(false);
  const navigationActionRef = useRef<any>(null);
  const isConfirmingRef = useRef(false);

  // Find which category contains the current emoji
  const findEmojiCategory = (emoji: string): string => {
    for (const [category, emojis] of Object.entries(EMOJI_CATEGORIES)) {
      if (emojis.includes(emoji)) {
        return category;
      }
    }
    return 'Happy'; // Default fallback
  };

  // Ensure current background color is available in the colors array
  const getAvailableColors = (): string[] => {
    if (BACKGROUND_COLORS.includes(currentBackgroundColor)) {
      return BACKGROUND_COLORS;
    }
    return [currentBackgroundColor, ...BACKGROUND_COLORS];
  };

  const [selectedEmoji, setSelectedEmoji] = useState(currentEmoji);
  const [selectedBgColor, setSelectedBgColor] = useState(currentBackgroundColor);
  const [selectedCategory, setSelectedCategory] = useState(findEmojiCategory(currentEmoji));
  const [searchQuery, setSearchQuery] = useState('');
  const [availableColors] = useState(getAvailableColors());

  // Confirmation dialog
  const { dialogState, showDialog, hideDialog } = useConfirmationDialog();

  // Check if selection has changed
  useEffect(() => {
    const hasChanges = 
      selectedEmoji !== currentEmoji || 
      selectedBgColor !== currentBackgroundColor;
    
    setIsDirty(hasChanges);
  }, [selectedEmoji, selectedBgColor, currentEmoji, currentBackgroundColor]);

  // Navigation protection - warn if attempting to navigate with unsaved changes
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
      // Don't show warning if we're confirming the selection
      if (!isDirty || isConfirmingRef.current) {
        return;
      }

      e.preventDefault();
      navigationActionRef.current = e.data.action;

      showDialog(
        'Unsaved Changes',
        'You have unsaved changes. Are you sure you want to discard them?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: hideDialog,
          },
          {
            text: 'Discard',
            onPress: () => {
              setIsDirty(false);
              hideDialog();
              if (navigationActionRef.current) {
                navigation.dispatch(navigationActionRef.current);
              }
            },
          },
        ]
      );
    });

    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDirty, navigation]);

  const handleEmojiSelect = (emoji: string) => {
    setSelectedEmoji(emoji);
  };

  const handleBackgroundColorSelect = (color: string) => {
    setSelectedBgColor(color);
  };

  const handleConfirm = () => {
    isConfirmingRef.current = true; // Mark that we're confirming (not discarding)
    setIsDirty(false); // Reset isDirty before confirming selection
    onSelectRef.current(selectedEmoji, selectedBgColor);
    navigation.goBack();
  };

  const getFilteredEmojis = () => {
    const categoryEmojis = EMOJI_CATEGORIES[selectedCategory as keyof typeof EMOJI_CATEGORIES] || [];
    if (!searchQuery.trim()) {
      return categoryEmojis;
    }
    return categoryEmojis.filter(emoji => emoji.includes(searchQuery.trim()));
  };

  const renderEmojiPreview = () => (
    <View style={styles.previewSection}>
      <View style={[styles.previewContainer, { backgroundColor: selectedBgColor }]}>
        <Text style={styles.previewEmoji}>{selectedEmoji}</Text>
      </View>
      <Text style={styles.previewLabel}>Your Avatar</Text>
    </View>
  );

  const renderBackgroundColors = () => (
    <View style={styles.colorSection}>
      <Text style={styles.sectionTitle}>Choose background</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorScrollView}>
        {availableColors.map((color, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.colorOption,
              { backgroundColor: color },
              selectedBgColor === color && styles.selectedColorOption,
            ]}
            onPress={() => handleBackgroundColorSelect(color)}
            accessibilityRole="button"
            accessibilityLabel={`Background color ${index + 1}`}
            accessibilityHint="Tap to set this as your avatar background color"
            accessibilityState={{ selected: selectedBgColor === color }}
          />
        ))}
      </ScrollView>
    </View>
  );

  const renderCategoryChips = () => (
    <View style={styles.categorySection}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {Object.keys(EMOJI_CATEGORIES).map((category) => (
          <Chip
            key={category}
            mode={selectedCategory === category ? 'flat' : 'outlined'}
            selected={selectedCategory === category}
            onPress={() => setSelectedCategory(category)}
            style={[
              styles.categoryChip,
              selectedCategory === category && styles.selectedCategoryChip,
            ]}
            textStyle={{
              color: selectedCategory === category ? colors.textOnPrimary : colors.textPrimary,
            }}
            accessibilityRole="button"
            accessibilityLabel={`${category} category`}
            accessibilityHint="Tap to filter emojis by this category"
            accessibilityState={{ selected: selectedCategory === category }}
          >
            {category}
          </Chip>
        ))}
      </ScrollView>
    </View>
  );

  const renderEmojiGrid = () => (
    <View style={styles.emojiSection}>
      <Text style={styles.sectionTitle}>Choose emoji or sticker</Text>
      
      <TextInput
        style={styles.searchInput}
        placeholder="Search"
        placeholderTextColor={colors.textSecondary}
        value={searchQuery}
        onChangeText={setSearchQuery}
        accessibilityRole="search"
        accessibilityLabel="Search emojis"
        accessibilityHint="Type to search for specific emojis"
      />
      
      <ScrollView style={styles.emojiScrollView} bounces={false}>
        <View style={styles.emojiGrid}>
          {getFilteredEmojis().map((emoji, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.emojiOption,
                selectedEmoji === emoji && styles.selectedEmojiOption,
              ]}
              onPress={() => handleEmojiSelect(emoji)}
              accessibilityRole="button"
              accessibilityLabel={`Emoji ${emoji}`}
              accessibilityHint="Tap to select this emoji for your avatar"
              accessibilityState={{ selected: selectedEmoji === emoji }}
            >
              <Text style={styles.emojiText}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <ScrollView style={styles.scrollContainer} bounces={false} showsVerticalScrollIndicator={false}>
        <View style={styles.scrollContent}>
          {/* Preview */}
          <View style={styles.previewSection}>
            {renderEmojiPreview()}
          </View>

          {/* Background Colors */}
          {renderBackgroundColors()}

          {/* Category Filter */}
          {renderCategoryChips()}

          {/* Emoji Grid */}
          {renderEmojiGrid()}
        </View>
      </ScrollView>

      {/* Action Buttons - Fixed at bottom */}
      <View style={styles.buttonContainer}>
        <Button
          mode="outlined"
          onPress={() => navigation.goBack()}
          style={[styles.button, styles.cancelButton]}
          textColor={colors.textPrimary}
          accessibilityRole="button"
          accessibilityLabel="Cancel"
          accessibilityHint="Discard changes and go back"
        >
          Cancel
        </Button>
        <Button
          mode="contained"
          onPress={handleConfirm}
          style={[styles.button, styles.confirmButton]}
          buttonColor={colors.primary}
          textColor="#ffffff"
          labelStyle={styles.confirmButtonText}
          accessibilityRole="button"
          accessibilityLabel="Set Avatar"
          accessibilityHint="Apply selected emoji and background color to your avatar"
        >
          Set Avatar
        </Button>
      </View>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        visible={dialogState.visible}
        title={dialogState.title}
        message={dialogState.message}
        buttons={dialogState.buttons}
        onDismiss={hideDialog}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDefault,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  previewSection: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  previewContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    overflow: 'hidden',
    padding: 0,
  },
  previewEmoji: {
    fontSize: 34,
    textAlign: 'center',
    textAlignVertical: 'center',
    ...(Platform.OS === 'ios' ? {
      lineHeight: 34,
      position: 'relative',
      top: -1,
    } : {
      lineHeight: 34,
      includeFontPadding: false,
    }),
  },
  previewLabel: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  colorSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: colors.textPrimary,
  },
  colorScrollView: {
    flexDirection: 'row',
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColorOption: {
    borderColor: colors.textPrimary,
    borderWidth: 3,
  },
  categorySection: {
    marginBottom: 20,
  },
  categoryChip: {
    marginRight: 8,
    backgroundColor: colors.backgroundDefault,
  },
  selectedCategoryChip: {
    backgroundColor: colors.buttonPrimary,
  },
  emojiSection: {
    flex: 1,
    marginBottom: 20,
    minHeight: 200,
  },
  searchInput: {
    backgroundColor: colors.backgroundPaper,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 16,
    color: colors.textPrimary,
    fontSize: 16,
  },
  emojiScrollView: {
    flex: 1,
    minHeight: 200,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    paddingHorizontal: 4,
  },
  emojiOption: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  selectedEmojiOption: {
    backgroundColor: colors.primaryLight,
  },
  emojiText: {
    fontSize: 24,
    textAlign: 'center',
    textAlignVertical: 'center',
    ...(Platform.OS === 'ios' ? {
      lineHeight: 24,
      position: 'relative',
      top: -0.5,
    } : {
      lineHeight: 28,
      includeFontPadding: false,
    }),
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.primaryLight,
    backgroundColor: colors.backgroundDefault,
  },
  button: {
    minWidth: 140,
    borderRadius: 25,
  },
  cancelButton: {
    borderColor: colors.textSecondary,
  },
  confirmButton: {
    elevation: 3,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  confirmButtonText: {
    color: '#ffffff',
  },
});
