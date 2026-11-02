# DoDone Mobile App Icons

This directory contains the master SVG icon and generation script for creating all required app icons.

## Files

- `app-icon-master.svg` - Master SVG icon (1024x1024)
- `generate-icons.js` - Node.js script to generate all required PNG icons
- `package.json` - Dependencies for the generation script

## Icon Design

The app icon features:
- **Orange gradient background** - Matches the app's primary theme color (#F57C00)
- **White circular background** - Clean, professional look
- **Progress ring** - Represents task completion progress
- **Dollar symbol** - Represents allowance/bonus tracking feature
- **Checkmark** - Represents task completion
- **Star** - Represents achievements and bonuses
- **App name** - "DoDone" at the bottom

## Generated Icons

### Android Icons
Icons are generated for all Android densities:
- `mdpi`: 48x48px
- `hdpi`: 72x72px  
- `xhdpi`: 96x96px
- `xxhdpi`: 144x144px
- `xxxhdpi`: 192x192px

Both regular and round versions are generated for Android.

### iOS Icons
Icons are generated for all required iOS sizes:
- App icons for iPhone and iPad
- Settings icons
- Spotlight icons
- Notification icons
- App Store icon (1024x1024)

**Important:** All iOS icons are generated WITHOUT alpha channel (no transparency) as required by Apple App Store. The script uses `.flatten()` with a white background to ensure compliance.

## Regenerating Icons

To regenerate all icons after modifying the master SVG:

```bash
cd assets/icons
npm install
node generate-icons.js
```

Then clean and rebuild your project:

```bash
# For Android
npx react-native run-android --reset-cache

# For iOS
cd ios && pod install && cd ..
npx react-native run-ios
```

## Design Guidelines

The icon follows both Apple and Google design guidelines:
- No transparency (solid background)
- High contrast elements
- Scalable vector graphics
- Consistent with app's visual identity
- Professional and recognizable

## Color Scheme

- **Primary Orange**: #F57C00 (background gradient start)
- **Orange Accent**: #FF9800 (background gradient end)
- **Success Green**: #4CAF50 (checkmark and progress)
- **Coin Gold**: #FFC107 (dollar symbol)
- **Accent Blue**: #2196F3 (star)
- **White**: #FFFFFF (main content background)