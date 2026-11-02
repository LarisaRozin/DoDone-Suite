/*
 * Copyright (c) 2025 Larisa Rozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { colors } from '../defaultTheme';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import UserAvatar from './UserAvatar';

interface DropdownItem {
  label: string;
  value: any;
  id?: any;
  avatarUri?: string;
  firstName?: string;
  lastName?: string;
  userName?: string;
}

interface DropdownComponentProps {
  data: DropdownItem[];
  value: any;
  onValueChange: (item: DropdownItem) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  searchable?: boolean;
  labelField?: string;
  valueField?: string;
  style?: any;
  allowClear?: boolean;
  clearLabel?: string;
  textSize?: 'small' | 'normal' | 'large';
  disabledBackgroundColor?: string;
  backgroundColor?: string; // New prop for custom background
  showAvatar?: boolean; // New prop to enable avatar display
}

const DropdownComponent: React.FC<DropdownComponentProps> = ({
  data,
  value,
  onValueChange,
  placeholder = 'Select item',
  label,
  disabled = false,
  searchable = false,
  labelField = 'label',
  valueField = 'value',
  style,
  allowClear = true,
  clearLabel = '-- Clear --',
  textSize = 'normal',
  disabledBackgroundColor,
  showAvatar = false,
  backgroundColor, // New prop
}) => {
  const [isFocus, setIsFocus] = useState(false);

  // Get text styles based on size
  const getTextStyles = () => {
    switch (textSize) {
      case 'small':
        return {
          itemTextStyle: { ...localStyles.itemTextStyle, fontSize: 12 },
          itemText: { ...localStyles.itemText, fontSize: 12 },
          clearItemText: { ...localStyles.clearItemText, fontSize: 12 },
          placeholderStyle: { ...localStyles.placeholderStyle, fontSize: 12 },
          selectedTextStyle: { ...localStyles.selectedTextStyle, fontSize: 12 },
          staticLabel: { ...localStyles.staticLabel, fontSize: 10 },
          dropdown: { ...localStyles.dropdown, height: 50 },
        };
      case 'large':
        return {
          itemTextStyle: { ...localStyles.itemTextStyle, fontSize: 18 },
          itemText: { ...localStyles.itemText, fontSize: 18 },
          clearItemText: { ...localStyles.clearItemText, fontSize: 18 },
          placeholderStyle: { ...localStyles.placeholderStyle, fontSize: 18 },
          selectedTextStyle: { ...localStyles.selectedTextStyle, fontSize: 18 },
          staticLabel: { ...localStyles.staticLabel, fontSize: 14 },
          dropdown: { ...localStyles.dropdown, height: 55 },
        };
      default: // 'normal'
        return {
          itemTextStyle: localStyles.itemTextStyle,
          itemText: localStyles.itemText,
          clearItemText: localStyles.clearItemText,
          placeholderStyle: localStyles.placeholderStyle,
          selectedTextStyle: localStyles.selectedTextStyle,
          staticLabel: localStyles.staticLabel,
          dropdown: localStyles.dropdown,
        };
    }
  };

  const textStyles = getTextStyles();

  // Add clear option to the data if allowClear is true
  const enhancedData = allowClear 
    ? [{ [labelField]: clearLabel, [valueField]: null }, ...data]
    : data;

  // Calculate disabled styles
  const disabledStyles = disabled ? {
    ...localStyles.disabledDropdown,
    backgroundColor: disabledBackgroundColor || colors.primaryLight,
    opacity: disabledBackgroundColor ? 0.5 : 0.8,
  } : null;

  return (
    <View style={[localStyles.container, style]}>
      <View 
        style={localStyles.inputContainer}
        accessible={false}
      >
        {label && (
          <Text 
            style={textStyles.staticLabel}
            accessible={true}
            accessibilityRole="text"
            accessibilityLabel={`Dropdown label: ${label}`}
          >
            {label}
          </Text>
        )}
        <Dropdown
        style={[
          textStyles.dropdown, 
          isFocus && { borderColor: colors.primary },
          backgroundColor && { backgroundColor }, // Apply custom background color
          disabledStyles
        ]}
        containerStyle={localStyles.dropdownContainer}
        placeholderStyle={[textStyles.placeholderStyle, disabled && localStyles.disabledText]}
        selectedTextStyle={[textStyles.selectedTextStyle, disabled && localStyles.disabledText]}
        itemTextStyle={textStyles.itemTextStyle}
        inputSearchStyle={localStyles.inputSearchStyle}
        iconStyle={localStyles.iconStyle}
        data={enhancedData}
        search={searchable}
        maxHeight={300}
        labelField={labelField}
        valueField={valueField}
        placeholder={!isFocus ? placeholder : '...'}
        searchPlaceholder="Search..."
        value={value}
        onFocus={() => !disabled && setIsFocus(true)}
        onBlur={() => setIsFocus(false)}
        onChange={item => {
          if (!disabled) {
            onValueChange(item);
            setIsFocus(false);
          }
        }}
        disable={disabled}
        accessibilityLabel={label ? `${label} dropdown` : 'Dropdown'}
        renderItem={(item) => (
          <View 
            style={[
            localStyles.itemContainer, 
            item[valueField] === null && localStyles.clearItemContainer,
            showAvatar && item[valueField] !== null && localStyles.itemContainerWithAvatar
          ]}
            accessible={true}
            accessibilityRole="menuitem"
            accessibilityLabel={item[labelField]}
            accessibilityHint={item[valueField] === null ? 'Clear selection' : `Select ${item[labelField]}`}
          >
            {showAvatar && item[valueField] !== null && (
              <UserAvatar
                size={18}
                imageUri={item.avatarUri}
                firstName={item.firstName}
                lastName={item.lastName}
                userName={item.userName}
                fontSize={12}
                style={localStyles.avatarStyle}
              />
            )}
            <Text 
              style={[textStyles.itemText, item[valueField] === null && textStyles.clearItemText, showAvatar && item[valueField] !== null && localStyles.itemTextWithAvatar]}
              accessible={false}
            >
              {item[labelField]}
            </Text>
          </View>
        )}
        renderRightIcon={() => (
          <MaterialCommunityIcons 
            name="chevron-down" 
            size={textSize === 'small' ? 20 : textSize === 'large' ? 28 : 24} 
            color={disabled ? colors.textSecondary : colors.textPrimary}
            accessible={false}
          />
        )}
      />
      </View>
    </View>
  );
};

export default DropdownComponent;

const localStyles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    marginVertical: 2,
    marginHorizontal: 0,
  },
  inputContainer: {
    position: 'relative',
    justifyContent: 'center',
  },
  staticLabel: {
    position: 'absolute',
    top: -12,
    left: 12,
    backgroundColor: 'transparent',
    paddingHorizontal: 4,
    fontSize: 12,
    fontWeight: '400',
    color: colors.textSecondary,
    zIndex: 1,
  },
  dropdown: {
    height: 50,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: colors.backgroundPaper,
  },
  dropdownContainer: {
    backgroundColor: colors.backgroundPaper,
  },
  itemTextStyle: {
    fontSize: 15,
    color: colors.textPrimary,
    paddingVertical: 0,
    marginVertical: 0, 
  },
  itemContainer: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    minHeight: 32,
    justifyContent: 'center',
  },
  itemText: {
    fontSize: 15,
    color: colors.textPrimary,
  },
  clearItemContainer: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    minHeight: 32,
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  clearItemText: {
    fontSize: 15,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  disabledDropdown: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.border,
    opacity: 0.8,
  },
  placeholderStyle: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  selectedTextStyle: {
    fontSize: 15,
    color: colors.primary, // Use orange color for selected value
    // fontWeight: '500',
  },
  disabledText: {
    color: colors.textSecondary,
    opacity: 0.6,
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 12,
    color: colors.textPrimary,
    borderColor: colors.border,
  },
  avatarStyle: {
    marginRight: 12,
    minHeight: 34,
    minWidth: 34,
    borderRadius: 16,
  },
  itemTextWithAvatar: {
    marginLeft: 0,
    flex: 1,
  },
  itemContainerWithAvatar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
});