/*
 * Copyright (c) 2025 Larisa Rozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, TextInput, Platform } from 'react-native';
import { Chip } from 'react-native-paper';
import { Text, Button } from './StyledText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../defaultTheme';

interface EmojiAvatarData {
  emoji: string;
  backgroundColor: string;
}

interface EmojiAvatarSelectionProps {
  navigation: any;
  onSelect: (emojiData: EmojiAvatarData) => void;
  currentSelection?: EmojiAvatarData;
}

// Predefined background colors similar to Telegram
const BACKGROUND_COLORS = [
  '#FF5F5F', // Red
  '#FF8C42', // Orange  
  '#FFD700', // Gold
  '#32CD32', // Green
  '#00CED1', // Turquoise
  '#4169E1', // Royal Blue
  '#9370DB', // Medium Purple
  '#FF69B4', // Hot Pink
  '#20B2AA', // Light Sea Green
  '#FF4500', // Orange Red
  '#1E90FF', // Dodger Blue
  '#DC143C', // Crimson
];

// Kid-friendly emoji categories
const EMOJI_CATEGORIES = {
  'Happy': ['😊', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😇', '🙂', '😉', '😌', '🥰', '😍', '🤩', '😋', '😎', '🤓'],
  'Animals': ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐸', '🐙', '🦄', '🐧', '🐦', '🦆', '🦉'],
  'Nature': ['🌞', '🌙', '⭐', '🌟', '💫', '⚡', '🌈', '🌸', '🌺', '🌻', '🌷', '🌹', '🍀', '🌿', '🌳', '🌲', '🌴', '🌵'],
  'Food': ['🍎', '🍌', '🍓', '🍇', '🍊', '🥝', '🍑', '🍒', '🥭', '🍍', '🥥', '🧁', '🍰', '🎂', '🍭', '🍬', '🍯', '🧊'],
  'Fun': ['🎈', '🎉', '🎊', '🎁', '🎀', '🎯', '⚽', '🏀', '🎮', '🎪', '🎨', '🎭', '🎪', '🎡', '🎢', '🎠', '🎸', '🎵'],
};

export default function EmojiAvatarSelection({
  navigation,
  onSelect,
  currentSelection,
}: EmojiAvatarSelectionProps) {
  const [selectedEmoji, setSelectedEmoji] = useState<string>(currentSelection?.emoji || '😊');
  const [selectedBgColor, setSelectedBgColor] = useState<string>(currentSelection?.backgroundColor || BACKGROUND_COLORS[0]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Happy');
  const [searchText, setSearchText] = useState<string>('');

  const handleEmojiSelect = (emoji: string) => {
    setSelectedEmoji(emoji);
  };

  const handleBackgroundColorSelect = (color: string) => {
    setSelectedBgColor(color);
  };

  const handleConfirm = () => {
    onSelect({
      emoji: selectedEmoji,
      backgroundColor: selectedBgColor,
    });
    navigation.goBack();
  };

  const getFilteredEmojis = () => {
    const categoryEmojis = EMOJI_CATEGORIES[selectedCategory as keyof typeof EMOJI_CATEGORIES] || [];
    if (!searchText.trim()) {
      return categoryEmojis;
    }
    return categoryEmojis.filter(emoji => emoji.includes(searchText.trim()));
  };

  const renderEmojiPreview = () => (
    <View style={[styles.previewContainer, { backgroundColor: selectedBgColor }]}>
      <Text style={styles.previewEmoji}>{selectedEmoji}</Text>
    </View>
  );

  const renderBackgroundColors = () => (
    <View style={styles.colorSection}>
      <Text style={styles.sectionTitle}>Choose background</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorScrollView}>
        {BACKGROUND_COLORS.map((color, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.colorOption,
              { backgroundColor: color },
              selectedBgColor === color && styles.selectedColorOption,
            ]}
            onPress={() => handleBackgroundColorSelect(color)}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`Select background color`}
            accessibilityHint="Double tap to choose this background color"
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
      
      {/* Search Input */}
      <TextInput
        style={styles.searchInput}
        placeholder="Search"
        value={searchText}
        onChangeText={setSearchText}
        placeholderTextColor={colors.textSecondary}
        accessible={true}
        accessibilityRole="search"
        accessibilityLabel="Search emojis"
        accessibilityHint="Enter text to search for specific emojis"
      />

      <ScrollView style={styles.emojiScrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.emojiGrid}>
          {getFilteredEmojis().map((emoji, index) => (
            <TouchableOpacity
              key={emoji}
              style={[
                styles.emojiOption,
                selectedEmoji === emoji && styles.selectedEmojiOption,
              ]}
              onPress={() => handleEmojiSelect(emoji)}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`Select emoji ${emoji}`}
              accessibilityHint="Double tap to choose this emoji for your avatar"
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
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
      </View>

      {/* Title */}
      <View style={styles.titleContainer}>
        <Text variant="titleLarge" style={styles.title}>Choose Emoji Avatar</Text>
      </View>

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
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Cancel"
          accessibilityHint="Double tap to cancel avatar selection"
        >
          Cancel
        </Button>
        <Button
          mode="contained"
          onPress={handleConfirm}
          style={[styles.button, styles.confirmButton]}
          buttonColor={colors.buttonPrimary}
          textColor={colors.textOnPrimary}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Confirm avatar selection"
          accessibilityHint="Double tap to use this emoji avatar"
        >
          Set Avatar
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDefault,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.backgroundDefault,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  titleContainer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    backgroundColor: colors.backgroundDefault,
  },
  title: {
    textAlign: 'center',
    color: colors.textPrimary,
    fontFamily: 'Fredoka-SemiBold',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
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
  },
  previewEmoji: {
    fontSize: 36,
    textAlign: 'center',
    textAlignVertical: 'center',
    ...(Platform.OS === 'ios' ? {
      lineHeight: 36,
      position: 'relative',
      top: -1,
    } : {
      lineHeight: 40,
      includeFontPadding: false,
    }),
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
    minWidth: 120,
    borderRadius: 8,
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
});
