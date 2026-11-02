/*
 * Copyright (c) 2025 Larisa Rozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useTaskGroups, PagedListRequestBuilder } from '@larisarozin/dodone-shared';
import DropdownComponent from './Dropdown';
import { colors } from '../defaultTheme';
// import { colors } from '../defaultTheme';

interface TaskGroupKindCategoryDropdownsProps {
  userId: number;
  selectedGroupId?: number | null;
  selectedKindId?: number | null;
  selectedCategoryId?: number | null;
  onGroupChange?: (groupId: number | null, group?: any) => void;
  onKindChange?: (kindId: number | null, kind?: any) => void;
  onCategoryChange?: (categoryId: number | null, category?: any) => void;
  horizontal?: boolean;
  style?: any;
  textSize?: 'small' | 'normal' | 'large';
  disabled?: boolean;
}

export const TaskGroupKindCategoryDropdowns: React.FC<TaskGroupKindCategoryDropdownsProps> = ({
  userId,
  selectedGroupId = null,
  selectedKindId = null,
  selectedCategoryId = null,
  onGroupChange,
  onKindChange,
  onCategoryChange,
  horizontal = false,
  style,
  textSize = 'normal',
  disabled = false,
}) => {
  const [pagedRequest] = useState(() => 
    new PagedListRequestBuilder()
      .setParentId(userId)
      .setPaging(1, 100) // Get a large number to avoid pagination for dropdowns
      .build()
  );
  
  const { pagedTaskGroups } = useTaskGroups(pagedRequest);
  const taskGroups = useMemo(() => pagedTaskGroups?.data || [], [pagedTaskGroups?.data]);
  
  // Internal state to track selected objects
  const [selectedGroup, setSelectedGroup] = useState<any | null>(null);
  const [selectedKind, setSelectedKind] = useState<any | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<any | null>(null);

  // Get available options based on current selections
  const availableKinds = selectedGroup?.kinds || [];
  const availableCategories = selectedKind?.categories || [];

  // Prepare dropdown data
  const groupDropdownData = taskGroups
    .map(group => ({
      label: group.name,
      value: group.id,
      originalData: group,
      isActive: group.isActive
    }))
    .filter(group => group.isActive || group.value === selectedGroup?.id);

  const kindDropdownData = availableKinds
    .map((kind: any) => ({
      label: kind.name,
      value: kind.id,
      originalData: kind,
      isActive: kind.isActive
    }))
    .filter((kind: any) => kind.isActive || kind.value === selectedKind?.id);

  const categoryDropdownData = availableCategories
    .map((category: any) => ({
      label: category.name,
      value: category.id,
      originalData: category,
      isActive: category.isActive
    }))
    .filter((category: any) => category.isActive || category.value === selectedCategory?.id);

  // Initialize selections when props change
  useEffect(() => {
    if (selectedGroupId && taskGroups.length > 0) {
      const group = taskGroups.find(g => g.id === selectedGroupId);
      setSelectedGroup(group || null);
    } else {
      setSelectedGroup(null);
    }
  }, [selectedGroupId, taskGroups]);

  useEffect(() => {
    if (selectedKindId && selectedGroup?.kinds) {
      const kind = selectedGroup.kinds.find((k: any) => k.id === selectedKindId);
      setSelectedKind(kind || null);
    } else {
      setSelectedKind(null);
    }
  }, [selectedKindId, selectedGroup]);

  useEffect(() => {
    if (selectedCategoryId && selectedKind?.categories) {
      const category = selectedKind.categories.find((c: any) => c.id === selectedCategoryId);
      setSelectedCategory(category || null);
    } else {
      setSelectedCategory(null);
    }
  }, [selectedCategoryId, selectedKind]);

  const handleGroupChange = (item: any) => {
    if (item.value === null) {
      setSelectedGroup(null);
      setSelectedKind(null);
      setSelectedCategory(null);
      onGroupChange?.(null);
      onKindChange?.(null);
      onCategoryChange?.(null);
    } else {
      const group = taskGroups.find(g => g.id === item.value);
      setSelectedGroup(group || null);
      setSelectedKind(null);
      setSelectedCategory(null);
      onGroupChange?.(item.value, group);
      onKindChange?.(null);
      onCategoryChange?.(null);
    }
  };

  const handleKindChange = (item: any) => {
    if (item.value === null) {
      setSelectedKind(null);
      setSelectedCategory(null);
      onKindChange?.(null);
      onCategoryChange?.(null);
    } else {
      const kind = availableKinds.find((k: any) => k.id === item.value);
      setSelectedKind(kind || null);
      setSelectedCategory(null);
      onKindChange?.(item.value, kind);
      onCategoryChange?.(null);
    }
  };

  const handleCategoryChange = (item: any) => {
    if (item.value === null) {
      setSelectedCategory(null);
      onCategoryChange?.(null);
    } else {
      const category = availableCategories.find((c: any) => c.id === item.value);
      setSelectedCategory(category || null);
      onCategoryChange?.(item.value, category);
    }
  };

  return (
    <View style={[horizontal ? localStyles.horizontalContainer : localStyles.verticalContainer, style]}>
      {horizontal ? (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={localStyles.scrollContent}
          accessible={true}
          accessibilityRole="scrollbar"
          accessibilityLabel="Task category selection"
          accessibilityHint="Scroll horizontally to view all task group, kind, and category dropdowns"
        >
          <View style={localStyles.dropdownsRow}>
            <View style={localStyles.dropdownHorizontal}>
              <DropdownComponent
                data={groupDropdownData}
                value={selectedGroup?.id}
                onValueChange={handleGroupChange}
                placeholder="Select Group"
                label="Task Group"
                searchable={true}
                textSize={textSize}
                disabled={disabled}
              />
            </View>

            <View style={localStyles.dropdownHorizontal}>
              <DropdownComponent
                data={kindDropdownData}
                value={selectedKind?.id}
                onValueChange={handleKindChange}
                placeholder={selectedGroup ? "Select Kind" : "Select Group first"}
                label="Task Kind"
                disabled={disabled || !selectedGroup}
                searchable={true}
                textSize={textSize}
                disabledBackgroundColor={colors.buttonDisabled}
              />
            </View>

            <View style={localStyles.dropdownHorizontal}>
              <DropdownComponent
                data={categoryDropdownData}
                value={selectedCategory?.id}
                onValueChange={handleCategoryChange}
                placeholder={selectedKind ? "Select Category" : "Select Kind first"}
                label="Task Category"
                disabled={disabled || !selectedKind}
                searchable={true}
                textSize={textSize}
                disabledBackgroundColor={colors.buttonDisabled}
              />
            </View>
          </View>
        </ScrollView>
      ) : (
        <>
          <View style={localStyles.dropdownVertical}>
            <DropdownComponent
              data={groupDropdownData}
              value={selectedGroup?.id}
              onValueChange={handleGroupChange}
              placeholder="Select Group"
              label="Task Group"
              searchable={true}
              textSize={textSize}
              disabled={disabled}
            />
          </View>

          <View style={localStyles.dropdownVertical}>
            <DropdownComponent
              data={kindDropdownData}
              value={selectedKind?.id}
              onValueChange={handleKindChange}
              placeholder={selectedGroup ? "Select Kind" : "Select Group first"}
              label="Task Kind"
              disabled={disabled || !selectedGroup}
              searchable={true}
              textSize={textSize}
              disabledBackgroundColor={colors.buttonDisabled}
            />
          </View>

          <View style={localStyles.dropdownVertical}>
            <DropdownComponent
              data={categoryDropdownData}
              value={selectedCategory?.id}
              onValueChange={handleCategoryChange}
              placeholder={selectedKind ? "Select Category" : "Select Kind first"}
              label="Task Category"
              disabled={disabled || !selectedKind}
              searchable={true}
              textSize={textSize}
              disabledBackgroundColor={colors.buttonDisabled}
            />
          </View>
        </>
      )}
    </View>
  );
};

const localStyles = StyleSheet.create({
  horizontalContainer: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    overflow: 'visible',
    // backgroundColor: colors.backgroundPaper,
    paddingVertical: 0,
    marginVertical: 0,
  },
  verticalContainer: {
    flexDirection: 'column',
    paddingVertical: 0,
    marginVertical: 0,
    gap: 16,
  },
  scrollContent: {
    paddingHorizontal: 4,
    paddingVertical: 4,
    paddingTop: 8,
  },
  dropdownsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    overflow: 'visible',
  },
  dropdownHorizontal: {
    flex: 1,
    minWidth: 120,
    overflow: 'visible',
  },
  dropdownVertical: {
    width: '100%',
  },
});

export default TaskGroupKindCategoryDropdowns;
