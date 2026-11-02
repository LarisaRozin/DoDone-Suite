/*
 * Copyright (c) 2025 Larisa Rozin
 * DoDone- Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
export interface EmojiAvatarData {
  emoji: string;
  backgroundColor: string;
}

export const EMOJI_AVATAR_PREFIX = 'emoji:';

export const createEmojiAvatarUri = (emoji: string, backgroundColor: string): string => {
  const data: EmojiAvatarData = { emoji, backgroundColor };
  return EMOJI_AVATAR_PREFIX + JSON.stringify(data);
};

export const parseEmojiAvatarUri = (avatarUri: string | undefined): EmojiAvatarData | null => {
  if (!avatarUri || !avatarUri.startsWith(EMOJI_AVATAR_PREFIX)) {
    return null;
  }
  
  try {
    const jsonStr = avatarUri.substring(EMOJI_AVATAR_PREFIX.length);
    const parsed = JSON.parse(jsonStr);
    
    // Handle both old format (background) and new format (backgroundColor)
    return {
      emoji: parsed.emoji,
      backgroundColor: parsed.backgroundColor || parsed.background || '#FF6B6B'
    };
  } catch (error) {
    console.warn('Failed to parse emoji avatar data:', error);
    return null;
  }
};

export const isEmojiAvatar = (avatarUri: string | undefined): boolean => {
  return !!avatarUri && avatarUri.startsWith(EMOJI_AVATAR_PREFIX);
};

export const defaultBackgroundColors = [
  '#E3F2FD', // Light Blue
  '#E8F5E8', // Light Green  
  '#FFF3E0', // Light Orange
  '#F3E5F5', // Light Purple
  '#FFEBEE', // Light Red
  '#E0F2F1', // Light Teal
  '#FFF8E1', // Light Yellow
  '#EFEBE9', // Light Brown
  '#ECEFF1', // Light Grey
];
