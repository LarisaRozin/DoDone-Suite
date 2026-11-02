/*
 * Copyright (c) 2025 Larisa Rozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
import { Rating } from '@kolking/react-native-rating';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../defaultTheme';
import { useState } from 'react';

interface RatingProps {
  initialRating?: number;
  label?: string;
  onRatingChange?: (rating: number) => void;
}

export const RatingComponent = (props: RatingProps) => {
  const { initialRating, label, onRatingChange } = props;
  const [rating, setRating] = useState(initialRating || 0);

  const handleRatingChange = (newRating: number) => {
    setRating(newRating);
    if (onRatingChange) {
      onRatingChange(newRating);
    }
  };

  return (
    <View style={localStyles.container}>
      <Text style={localStyles.label}>{label || 'Rate this item:'}</Text>
      <View 
        style={localStyles.ratingContainer}
        accessible={true}
        accessibilityRole="adjustable"
        accessibilityLabel={`Rating selector, current rating: ${rating} out of 10 hearts`}
        accessibilityHint="Tap on hearts to set rating"
        accessibilityValue={{ text: `${rating} out of 10` }}
      >
     <Rating 
       variant='hearts'
       fillColor={colors.primary}
       baseColor={colors.secondary}
       size={24} 
       maxRating={10}
       rating={rating} 
       onChange={handleRatingChange}
     />
      </View>
    </View>
  );
}


const localStyles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  label: {
    fontSize: 15,
    color: colors.textSecondary,
    paddingLeft: 12,
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
