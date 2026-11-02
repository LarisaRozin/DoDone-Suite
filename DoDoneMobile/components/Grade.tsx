/*
 * Copyright (c) 2025 Larisa Rozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 *
 * Grade.tsx - Timer-style grade selection component
 * Shows only 3 grades at once: previous (left), selected (center), next (right)
 * @format
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Dimensions,
  StyleSheet,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Animated,
  TouchableOpacity
} from 'react-native';
import { colors, fonts } from '../defaultTheme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export interface GradeProps {
  value?: string;
  label?: string;
  onGradeChange?: (grade: string) => void;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const GRADES = [
  { value: '', label: 'Ungraded', color: colors.textSecondary },
  { value: 'A+', label: 'A+', color: colors.success },
  { value: 'A', label: 'A', color: colors.success },
  { value: 'A-', label: 'A-', color: colors.success },
  { value: 'B+', label: 'B+', color: colors.accent },
  { value: 'B', label: 'B', color: colors.accent },
  { value: 'B-', label: 'B-', color: colors.accent },
  { value: 'C+', label: 'C+', color: colors.warning },
  { value: 'C', label: 'C', color: colors.warning },
  { value: 'C-', label: 'C-', color: colors.warning },
  { value: 'D+', label: 'D+', color: colors.error },
  { value: 'D', label: 'D', color: colors.error },
  { value: 'F', label: 'F', color: colors.error }
];

export const Grade: React.FC<GradeProps> = ({
  value = '',
  label = 'Grade',
  onGradeChange,
  disabled = false,
  size = 'medium'
}) => {
  const [_selectedGrade, setSelectedGrade] = useState(value);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const screenWidth = Dimensions.get('window').width;
  const isScrolling = useRef(false);
  
  // Animation for chevron pulsing effect
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  // Start pulsing animation on mount
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.4,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    
    // Stop pulsing after 15 seconds (giving users more time to scroll and notice)
    const timer = setTimeout(() => {
      pulse.stop();
      pulseAnim.setValue(1);
    }, 10000);
    
    return () => {
      clearTimeout(timer);
      pulse.stop();
    };
  }, [pulseAnim]);
  
  // Calculate dimensions based on size
  const getSizeDimensions = () => {
    switch (size) {
      case 'small':
        return { 
          itemWidth: screenWidth * 0.16,  // Reduced from 0.2 to make more compact
          centerHeight: 50, 
          centerWidth: 60,  // Reduced from 70
          sideHeight: 35,   // Reduced from 40
          sideWidth: 45,    // Reduced from 55
          centerFontSize: 18, 
          sideFontSize: 16, // Reduced from 20
          containerHeight: 60,
          labelWidth: 75    // Increased to fit label on one line
        };
      case 'large':
        return { 
          itemWidth: screenWidth * 0.22,  // Reduced from 0.25
          centerHeight: 80, 
          centerWidth: 100, // Reduced from 110
          sideHeight: 55,   // Reduced from 60
          sideWidth: 75,    // Reduced from 85
          centerFontSize: 28, 
          sideFontSize: 18, // Reduced from 20
          containerHeight: 95,
          labelWidth: 85    // Increased to fit label on one line
        };
      default:
        return { 
          itemWidth: screenWidth * 0.18,  // Reduced from 0.22
          centerHeight: 65, 
          centerWidth: 80,  // Reduced from 90
          sideHeight: 45,   // Reduced from 50
          sideWidth: 60,    // Reduced from 70
          centerFontSize: 22, 
          sideFontSize: 14, // Reduced from 16
          containerHeight: 75,
          labelWidth: 80    // Increased to fit label on one line
        };
    }
  };

  const dimensions = getSizeDimensions();

  // Find initial index and scroll to it
  useEffect(() => {
    const initialIndex = GRADES.findIndex(grade => grade.value === value);
    const newIndex = initialIndex >= 0 ? initialIndex : 0;
    setCurrentIndex(newIndex);
    setSelectedGrade(value);
    
    // Scroll to the correct position after a short delay
    setTimeout(() => {
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({
          x: newIndex * dimensions.itemWidth,
          animated: false
        });
      }
    }, 100);
  }, [value, dimensions.itemWidth]);

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (disabled) return;
    
    // Prevent recursive calls
    if (isScrolling.current) return;
    
    const scrollX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.max(0, Math.min(Math.round(scrollX / dimensions.itemWidth), GRADES.length - 1));
    
    // Check if we need to snap to a different position
    const targetPosition = newIndex * dimensions.itemWidth;
    const threshold = 1; // 1 pixel threshold for floating point comparison
    
    if (Math.abs(scrollX - targetPosition) > threshold && scrollViewRef.current) {
      isScrolling.current = true;
      scrollViewRef.current.scrollTo({
        x: targetPosition,
        animated: true
      });
      // Reset flag after animation completes
      setTimeout(() => {
        isScrolling.current = false;
      }, 300);
    }
    
    // Only update state if the index actually changed
    if (newIndex !== currentIndex) {
      setCurrentIndex(newIndex);
      const newGrade = GRADES[newIndex].value;
      setSelectedGrade(newGrade);
      onGradeChange?.(newGrade);
    }
  };
  
  // Determine if chevrons should be shown
  const showLeftChevron = currentIndex > 0;
  const showRightChevron = currentIndex < GRADES.length - 1;

  // Handle chevron click
  const handleChevronClick = (direction: 'left' | 'right') => {
    if (disabled || isScrolling.current) return;
    
    const newIndex = direction === 'left' 
      ? Math.max(0, currentIndex - 1)
      : Math.min(GRADES.length - 1, currentIndex + 1);
    
    if (newIndex === currentIndex) return;
    
    isScrolling.current = true;
    const targetPosition = newIndex * dimensions.itemWidth;
    
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        x: targetPosition,
        animated: true
      });
    }
    
    setCurrentIndex(newIndex);
    const newGrade = GRADES[newIndex].value;
    setSelectedGrade(newGrade);
    onGradeChange?.(newGrade);
    
    setTimeout(() => {
      isScrolling.current = false;
    }, 300);
  };

  return (
    <View style={styles.container}>
      {(() => {
        const pickerStyle = {
          height: dimensions.containerHeight,
          borderColor: disabled ? colors.border : colors.primary,
          opacity: disabled ? 0.6 : 1,
        };
        
        // Calculate available width for ScrollView (screen width minus label space and margins)
        const labelWidth = dimensions.labelWidth + 10; // label width + paddingRight
        const availableWidth = screenWidth - labelWidth - 32; // subtract some margin for safety
        
        return (
          <View style={[styles.pickerContainer, pickerStyle]}>
            <View style={[styles.labelContainer, { height: dimensions.centerHeight - 10 }]}>
              <Text 
                style={[styles.label, { 
                  fontSize: dimensions.sideFontSize,
                  width: dimensions.labelWidth + 10,
                  marginTop: -10
                }]}
              >
                {label ? label : 'Grade'}
              </Text>
            </View>
            <View style={styles.scrollViewContainer}>
              {/* Left chevron indicator */}
              {showLeftChevron && !disabled && (
                <Animated.View style={[
                  styles.chevronLeft,
                  { transform: [{ scale: pulseAnim }] }
                ]}>
                  <TouchableOpacity
                    onPress={() => handleChevronClick('left')}
                    activeOpacity={0.7}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Icon name="chevron-left" size={20} color={colors.primary} />
                  </TouchableOpacity>
                </Animated.View>
              )}
              
              <ScrollView
                // @ts-ignore - ref prop type issue in newer TypeScript versions
                ref={scrollViewRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                decelerationRate="fast"
                onMomentumScrollEnd={handleScrollEnd}
                onScrollEndDrag={handleScrollEnd}
                scrollEnabled={!disabled}
                contentContainerStyle={{
                  paddingHorizontal: Math.max(0, availableWidth / 2 - dimensions.itemWidth / 2) // Use available width
                }}
              >
              {GRADES.map((grade, index) => {
                const isSelected = index === currentIndex;
                const isPrev = index === currentIndex - 1;
                const isNext = index === currentIndex + 1;
                const isVisible = isSelected || isPrev || isNext;
                
                const containerStyle = isSelected ? {
                  height: dimensions.centerHeight,
                  width: dimensions.centerWidth,
                  backgroundColor: disabled ? colors.buttonDisabled : grade.color,
                  borderColor: grade.color,
                  borderWidth: 3,
                  borderRadius: 12,
                  elevation: 4,
                  shadowColor: colors.shadow,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                } : {
                  height: dimensions.sideHeight,
                  width: dimensions.sideWidth,
                  backgroundColor: 'transparent',
                  borderRadius: 8,
                };
                
                const textStyle = isSelected ? {
                  fontSize: dimensions.centerFontSize,
                  color: disabled ? colors.textPrimary : colors.textOnPrimary,
                  fontFamily: grade.value === '' ? fonts.roboto : fonts.fredoka,
                  opacity: disabled ? 0.8 : 1,
                } : {
                  fontSize: dimensions.sideFontSize,
                  color: disabled ? colors.textSecondary : grade.color,
                  fontFamily: grade.value === '' ? fonts.roboto : fonts.fredoka,
                  opacity: disabled ? 0.3 : (isVisible ? 0.8 : 0),
                };
                
                return (
                  <View
                    key={index}
                    style={[
                      styles.gradeItem,
                      { 
                        width: dimensions.itemWidth, 
                        height: dimensions.centerHeight
                      }
                    ]}
                  >
                    {isVisible ? (
                      <View style={[
                        isSelected ? styles.centerGradeContainer : styles.sideGradeContainer,
                        containerStyle
                      ]}>
                        <Text style={[styles.gradeText, textStyle]}>
                          {grade.value === '' ? '_' : grade.label}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </ScrollView>
            
            {/* Right chevron indicator */}
            {showRightChevron && !disabled && (
              <Animated.View style={[
                styles.chevronRight,
                { transform: [{ scale: pulseAnim }] }
              ]}>
                <TouchableOpacity
                  onPress={() => handleChevronClick('right')}
                  activeOpacity={0.7}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Icon name="chevron-right" size={20} color={colors.primary} />
                </TouchableOpacity>
              </Animated.View>
            )}
            </View>
          </View>
        );
      })()}
      
      {/* Hint text */}
      <Text style={styles.hintText}>← Swipe to change →</Text>
      

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 0,
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'flex-start',
  },
  labelContainer: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  scrollViewContainer: {
    flex: 1,
    position: 'relative',
  },
  scrollContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scrollItem: {
    // Invisible items for scrolling
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradeItem: {
    justifyContent: 'center',
    alignItems: 'center',
    // Centering handled inline for specific dimensions
  },
  centerGradeContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    // borderRadius: 12,
    // borderWidth: 3,
    // elevation: 4,
    // shadowColor: colors.shadow,
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.2,
    // shadowRadius: 4,
  },
  sideGradeContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    // borderRadius: 8,
  },
  gradeText: {
    textAlign: 'center',
    fontWeight: 'bold',
    lineHeight: 20,
  },
  label: {
    color: colors.textSecondary,
    fontWeight: 'bold',
    textAlign: 'right',
    paddingRight: 8,
    width: 75,  // Adjusted to fit label on one line
    fontFamily: fonts.roboto,
    includeFontPadding: false,
  },
  chevronLeft: {
    position: 'absolute',
    left: 5,  // Moved inward from 0
    top: '50%',
    marginTop: -18,  // Adjusted for smaller icon
    zIndex: 10,
    // backgroundColor: colors.backgroundDefault,
    borderRadius: 14,
    padding: 3,
    elevation: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  chevronRight: {
    position: 'absolute',
    right: 5,  // Moved inward from 0
    top: '50%',
    marginTop: -18,  // Adjusted for smaller icon
    zIndex: 10,
    // backgroundColor: colors.backgroundDefault,
    borderRadius: 14,
    padding: 3,
    elevation: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  hintText: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
    paddingLeft: 96,
    fontStyle: 'italic',
    fontFamily: fonts.roboto,
  },
});

export default Grade;
