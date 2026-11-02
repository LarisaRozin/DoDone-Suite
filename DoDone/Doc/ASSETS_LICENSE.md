# Assets License Documentation

This document provides licensing information for fonts, icons, images, and other assets used in the DoDone solution.

## Asset Inventory

### Icons and Graphics

#### Material Design Icons
- **Source:** @mui/icons-material package
- **License:** Apache License 2.0
- **Usage:** UI icons throughout the React application
- **Attribution:** Material Design Icons by Google
- **License URL:** https://www.apache.org/licenses/LICENSE-2.0
- **Compliance:** Used via npm package, license requirements satisfied

#### React Logo
- **File:** `DoDone.Client/src/assets/react.svg`
- **Source:** React project
- **License:** MIT License
- **Usage:** Default Vite template asset (currently unused in production)
- **Attribution:** React project contributors
- **Note:** This is a default template file and can be removed if not used

#### Vite Logo
- **File:** `DoDone.Client/public/vite.svg`
- **Source:** Vite project
- **License:** MIT License
- **Usage:** Default Vite template asset (currently unused in production)
- **Attribution:** Vite project contributors
- **Note:** This is a default template file and can be removed if not used

### Fonts

#### System Fonts
The application uses system fonts as specified in `DoDone.Client/src/index.css`:
- **Primary:** system-ui, Avenir, Helvetica, Arial, sans-serif
- **License:** System fonts are provided by the operating system and do not require licensing
- **No attribution required** for system fonts

#### Google Fonts (Referenced but not bundled)
The Logo component references "Luckiest Guy" font:
- **Font:** Luckiest Guy
- **Source:** Google Fonts
- **License:** SIL Open Font License (OFL)
- **Usage:** Referenced in Logo.tsx but not bundled with the application
- **Attribution:** If this font is loaded from Google Fonts, no local attribution required
- **Note:** Font is loaded externally if used, no licensing issues for the DoDone project

### Images and Media

#### Custom Logo/Branding
- **Component:** `DoDone.Client/src/components/Logo.tsx`
- **Type:** SVG-based custom logo
- **Owner:** LarisaRozin
- **License:** Proprietary
- **Copyright:** © 2025 LarisaRozin
- **Usage:** Application branding and identity

#### Placeholder/Template Assets
- Default Vite and React template files (not used in production)
- Can be safely removed without licensing concerns

## Third-Party Asset Libraries

### Material-UI Components
- **Package:** @mui/material
- **License:** MIT License
- **Includes:** Component styling, themes, and design system
- **Attribution:** Material-UI team
- **Compliance:** Used via npm package, license satisfied

### Emotion (CSS-in-JS)
- **Packages:** @emotion/react, @emotion/styled
- **License:** MIT License
- **Usage:** Dynamic styling and CSS-in-JS functionality
- **Attribution:** Emotion team
- **Compliance:** Used via npm package, license satisfied

## License Compliance Summary

### ✅ Compliant Assets

1. **Material Design Icons** - Apache 2.0 license, properly used via npm
2. **System Fonts** - No licensing required
3. **Material-UI Styling** - MIT license, properly used via npm
4. **Emotion Styling** - MIT license, properly used via npm

### ⚠️ Review Needed

1. **Google Fonts (Luckiest Guy)** - Currently referenced but not confirmed if actively loaded
   - **Action:** Verify if font is actually loaded in production
   - **If loaded:** Ensure compliance with SIL OFL license (automatic via Google Fonts CDN)

### 🔧 Maintenance Items

1. **Template Assets** - Remove unused Vite and React template files:
   - `DoDone.Client/src/assets/react.svg`
   - `DoDone.Client/public/vite.svg`

## Asset Attribution

### Required Attribution

For Apache 2.0 licensed assets (Material Icons):
```
Material Design Icons
Copyright (c) Google Inc.
Licensed under the Apache License, Version 2.0
```

### Optional Attribution

For MIT licensed assets, attribution is appreciated but not required:
```
Material-UI and Emotion libraries
Used under MIT License
```

## Recommendations

### Immediate Actions
1. **Remove unused template assets** to avoid unnecessary license tracking
2. **Verify Google Fonts usage** - confirm if "Luckiest Guy" is actually loaded
3. **Consider custom favicon** to replace default Vite favicon if needed

### Future Considerations
1. **Asset optimization** - Ensure only used assets are included in builds
2. **Custom iconography** - Consider custom icons for unique branding
3. **Asset documentation** - Update this document when new assets are added

## Asset Management Guidelines

### Adding New Assets
When adding new images, icons, fonts, or other assets:

1. **Document the source** and license in this file
2. **Verify license compatibility** with proprietary software
3. **Include attribution** if required by the license
4. **Store assets appropriately** (public vs src directories)

### License-Safe Asset Sources
- **Material Design Icons** - Apache 2.0 (via @mui/icons-material)
- **Google Fonts** - SIL OFL (loaded externally)
- **System fonts** - No licensing required
- **Self-created assets** - Full ownership and control

### Assets to Avoid
- **Copyrighted images** without proper licensing
- **Proprietary fonts** without commercial licenses
- **Stock photos** without appropriate licensing
- **Third-party logos** without permission

## Contact and Updates

For questions about asset licensing or to report licensing concerns:

**Project Owner:** LarisaRozin  
**Project:** DoDone Task Management Application

This document should be updated whenever new assets are added or existing assets are modified.

---

*Last updated: September 21, 2025*