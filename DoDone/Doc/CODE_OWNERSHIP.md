# Code Ownership and Attribution

This document clearly identifies the ownership and attribution of code within the DoDone solution project.

## Primary Ownership

**Owner:** LarisaRozin  
**Copyright:** © 2025 LarisaRozin  
**Project:** DoDone - Task Management, Allowance & Bonus Tracking Application

## Code Attribution

### Original Development
- **Author:** LarisaRozin
- **Scope:** All original source code in the DoDone solution
- **License:** Proprietary - All rights reserved

### Code Coverage
The following code components are owned by LarisaRozin:

#### Backend (.NET Core)
- **DoDone.Server** - Main API server application
  - Controllers, Services, DTOs, Extensions
  - Authentication and authorization logic
  - Task management business logic
  - Allowance calculation and tracking
  - Email and notification services
  - JWT token handling

- **DoDone.Db** - Database layer
  - Entity Framework Core models
  - Repository patterns and data access
  - Database context configuration
  - Data models and relationships

- **DoDone.Shared** - Shared utilities and abstractions
  - Common interfaces and abstractions
  - Enumeration definitions
  - Extension methods
  - Debug helpers

- **DoDone.Server.Tests** - Unit and integration tests
  - Service tests and mocking
  - Database fixture setup
  - Test utilities and helpers

#### Frontend (React/TypeScript)
- **DoDone.Client** - React TypeScript application
  - React components and hooks
  - Authentication context and providers
  - UI themes and styling
  - Type definitions
  - API integration logic
  - Routing and navigation

### Third-Party Components
Third-party libraries and frameworks are used under their respective licenses (see THIRD_PARTY_LICENSES.md):
- **.NET 9.0** - Microsoft .NET framework
- **Entity Framework Core** - Microsoft ORM
- **React** - Meta's JavaScript UI library
- **Material-UI** - Material Design React components
- **Various NuGet and npm packages** - As documented in THIRD_PARTY_LICENSES.md

### Generated Code
The following code components are auto-generated and not subject to copyright:
- **Entity Framework Migrations** - Auto-generated database migration files in `DoDone.Db/Migrations/`
- **TypeScript declarations** - Auto-generated type definitions
- **Build artifacts** - Compiled assemblies and JavaScript bundles

### Configuration and Metadata
- **Project files** (.csproj, package.json) - Project configuration and dependency management
- **Build configuration** - MSBuild, Vite, ESLint, TypeScript configurations
- **Development tools** - Scripts and utilities for development workflow

## Intellectual Property

### Copyright Notice
All original source code files contain the following copyright notice:
```
/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
```

### Proprietary Rights
- The DoDone application concept, design, and implementation are proprietary to LarisaRozin
- Business logic, algorithms, and architectural decisions are original work
- User interface design and user experience patterns are original creations
- Database schema and data modeling are original designs

## Attribution Requirements

### Internal Use
When referencing or extending this codebase:
1. Maintain copyright notices in all source files
2. Credit LarisaRozin as the original author
3. Preserve this CODE_OWNERSHIP.md file

### Third-Party Integration
When integrating with external systems:
1. Respect the proprietary nature of the DoDone codebase
2. Follow licensing terms for third-party dependencies
3. Maintain clear boundaries between proprietary and open-source code

## License Compliance

### Proprietary Code
- All original DoDone source code is proprietary and all rights are reserved
- No permission is granted to copy, modify, or distribute the proprietary code
- Commercial use requires explicit permission from LarisaRozin

### Open Source Dependencies
- Third-party dependencies are used in compliance with their respective licenses
- See THIRD_PARTY_LICENSES.md for complete license information
- All third-party license requirements are met

## Contact Information

For questions about code ownership, licensing, or attribution:

**Owner:** LarisaRozin  
**Project:** DoDone Task Management Application  
**Repository:** https://github.com/LarisaRozin/DoDone

## Change History

| Date | Change | Author |
|------|--------|--------|
| 2025-09-21 | Initial code ownership documentation | LarisaRozin |

---

*This document should be updated when ownership or attribution changes occur.*

*Last updated: September 21, 2025*