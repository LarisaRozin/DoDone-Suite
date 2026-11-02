# Third-Party Licenses

This document lists all third-party dependencies used in DoDoneMobile and their respective licenses.

## License Summary

This project uses the following types of third-party licenses:
- **MIT License**: 776 packages (most permissive, allows commercial use)
- **Apache-2.0**: 74 packages (permissive with patent protection)
- **ISC License**: 58 packages (very similar to MIT)
- **BSD-3-Clause**: 38 packages (permissive with attribution requirement)
- **BSD-2-Clause**: 21 packages (permissive with attribution requirement)
- **0BSD**: 3 packages (public domain equivalent)
- **CC0-1.0**: 2 packages (public domain)
- **Other**: Small number of packages with CC-BY and Python-2.0 licenses

## Key Third-Party Dependencies

### Core React Native & React Dependencies
- **react** (MIT License) - JavaScript library for building user interfaces
- **react-native** (MIT License) - Framework for building native apps with React
- **@react-navigation/native** (MIT License) - Navigation library for React Native
- **@react-navigation/stack** (MIT License) - Stack navigator for React Navigation
- **react-native-paper** (MIT License) - Material Design components for React Native

### UI Components & Libraries
- **lottie-react-native** (Apache-2.0) - Lottie animations for React Native
- **react-native-vector-icons** (MIT License) - Customizable icons for React Native
- **react-native-svg** (MIT License) - SVG support for React Native
- **react-native-confetti-cannon** (MIT License) - Confetti animation component
- **react-native-modal** (MIT License) - Enhanced modal component
- **@kolking/react-native-rating** (MIT License) - Rating component

### Storage & State Management
- **@react-native-async-storage/async-storage** (MIT License) - Asynchronous storage for React Native
- **react-native-get-random-values** (MIT License) - Polyfill for crypto.getRandomValues()
- **uuid** (MIT License) - UUID generation library

### Firebase & Push Notifications
- **@react-native-firebase/app** (Apache-2.0) - React Native Firebase core package
- **@react-native-firebase/messaging** (Apache-2.0) - Firebase Cloud Messaging
- **react-native-push-notification** (MIT License) - Push notification support

### Form & Input Components
- **@react-native-community/datetimepicker** (MIT License) - Date and time picker
- **@react-native-community/slider** (MIT License) - Slider component
- **react-native-element-dropdown** (MIT License) - Dropdown component
- **react-native-pell-rich-editor** (MIT License) - Rich text editor

### Development Tools
- **@babel/core** (MIT License) - Babel JavaScript compiler core
- **eslint** (MIT License) - JavaScript linting utility
- **jest** (MIT License) - JavaScript testing framework
- **typescript** (Apache-2.0) - TypeScript compiler
- **prettier** (MIT License) - Code formatting tool

## Special License Considerations

### Creative Commons Licenses
Some dependencies use Creative Commons licenses for data/content:
- **caniuse-lite** (CC-BY-4.0) - Browser support data
- **spdx-exceptions** (CC-BY-3.0) - SPDX license exception data

These packages contain data rather than code and their CC-BY licenses require attribution, which is automatically satisfied through this documentation.

### Python Software Foundation License
- **argparse** (Python-2.0) - Command line argument parsing library

The Python-2.0 license is permissive and compatible with commercial use.

## License Compliance

### MIT License Requirements
Most dependencies use the MIT License, which requires:
- Include the original license text
- Include copyright notice
- No additional restrictions

**Compliance**: This document serves as the required attribution. Full license texts are preserved in node_modules.

### Apache 2.0 License Requirements
Apache 2.0 licensed dependencies require:
- Include the original license text
- Include copyright notice
- State any modifications made
- Preserve patent grant

**Compliance**: No modifications made to Apache 2.0 packages. Attributions preserved in node_modules.

### BSD License Requirements
BSD licensed dependencies require:
- Include copyright notice
- Include license terms
- Include disclaimer

**Compliance**: All attributions preserved in node_modules and acknowledged here.

## Copyright Notices

### Major Dependencies Copyright Information

**React Native**
- Copyright (c) Meta Platforms, Inc. and affiliates.
- License: MIT

**React**
- Copyright (c) Meta Platforms, Inc. and affiliates.
- License: MIT

**React Navigation**
- Copyright (c) 2017 React Navigation Contributors
- License: MIT

**React Native Paper**
- Copyright (c) 2017-present react-native-paper contributors
- License: MIT

**Lottie React Native**
- Copyright 2018 Airbnb, Inc.
- License: Apache-2.0

**Firebase React Native**
- Copyright 2016-present Invertase Limited
- License: Apache-2.0

## Original vs Third-Party Code

### Original Code (Copyright Larisa Rozin)
All files containing the copyright notice:
```
/*
 * Copyright (c) 2026 Larisa Rozin
 * DoDoneMobile - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
```

This includes:
- All React Native screens and components in `/screens/` and `/components/`
- Navigation configuration in `/navigation/`
- Custom services in `/services/`
- Utility functions in `/utils/`
- Configuration files in `/config/`
- Contexts and hooks in `/contexts/` and `/hooks/`
- Theme and styling files
- Application entry points

### Third-Party Code
- All packages in `node_modules/` directory
- External package `dodone-shared` in `.yalc/dodone-shared/` (separate project)

### Mixed/Modified Third-Party Code
Currently no third-party code has been modified or embedded directly in the source code.

## License Compatibility

All dependencies use licenses compatible with proprietary software development:
- ✅ MIT, ISC, BSD licenses - Fully permissive
- ✅ Apache-2.0 - Permissive with patent protection  
- ✅ CC0-1.0, 0BSD - Public domain equivalent
- ✅ CC-BY licenses - Require attribution (satisfied by this document)
- ✅ Python-2.0 - Permissive and compatible

No GPL or other copyleft licenses detected that would require releasing source code.

## Full License Report

A complete machine-readable license report is available by running:
```bash
npx license-checker --excludePackages "DoDoneMobile" --json
```

---

*This document was generated on September 20, 2025*
*Last updated: September 20, 2025*