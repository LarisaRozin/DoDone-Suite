/*
 * Copyright (c) 2025 Larisa Rozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
import React from 'react';
import { View, Image, TouchableOpacity, StyleSheet, Text, Platform } from 'react-native';
import { colors } from '../defaultTheme';
import { useAvatarUrl } from '../utils/avatarUtils';
import { parseEmojiAvatarUri } from '../utils/emojiAvatarUtils';

interface UserAvatarProps {
  size?: number;
  imageUri?: string;
  emojiAvatar?: { emoji: string; backgroundColor: string; };  // Direct emoji data prop
  firstName?: string;
  lastName?: string;
  userName?: string;
  style?: any;
  labelStyle?: any;
  onPress?: () => void;
  disabled?: boolean;
  fontSize?: number; // Custom font size for initials
}

export default function UserAvatar({
  size = 40,
  imageUri,
  emojiAvatar,
  firstName,
  lastName,
  userName,
  style,
  labelStyle,
  onPress,
  disabled = false,
  fontSize,
}: UserAvatarProps) {
  // Convert avatar URI to full URL if needed, but first check if it's an emoji avatar
  const fullAvatarUrl = useAvatarUrl(imageUri);
  const parsedEmojiAvatar = parseEmojiAvatarUri(imageUri);
  
  const getInitials = () => {
    const firstInitial = firstName?.charAt(0)?.toUpperCase() || '';
    const lastInitial = lastName?.charAt(0)?.toUpperCase() || '';
    return firstInitial + lastInitial || userName?.charAt(0)?.toUpperCase() || 'U';
  };

  const renderAvatarContent = () => {
    // Priority order: Direct emojiAvatar prop > parsed emoji from imageUri > regular imageUri > initials
    const effectiveEmojiAvatar = emojiAvatar || parsedEmojiAvatar;
    
    if (effectiveEmojiAvatar) {
      const bgColor = effectiveEmojiAvatar.backgroundColor;
        
      return (
        <View style={[
          localStyles.emojiAvatarContainer,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
          style,
          {
            backgroundColor: bgColor, // This should come last to prevent overrides
          },
        ]}>
          <Text style={[
            localStyles.emojiText,
            {
              fontSize: size * 0.5, // Emoji size relative to avatar size
              // iOS-specific fixes for emoji text centering
              ...(Platform.OS === 'ios' ? {
                // Remove lineHeight entirely to let the emoji use its natural height
                // This prevents the emoji from being pushed up
              } : {
                textAlignVertical: 'center',
                lineHeight: size * 0.6,
                includeFontPadding: false,
              }),
            }
          ]}>
            {effectiveEmojiAvatar.emoji}
          </Text>
        </View>
      );
    }
    
    if (fullAvatarUrl && !parsedEmojiAvatar) {
      return (
        <View style={[
          localStyles.imageAvatarContainer,
          { 
            width: size, 
            height: size, 
            borderRadius: size / 2,
          }, 
          style
        ]}>
          <Image
            source={{ uri: fullAvatarUrl }}
            style={[
              localStyles.avatarImage,
              { 
                width: size - 4, // Account for border width
                height: size - 4,
                borderRadius: (size - 4) / 2,
              }
            ]}
            resizeMode="cover"
          />
        </View>
      );
    }

    // Fallback to initials - use custom implementation for better iOS centering
    const calculatedFontSize = fontSize || (size * 0.4);
    
    return (
      <View style={[
        localStyles.initialsAvatarContainer,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        style
      ]}>
        <Text style={[
          localStyles.initialsText,
          {
            fontSize: calculatedFontSize,
            // iOS-specific fixes for text centering
            ...(Platform.OS === 'ios' ? {
              lineHeight: calculatedFontSize * 1.0, // Precise line height
              marginTop: size >= 80 ? 5 : Math.max(-1, -(size * 0.02)), // Gentler adjustment for large avatars
            } : {
              includeFontPadding: false, // Android-specific: removes extra padding
            }),
          },
          labelStyle
        ]}>
          {getInitials()}
        </Text>
      </View>
    );
  };

  if (onPress && !disabled) {
    return (
      <TouchableOpacity 
        onPress={onPress} 
        disabled={disabled}
        activeOpacity={0.7}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`User avatar for ${firstName || userName || 'user'}${emojiAvatar || parsedEmojiAvatar ? `, emoji: ${(emojiAvatar || parsedEmojiAvatar)?.emoji}` : ''}`}
        accessibilityHint="Tap to change avatar"
      >
        {renderAvatarContent()}
      </TouchableOpacity>
    );
  }

  return renderAvatarContent();
}

const localStyles = StyleSheet.create({
  emojiAvatarContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.avatarOutline,
  },
  emojiText: {
    textAlign: 'center',
  },
  imageAvatarContainer: {
    borderWidth: 2,
    borderColor: colors.avatarOutline,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    backgroundColor: '#f0f0f0',
  },
  initialsAvatarContainer: {
    backgroundColor: colors.avatarBg,
    borderWidth: 2,
    borderColor: colors.avatarOutline,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    color: '#ffffff',
    fontWeight: 'bold',
    textAlign: 'center',
    textAlignVertical: 'center',
  },
});
