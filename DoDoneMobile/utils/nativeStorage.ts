/*
 * Copyright (c) 2025 Larisa Rozin
 * DoDone- Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StorageAPI } from '@larisarozin/dodone-shared';

const nativeStorage: StorageAPI = {
  getItem: AsyncStorage.getItem,
  setItem: AsyncStorage.setItem,
  removeItem: AsyncStorage.removeItem,
};

export default nativeStorage;