/*
 * Copyright (c) 2025 Larisa Rozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
/**
 * Utility functions for handling date conversions between UTC and local timezone
 */

/**
 * Converts a UTC date string or Date object to a local Date object
 * @param utcDate - UTC date string (ISO format) or Date object
 * @returns Date object in local timezone or null if invalid input
 */
export const convertUTCToLocal = (utcDate: string | Date | null | undefined): Date | null => {
  if (!utcDate) {
    return null;
  }
  
  try {
    // If it's already a Date object, return it as is (assuming it's already in local time)
    if (utcDate instanceof Date) {
      return utcDate;
    }
    
    // If it's a string, ensure it's treated as UTC
    let dateString = utcDate;
    
    // If the string doesn't have a timezone indicator, assume it's UTC and add 'Z'
    if (typeof dateString === 'string' && 
        !dateString.endsWith('Z') && 
        !dateString.includes('+') && 
        !dateString.includes('-', dateString.indexOf('T'))) {
      dateString = dateString + 'Z';
    }
    
    const date = new Date(dateString);
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return null;
    }
    
    return date;
  } catch (error) {
    console.error('Error converting UTC date to local:', error);
    return null;
  }
};

/**
 * Converts a local Date object to UTC string (ISO format)
 * @param localDate - Local Date object
 * @returns UTC date string in ISO format or null if invalid input
 */
export const convertLocalToUTC = (localDate: Date | null | undefined): string | null => {
  if (!localDate || !(localDate instanceof Date)) {
    return null;
  }
  
  try {
    // Check if the date is valid
    if (isNaN(localDate.getTime())) {
      return null;
    }
    
    return localDate.toISOString();
  } catch (error) {
    console.error('Error converting local date to UTC:', error);
    return null;
  }
};

/**
 * Formats a date for display in the user's locale
 * @param date - Date object or UTC string
 * @param options - Intl.DateTimeFormatOptions for formatting
 * @returns Formatted date string
 */
export const formatDateForDisplay = (
  date: string | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string => {
  const localDate = convertUTCToLocal(date);
  
  if (!localDate) {
    return '';
  }
  
  return localDate.toLocaleDateString(undefined, options);
};

/**
 * Formats a date and time for display in the user's locale
 * @param date - Date object or UTC string
 * @param options - Intl.DateTimeFormatOptions for formatting
 * @returns Formatted date and time string
 */
export const formatDateTimeForDisplay = (
  date: string | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string => {
  const localDate = convertUTCToLocal(date);
  
  if (!localDate) {
    return '';
  }
  
  return localDate.toLocaleString(undefined, options);
};

/**
 * Normalizes a date to midnight (00:00:00) in local timezone
 * @param date - Date object or UTC string
 * @returns Date object set to midnight local time or null if invalid input
 */
export const normalizeDateToMidnight = (date: string | Date | null | undefined): Date | null => {
  const localDate = convertUTCToLocal(date);
  
  if (!localDate) {
    return null;
  }
  
  const normalized = new Date(localDate);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};
