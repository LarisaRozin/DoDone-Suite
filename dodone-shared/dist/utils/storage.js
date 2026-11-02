"use strict";
/*
 * Copyright (c) 2025 Larisa Rozin
 * dodone-shared - Task Management, Allowance & Bonus Tracking Application Package
 * All rights reserved.
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
// Cross-platform storage utility
let storage;
if (typeof window !== 'undefined' && window.localStorage) {
    // Web
    storage = {
        getItem: (key) => __awaiter(void 0, void 0, void 0, function* () { return window.localStorage.getItem(key); }),
        setItem: (key, value) => __awaiter(void 0, void 0, void 0, function* () { return window.localStorage.setItem(key, value); }),
        removeItem: (key) => __awaiter(void 0, void 0, void 0, function* () { return window.localStorage.removeItem(key); }),
    };
}
else {
    // React Native
    // Dynamically require to avoid breaking web build
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    storage = {
        getItem: AsyncStorage.getItem,
        setItem: AsyncStorage.setItem,
        removeItem: AsyncStorage.removeItem,
    };
}
exports.default = storage;
