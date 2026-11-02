/*
 * Copyright (c) 2025 Larisa Rozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
import { useAuth } from '@larisarozin/dodone-shared';
import { createApiClient } from './apiClientWrapper';
import config from '../config/config';

interface EmojiAvatarData {
  emoji: string;
  backgroundColor: string;
}

/**
 * Converts an avatar URI to a full URL if needed
 * @param avatarUri - The avatar URI from the user object (could be filename, full URL, or emoji data)
 * @param token - Auth token for API client
 * @returns Full avatar URL or undefined if no avatar
 */
export const getAvatarUrl = (avatarUri?: string, token?: string): string | undefined => {
  if (!avatarUri) {
    return undefined;
  }

  // If it's emoji avatar data (starts with "emoji:"), return undefined 
  // since emoji avatars don't need URLs
  if (avatarUri.startsWith('emoji:')) {
    return undefined;
  }

  // If it's already a full URL, return as is
  if (avatarUri.startsWith('http://') || avatarUri.startsWith('https://')) {
    return avatarUri;
  }

  // If it's just a filename, construct the full API URL
  if (token) {
    const apiClient = createApiClient(config.API_BASE_URL, token);
    return apiClient.avatar.getAvatarUrl(avatarUri);
  }

  return undefined;
};

/**
 * Parses emoji avatar data from avatarUri string
 * @param avatarUri - The avatar URI that might contain emoji data
 * @returns Emoji avatar data or undefined
 */
export const parseEmojiAvatar = (avatarUri?: string): EmojiAvatarData | undefined => {
  if (!avatarUri || !avatarUri.startsWith('emoji:')) {
    return undefined;
  }

  try {
    const jsonData = avatarUri.substring(6); // Remove "emoji:" prefix
    return JSON.parse(jsonData) as EmojiAvatarData;
  } catch (error) {
    console.warn('Failed to parse emoji avatar data:', error);
    return undefined;
  }
};

/**
 * Encodes emoji avatar data to avatarUri string
 * @param emojiData - The emoji avatar data
 * @returns Encoded string for avatarUri field
 */
export const encodeEmojiAvatar = (emojiData: EmojiAvatarData): string => {
  return `emoji:${JSON.stringify(emojiData)}`;
};

/**
 * Hook to get avatar URL with current auth token
 */
export const useAvatarUrl = (avatarUri?: string): string | undefined => {
  const { token } = useAuth();
  return getAvatarUrl(avatarUri, token || undefined);
};
