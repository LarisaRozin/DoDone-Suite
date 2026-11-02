/*
 * Copyright (c) 2025 Larisa Rozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
import { User as BaseUser } from '@larisarozin/dodone-shared';

// Extended User interface with avatar support
export interface UserWithAvatar extends BaseUser {
  avatarUri?: string;
  avatarLastUpdated?: string;
}

// Form data interface with avatar support
export interface UserFormDataWithAvatar {
  userName: string;
  email: string;
  firstName: string;
  lastName: string;
  middleName: string;
  salutation: string;
  password: string;
  confirmPassword: string;
  isAdmin: boolean;
  isActive: boolean;
  intendedUse?: 'Business' | 'Personal';
  teamName?: string;
  teamDescription?: string;
  avatarUri?: string;
}

// Update request with avatar support
export interface UserUpdateRequestWithAvatar {
  id: number;
  userName?: string;
  password: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  salutation?: string;
  isAdmin?: boolean;
  isActive?: boolean;
  avatarUri?: string;
  avatarLastUpdated?: string;
}

// Create request with avatar support
export interface UserCreateRequestWithAvatar {
  userName: string;
  email: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  salutation?: string;
  isAdmin?: boolean;
  isActive?: boolean;
  avatarUri?: string;
}
