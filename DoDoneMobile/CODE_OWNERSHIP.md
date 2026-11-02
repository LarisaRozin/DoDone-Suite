# Code Ownership and Attribution

This document clearly identifies the ownership and attribution of code within the DoDoneMobile project.

## Original Code (Copyright Larisa Rozin)

All source code files containing this copyright header are original work:

```javascript
/*
 * Copyright (c) 2025 Larisa Rozin
 * DoDoneMobile - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
```

### Original Code Locations

#### Application Core
- `App.tsx` - Main application component
- `index.js` - Application entry point
- `theme.ts` - Theme definitions
- `defaultTheme.ts` - Default theme implementation

#### Screens (All Original)
- `screens/MainAppScreen.tsx` - Main dashboard
- `screens/TaskEditScreen.tsx` - Task editing interface
- `screens/TaskDetailsScreen.tsx` - Task detail viewer
- `screens/TaskCommentsScreen.tsx` - Task comments interface
- `screens/LoginScreen.tsx` - Authentication screen
- `screens/RegisterScreen.tsx` - User registration
- `screens/ForgotPasswordScreen.tsx` - Password reset
- `screens/ResetPasswordScreen.tsx` - Password reset confirmation
- `screens/WelcomeScreen.tsx` - Welcome/onboarding
- `screens/TestScreen.tsx` - Development testing screen
- `screens/EmojiAvatarScreen.tsx` - Avatar selection screen

#### Settings Screens (All Original)
- `screens/settings/NotificationSettingsScreen.tsx`
- `screens/settings/TaskCategoriesScreen.tsx`
- `screens/settings/TaskCategoryEditScreen.tsx`
- `screens/settings/TaskGroupEditScreen.tsx`
- `screens/settings/TaskGroupsScreen.tsx`
- `screens/settings/TaskKindEditScreen.tsx`
- `screens/settings/TaskKindsScreen.tsx`

#### Team Management (All Original)
- `screens/team/TeamMemberEditScreen.tsx`
- `screens/team/TeamPreferencesScreen.tsx`
- `screens/team/TeamScreen.tsx`

#### Components (All Original)
- `components/AllowanceApprovalModal.tsx`
- `components/AllowanceHistoryModal.tsx`
- `components/AvatarSelection.tsx`
- `components/BonusFilterModal.tsx`
- `components/CelebrationOverlay.tsx`
- `components/ConfirmationDialog.tsx`
- `components/Credits.tsx`
- `components/CustomSegmentedControl.tsx`
- `components/DashboardBottomBar.tsx`
- `components/DashboardBottomStatsBar.tsx`
- `components/DashboardTopBar.tsx`
- `components/DatePicker.tsx`
- `components/Dropdown.tsx`
- `components/EmojiAvatarSelection.tsx`
- `components/Grade.tsx`
- `components/HorizontalFilterPills.tsx`
- `components/Rating.tsx`
- `components/Slider.tsx`
- `components/SliderExample.tsx`
- `components/SliderExampleProps.tsx`
- `components/TaskCommentIndicator.tsx`
- `components/TaskComments.tsx`
- `components/TaskCommentsModal.tsx`
- `components/TaskCommentsPreview.tsx`
- `components/TaskDetails.tsx`
- `components/TaskDetailsPreview.tsx`
- `components/TaskGroupKindCategoryDropdowns.tsx`
- `components/TaskListWithComments.tsx`
- `components/UserAvatar.tsx`
- `components/UserForm.tsx`

#### Task Details Sub-Components (All Original)
- `components/taskDetails/colorSelect.tsx`
- `components/taskDetails/emoji.tsx`
- `components/taskDetails/fontSelect.tsx`
- `components/taskDetails/insertLink.tsx`
- `components/taskDetails/InsertMedia.tsx`

#### Navigation (All Original)
- `navigation/AppNavigator.tsx` - Main navigation configuration
- `navigation/LinkingConfiguration.ts` - Deep linking setup

#### Services (All Original)
- `services/NavigationService.ts` - Navigation utilities
- `services/PushNotificationService.ts` - Push notification handling
- `services/SystemNotificationService.ts` - System notification management

#### Configuration (All Original)
- `config/config.ts` - Application configuration
- `config/config.https.ts` - HTTPS configuration

#### Contexts (All Original)
- `contexts/CelebrationContext.tsx` - Celebration state management
- `contexts/NotificationContext.tsx` - Notification state management

#### Hooks (All Original)
- `hooks/useConfirmationDialog.ts` - Confirmation dialog hook
- `hooks/useUserForm.ts` - User form management hook

#### Utilities (All Original)
- `utils/avatarUtils.ts` - Avatar utility functions
- `utils/dateUtils.ts` - Date manipulation utilities
- `utils/emojiAvatarUtils.ts` - Emoji avatar utilities
- `utils/nativeStorage.ts` - Native storage wrapper

#### Types (All Original)
- `types/user-avatar.ts` - Avatar type definitions
- `types/xxxindex.ts` - Type exports

#### Test Files (Original)
- `test-search.js` - Search functionality testing

## Third-Party Code

### External Dependencies (node_modules)
All code in the `node_modules/` directory belongs to their respective copyright holders. See `THIRD_PARTY_LICENSES.md` for complete attribution.

### External Shared Package
- `@larisarozin/dodone-shared/` - External shared package (separate Larisa Rozin project)
  - This is a separate project managed via yalc
  - Has its own copyright and licensing
  - Not included in this project's copyright scope

### Configuration Files
Some configuration files may contain boilerplate from React Native CLI:
- `babel.config.js` - Standard Babel configuration
- `jest.config.js` - Standard Jest configuration  
- `metro.config.js` - Standard Metro bundler configuration
- `react-native.config.js` - React Native CLI configuration

These contain minimal boilerplate code and are considered part of the development toolchain rather than substantial creative works.

## Assets and Resources

### Fonts ✅ Verified Commercial-Safe
- **Fredoka Font Family** in `assets/fonts/` - Licensed under SIL Open Font License (OFL)
  - `Fredoka-Regular.ttf`
  - `Fredoka-Medium.ttf` 
  - `Fredoka-SemiBold.ttf`
  - `Fredoka-Bold.ttf`
- **Source**: Google Fonts (https://fonts.google.com/specimen/Fredoka)
- **License**: Fully commercial-safe, no attribution required
- **Status**: ✅ Verified and documented

### Icons ✅ Verified Commercial-Safe  
- **All icons replaced** with MaterialCommunityIcons from react-native-vector-icons package
- **License**: MIT License - fully commercial-safe, no attribution required
- **Implementation**: Vector icons as React components in TaskDetailsScreen.tsx
- **Former PNG icons**: All removed from assets/icons/ directory
- **Icons used**:
  - `emoticon-happy` (replacing phiz.png - emoji function)
  - `language-html5` (replacing html.png - HTML function)
  - `content-copy` (replacing copy.png - copy function)
  - `content-cut` (replacing cut.png - cut function)
  - `content-paste` (replacing paste.png - paste function)
  - `translate` (replacing translate.png - translate function)
- **Status**: ✅ All icons verified and commercially safe

### Asset Documentation
- **Detailed Information**: See `ASSETS_LICENSE.md` for complete asset licensing documentation
- **Verification Guide**: See `ICON_VERIFICATION_GUIDE.md` for step-by-step icon verification process

## Generated Files

### Build Artifacts
- `android/` directory - Contains Android build configuration and generated files
- `ios/` directory - Contains iOS build configuration and generated files

These directories contain both:
- Original configuration files created for this project
- Generated files from build tools
- Platform-specific boilerplate code

## Summary

- **Original Work**: All TypeScript/JavaScript source files with Larisa Rozin copyright
- **Third-Party**: All npm packages and their dependencies
- **External**: `.yalc/dodone-shared` package (separate project)
- **Mixed**: Some configuration files contain standard boilerplate
- **Generated**: Build directories contain mix of original config and generated code

## Verification

To verify which files have copyright notices:
```bash
# Count files with Larisa Rozin copyright
Get-ChildItem -Recurse -Include "*.ts","*.tsx","*.js" | Select-String -Pattern "Copyright \\(c\\) 2026 Larisa Rozin" | Measure-Object | Select-Object -ExpandProperty Count
```

---

*This document serves as the definitive guide to code ownership within the DoDoneMobile project.*

**Asset Verification Status:**
- ✅ **Fonts**: Fully verified and commercial-safe (Fredoka - SIL OFL)
- ✅ **Icons**: All replaced with MaterialCommunityIcons (MIT License) - fully commercial-safe

*Generated on September 20, 2025*  
*Asset documentation updated: September 21, 2025*
*Icon replacement completed: September 21, 2025*