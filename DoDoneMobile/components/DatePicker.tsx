/*
 * Copyright (c) 2025 Larisa Rozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
import DateTimePicker from "@react-native-community/datetimepicker";
import { useState } from "react";
import { View, StyleSheet } from "react-native";
import { TextInput } from "react-native-paper";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { colors } from "../defaultTheme";
import { normalizeDateToMidnight, convertUTCToLocal } from "../utils/dateUtils";

interface DatePickerProps {
  initialDate?: string | Date | null;
  label?: string;
  onDateChange?: (date: string | null) => void;
  disabled?: boolean;
}

// Create the calendar icon component outside of render to avoid re-creation
const CalendarIcon = () => <MaterialCommunityIcons name="calendar" size={20} color={colors.textPrimary} />;

export const DatePickerComponent = ({ initialDate, label, onDateChange, disabled = false }: DatePickerProps) => {
  // Initialize with normalized date if provided
  const initialDateObj = initialDate ? convertUTCToLocal(initialDate) : null;
  const [date, setDate] = useState<Date | null>(
    initialDateObj ? normalizeDateToMidnight(initialDateObj) : null
  );
  const [show, setShow] = useState(false);
  const [textValue, setTextValue] = useState(
    initialDateObj && normalizeDateToMidnight(initialDateObj) ? 
    normalizeDateToMidnight(initialDateObj)!.toLocaleDateString() : ''
  );

  const onChange = (event: any, selectedDate: Date | undefined) => {
    setShow(false);
    if (selectedDate) {
      const normalizedDate = normalizeDateToMidnight(selectedDate);
      if (normalizedDate) {
        setDate(normalizedDate);
        setTextValue(normalizedDate.toLocaleDateString());
        if (onDateChange) {
          // Convert back to ISO string for consistency
          onDateChange(normalizedDate.toISOString());
        }
      }
    }
  };

  const handleTextChange = (text: string) => {
    setTextValue(text);
    if (text === '') {
      setDate(null);
      if (onDateChange) {
        onDateChange(null);
      }
    }
  };

  const showDatepicker = () => {
    setShow(true);
  };

  return (
    <View style={localStyles.container}>
      <View style={localStyles.inputContainer}>
        <TextInput
          label={label}
          value={textValue}
          onChangeText={handleTextChange}
          placeholder="Select a date"
          style={localStyles.inputField}
          contentStyle={localStyles.textInputContentStyle}
          textColor={colors.primary}
          mode="outlined"
          theme={{
            roundness: 12,
          }}
          disabled={disabled}
          accessible={true}
          accessibilityRole="text"
          accessibilityLabel={label ? `${label} date input` : "Date input"}
          accessibilityHint="Enter date manually or tap calendar icon to select"
          accessibilityState={{ disabled }}
          right={
            <TextInput.Icon 
              icon={CalendarIcon}
              onPress={disabled ? undefined : showDatepicker}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Open calendar"
              accessibilityHint="Double tap to open date picker"
            />
          }
        />
        {show && (
          <DateTimePicker
            testID="dateTimePicker"
            value={date || new Date()}
            mode='date'
            is24Hour={true}
            onChange={onChange}
            accessible={true}
            accessibilityLabel="Date picker"
            accessibilityHint="Select a date from the calendar"
          />
        )}
      </View>
    </View>
  );
};

const localStyles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    marginBottom: 0,
  },
  inputContainer: {
    position: 'relative',
  },
  inputField: {
    marginBottom: 8,
    backgroundColor: colors.backgroundPaper,
  },
  textInputContentStyle: {
    paddingHorizontal: 12,
  },
});