# Code Ownership and Attribution

This document clearly identifies the ownership and attribution of code within the dodone-shared project.

## Project Overview

- **Project Name**: dodone-shared
- **Repository**: LarisaRozin/dodone-shared
- **Version**: 1.0.0
- **License**: ISC
- **Primary Branch**: main

## Code Ownership

### Original Code

All source code in this project, unless otherwise specified, is original work created for this project and is owned by the project maintainers.

**Owner**: LarisaRozin
**Copyright**: © 2025 LarisaRozin
**License**: ISC

### File Structure and Ownership

```
src/
├── api/
│   └── routes.ts                    [Original Work]
├── config/
│   ├── ConfigContext.ts            [Original Work]
│   ├── ConfigProvider.tsx          [Original Work]
│   └── useConfig.ts                 [Original Work]
├── hooks/
│   ├── auth/
│   │   ├── AuthContext.ts          [Original Work]
│   │   ├── AuthProvider.tsx        [Original Work]
│   │   ├── AuthState.ts            [Original Work]
│   │   └── useAuth.tsx             [Original Work]
│   ├── useAllowanceHistories.ts    [Original Work]
│   ├── useAllowanceHistoryTaskItems.ts [Original Work]
│   ├── useGrades.tsx               [Original Work]
│   ├── useNotificationPreferences.ts [Original Work]
│   ├── useTaskCategories.ts        [Original Work]
│   ├── useTaskComments.ts          [Original Work]
│   ├── useTaskGroups.ts            [Original Work]
│   ├── useTaskItems.ts             [Original Work]
│   ├── useTaskKinds.ts             [Original Work]
│   └── useTeam.ts                  [Original Work]
├── types/
│   ├── AllowanceHistory.ts         [Original Work]
│   ├── AllowanceInterval.ts        [Original Work]
│   ├── ApiResponse.ts              [Original Work]
│   ├── DeviceRegistration.ts       [Original Work]
│   ├── TaskItem.ts                 [Original Work]
│   ├── Team.ts                     [Original Work]
│   ├── User.ts                     [Original Work]
│   └── UserNotificationPreferences.ts [Original Work]
├── utils/
│   ├── ApiClient.ts                [Original Work]
│   ├── paging.ts                   [Original Work]
│   ├── storage.ts                  [Original Work]
│   └── utils.ts                    [Original Work]
└── index.ts                        [Original Work]

examples/
└── setup-example.tsx               [Original Work]

Configuration Files:
├── package.json                     [Original Work]
├── tsconfig.json                    [Original Work]
└── README.md                        [Original Work]
```

## Third-Party Dependencies

This project uses the following third-party libraries (detailed in `THIRD_PARTY_LICENSES.md`):

### Runtime Dependencies
- **React** (^19.1.0) - MIT License - Facebook, Inc.

### Development Dependencies
- **TypeScript** (^5.8.3) - Apache-2.0 License - Microsoft
- **@types/node** (^24.0.3) - MIT License - DefinitelyTyped contributors
- **@types/react** (^19.1.8) - MIT License - DefinitelyTyped contributors

## Attribution Guidelines

### For Contributors
When contributing to this project:
1. All new code becomes part of the project under the ISC license
2. Ensure any external code or inspiration is properly attributed
3. Update this document if adding significant external dependencies
4. Follow the existing code style and patterns

### For External Use
When using code from this project:
1. Respect the ISC license terms
2. Provide appropriate attribution to the original authors
3. Include the original license notice
4. Clearly identify any modifications made

## Contact Information

For questions about code ownership or attribution:
- **Repository**: https://github.com/LarisaRozin/dodone-shared
- **Issues**: https://github.com/LarisaRozin/dodone-shared/issues

## Legal Notice

This project and all original code within it is the intellectual property of the project owner(s). The ISC license grants broad permissions for use, modification, and distribution, subject to the license terms.

All third-party dependencies maintain their original licenses and ownership as documented in `THIRD_PARTY_LICENSES.md`.

---

*Last updated: September 21, 2025*
*Document version: 1.0.0*