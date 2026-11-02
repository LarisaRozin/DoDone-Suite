# Third-Party Licenses

This document lists all third-party dependencies used in the DoDone solution and their respective licenses.

## .NET/C# Dependencies

### NuGet Packages

#### Production Dependencies (DoDone.Server)

| Package | Version | License | Description |
|---------|---------|---------|-------------|
| [FirebaseAdmin](https://www.nuget.org/packages/FirebaseAdmin/) | 3.3.0 | Apache License 2.0 | Firebase Admin SDK for .NET |
| [MailKit](https://www.nuget.org/packages/MailKit/) | 4.13.0 | MIT License | Cross-platform .NET email client library |
| [Microsoft.AspNetCore.Authentication.JwtBearer](https://www.nuget.org/packages/Microsoft.AspNetCore.Authentication.JwtBearer/) | 9.0.6 | MIT License | JWT bearer authentication for ASP.NET Core |
| [Microsoft.AspNetCore.OpenApi](https://www.nuget.org/packages/Microsoft.AspNetCore.OpenApi/) | 9.0.6 | MIT License | OpenAPI support for ASP.NET Core |
| [Microsoft.EntityFrameworkCore.Design](https://www.nuget.org/packages/Microsoft.EntityFrameworkCore.Design/) | 9.0.6 | MIT License | Entity Framework Core design-time tools |
| [Microsoft.EntityFrameworkCore.SqlServer](https://www.nuget.org/packages/Microsoft.EntityFrameworkCore.SqlServer/) | 9.0.6 | MIT License | SQL Server provider for Entity Framework Core |
| [System.IdentityModel.Tokens.Jwt](https://www.nuget.org/packages/System.IdentityModel.Tokens.Jwt/) | 8.12.1 | MIT License | JWT token handling for .NET |

#### Database Dependencies (DoDone.Db)

| Package | Version | License | Description |
|---------|---------|---------|-------------|
| [EFCore.BulkExtensions](https://www.nuget.org/packages/EFCore.BulkExtensions/) | 9.0.1 | MIT License | Entity Framework Core bulk operations |
| [Microsoft.AspNetCore.Identity.EntityFrameworkCore](https://www.nuget.org/packages/Microsoft.AspNetCore.Identity.EntityFrameworkCore/) | 9.0.6 | MIT License | ASP.NET Core Identity with Entity Framework Core |
| [Microsoft.EntityFrameworkCore](https://www.nuget.org/packages/Microsoft.EntityFrameworkCore/) | 9.0.6 | MIT License | Entity Framework Core ORM |
| [Microsoft.EntityFrameworkCore.Design](https://www.nuget.org/packages/Microsoft.EntityFrameworkCore.Design/) | 9.0.6 | MIT License | Entity Framework Core design-time tools |
| [Microsoft.EntityFrameworkCore.SqlServer](https://www.nuget.org/packages/Microsoft.EntityFrameworkCore.SqlServer/) | 9.0.6 | MIT License | SQL Server provider for Entity Framework Core |

#### Testing Dependencies (DoDone.Server.Tests)

| Package | Version | License | Description |
|---------|---------|---------|-------------|
| [FluentAssertions](https://www.nuget.org/packages/FluentAssertions/) | 6.12.0 | Apache License 2.0 | Fluent assertions for .NET unit tests |
| [Microsoft.Extensions.Logging.Abstractions](https://www.nuget.org/packages/Microsoft.Extensions.Logging.Abstractions/) | 9.0.7 | MIT License | Logging abstractions for Microsoft.Extensions.Logging |
| [Moq](https://www.nuget.org/packages/Moq/) | 4.20.72 | BSD 3-Clause License | Mocking framework for .NET |
| [xunit](https://www.nuget.org/packages/xunit/) | 2.6.6 | Apache License 2.0 | Unit testing framework for .NET |
| [xunit.runner.visualstudio](https://www.nuget.org/packages/xunit.runner.visualstudio/) | 2.5.6 | MIT License | Visual Studio test runner for xUnit.net |
| [Microsoft.NET.Test.Sdk](https://www.nuget.org/packages/Microsoft.NET.Test.Sdk/) | 17.11.1 | MIT License | .NET Test SDK |
| [coverlet.collector](https://www.nuget.org/packages/coverlet.collector/) | 6.0.2 | MIT License | Code coverage collector for .NET |

## Frontend Dependencies (React/TypeScript)

### Production Dependencies

| Package | Version | License | Description |
|---------|---------|---------|-------------|
| [@emotion/react](https://www.npmjs.com/package/@emotion/react) | ^11.14.0 | MIT License | CSS-in-JS library for React |
| [@emotion/styled](https://www.npmjs.com/package/@emotion/styled) | ^11.14.0 | MIT License | Styled components for Emotion |
| [@mui/icons-material](https://www.npmjs.com/package/@mui/icons-material) | ^7.1.0 | MIT License | Material Design icons for React |
| [@mui/material](https://www.npmjs.com/package/@mui/material) | ^7.1.0 | MIT License | Material-UI React components |
| [@mui/x-data-grid](https://www.npmjs.com/package/@mui/x-data-grid) | ^8.5.0 | MIT License | Material-UI data grid component |
| [react](https://www.npmjs.com/package/react) | ^19.1.0 | MIT License | JavaScript library for building user interfaces |
| [react-dom](https://www.npmjs.com/package/react-dom) | ^19.1.0 | MIT License | React DOM bindings |
| [react-hook-form](https://www.npmjs.com/package/react-hook-form) | ^7.58.0 | MIT License | Forms library for React |
| [react-router-dom](https://www.npmjs.com/package/react-router-dom) | ^7.6.1 | MIT License | Routing library for React |

### Development Dependencies

| Package | Version | License | Description |
|---------|---------|---------|-------------|
| [@eslint/js](https://www.npmjs.com/package/@eslint/js) | ^9.25.0 | MIT License | ESLint JavaScript rules |
| [@types/node](https://www.npmjs.com/package/@types/node) | ^18 | MIT License | TypeScript definitions for Node.js |
| [@types/react](https://www.npmjs.com/package/@types/react) | ^19.1.6 | MIT License | TypeScript definitions for React |
| [@types/react-dom](https://www.npmjs.com/package/@types/react-dom) | ^19.1.5 | MIT License | TypeScript definitions for React DOM |
| [@vitejs/plugin-react](https://www.npmjs.com/package/@vitejs/plugin-react) | ^4.4.1 | MIT License | Vite plugin for React |
| [eslint](https://www.npmjs.com/package/eslint) | ^9.25.0 | MIT License | JavaScript and TypeScript linter |
| [eslint-plugin-react-hooks](https://www.npmjs.com/package/eslint-plugin-react-hooks) | ^5.2.0 | MIT License | ESLint rules for React Hooks |
| [eslint-plugin-react-refresh](https://www.npmjs.com/package/eslint-plugin-react-refresh) | ^0.4.19 | MIT License | ESLint plugin for React Fast Refresh |
| [globals](https://www.npmjs.com/package/globals) | ^16.0.0 | MIT License | Global variables for different JavaScript environments |
| [typescript](https://www.npmjs.com/package/typescript) | ^5.8.3 | Apache License 2.0 | TypeScript compiler and language |
| [typescript-eslint](https://www.npmjs.com/package/typescript-eslint) | ^8.30.1 | MIT License | TypeScript tooling for ESLint |
| [vite](https://www.npmjs.com/package/vite) | ^6.3.5 | MIT License | Build tool and development server |

## License Summaries

### MIT License
Most dependencies use the MIT License, which is a permissive license allowing:
- Commercial use
- Distribution
- Modification
- Private use

Requirements:
- Include copyright and license notice

### Apache License 2.0
Some dependencies use the Apache License 2.0, which is a permissive license allowing:
- Commercial use
- Distribution
- Modification
- Patent use
- Private use

Requirements:
- Include copyright and license notice
- State changes made to the code

### BSD 3-Clause License
The Moq package uses the BSD 3-Clause License, which is a permissive license allowing:
- Commercial use
- Distribution
- Modification
- Private use

Requirements:
- Include copyright and license notice
- Cannot use the names of contributors to endorse derived products

## Compliance Notes

1. All dependencies use permissive licenses that allow commercial use and distribution.
2. No copyleft (GPL) licenses are used, so there are no requirements to open-source the DoDone application.
3. The main requirement is to include appropriate copyright notices, which is satisfied by this document.
4. The project complies with all license terms for the listed dependencies.

## Updates

This document should be updated whenever dependencies are added, removed, or updated to ensure accurate license tracking.

---

*Last updated: September 21, 2025*