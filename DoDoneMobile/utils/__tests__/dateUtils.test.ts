/**
 * Test script to validate date UTC to local conversion
 * Run this in a React Native environment or Node.js to test the date utilities
 */

import { convertUTCToLocal, convertLocalToUTC, formatDateForDisplay, normalizeDateToMidnight } from '../dateUtils';

// Test cases for date conversion
const runDateConversionTests = () => {
  console.log('=== Date Conversion Tests ===');
  
  // Test 1: UTC string to local Date
  const utcString = '2023-12-25T10:30:00.000Z';
  const localDate = convertUTCToLocal(utcString);
  console.log('UTC String:', utcString);
  console.log('Local Date:', localDate);
  console.log('Local Date String:', localDate?.toString());
  
  // Test 2: Local Date back to UTC string
  if (localDate) {
    const backToUTC = convertLocalToUTC(localDate);
    console.log('Back to UTC:', backToUTC);
  }
  
  // Test 3: Format for display
  const displayDate = formatDateForDisplay(utcString);
  console.log('Formatted Display:', displayDate);
  
  // Test 4: Normalize to midnight
  const midnightDate = normalizeDateToMidnight(utcString);
  console.log('Normalized to midnight:', midnightDate);
  
  // Test 5: Handle null/undefined values
  console.log('Null UTC conversion:', convertUTCToLocal(null));
  console.log('Undefined UTC conversion:', convertUTCToLocal(undefined));
  console.log('Empty string UTC conversion:', convertUTCToLocal(''));
  
  // Test 6: Invalid date string
  console.log('Invalid date conversion:', convertUTCToLocal('invalid-date'));
  
  // Test 7: Already local Date object
  const nowDate = new Date();
  console.log('Current date input:', nowDate);
  console.log('Current date converted:', convertUTCToLocal(nowDate));
};

// Export for testing
export { runDateConversionTests };

// Uncomment to run tests if this file is executed directly
// runDateConversionTests();
