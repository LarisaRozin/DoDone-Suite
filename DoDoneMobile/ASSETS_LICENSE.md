# Assets License Documentation

This document provides licensing information for all fonts, icons, and other assets used in the DoDoneMobile application.

## Fonts

### Fredoka Font Family
- **Source**: [Google Fonts](https://fonts.google.com/specimen/Fredoka)
- **License**: SIL Open Font License (OFL)
- **Commercial Use**: ✅ Fully permitted
- **Attribution Required**: No (but recommended)
- **Files**:
  - `assets/fonts/Fredoka-Regular.ttf`
  - `assets/fonts/Fredoka-Medium.ttf`
  - `assets/fonts/Fredoka-SemiBold.ttf`
  - `assets/fonts/Fredoka-Bold.ttf`

#### License Details:
The Fredoka font is licensed under the SIL Open Font License, Version 1.1. This license allows:
- ✅ Free commercial use
- ✅ Modification and redistribution
- ✅ Embedding in applications
- ✅ Use in logos and branding
- ✅ Print and digital use

**Copyright**: © 2016-2021 The Fredoka Project Authors

**License Text**: Full OFL license available at [scripts.sil.org/OFL](https://scripts.sil.org/OFL)

## Icons

### Status Overview
All problematic PNG icons have been **successfully replaced** with React Native Vector Icons (MaterialCommunityIcons).

#### ✅ Replaced Icons (Now Using MaterialCommunityIcons - MIT License)

| Former PNG Icon | Replaced With | MaterialCommunityIcon Name | Usage |
|----------------|---------------|---------------------------|-------|
| ~~`copy.png`~~ | ✅ Vector Icon | `content-copy` | Rich text editor copy function |
| ~~`cut.png`~~ | ✅ Vector Icon | `content-cut` | Rich text editor cut function |
| ~~`paste.png`~~ | ✅ Vector Icon | `content-paste` | Rich text editor paste function |
| ~~`html.png`~~ | ✅ Vector Icon | `language-html5` | Rich text editor HTML function |
| ~~`html@2x.png`~~ | ✅ Removed | N/A | No longer needed (vector scales) |
| ~~`phiz.png`~~ | ✅ Vector Icon | `emoticon-happy` | Rich text editor emoji function |
| ~~`phiz@2x.png`~~ | ✅ Removed | N/A | No longer needed (vector scales) |
| ~~`phiz@3x.png`~~ | ✅ Removed | N/A | No longer needed (vector scales) |
| ~~`translate.png`~~ | ✅ Vector Icon | `translate` | Rich text editor translate function |

**All icons now use MaterialCommunityIcons from `react-native-vector-icons` package (MIT License)**

### Icon Implementation Details

```typescript
// TaskDetailsScreen.tsx - Icon components using MaterialCommunityIcons
const EmojiIcon = () => <MaterialCommunityIcons name="emoticon-happy" size={20} color="#000" />;
const HtmlIcon = () => <MaterialCommunityIcons name="language-html5" size={20} color="#000" />;
const CopyIcon = () => <MaterialCommunityIcons name="content-copy" size={20} color="#000" />;
const CutIcon = () => <MaterialCommunityIcons name="content-cut" size={20} color="#000" />;
const PasteIcon = () => <MaterialCommunityIcons name="content-paste" size={20} color="#000" />;
const TranslateIcon = () => <MaterialCommunityIcons name="translate" size={20} color="#000" />;
```

**License**: MaterialCommunityIcons are licensed under MIT License - fully commercial safe.

### Icon Analysis

#### Standard Operation Icons (copy, cut, paste)
These appear to be standard system operation icons. Possible sources:
- **System Icons**: May be derived from OS system icons
- **Icon Fonts**: Could be from Font Awesome, Material Icons, or similar
- **Free Icon Packs**: Possible sources include Feather, Heroicons, etc.

**Recommendation**: Since these are common UI patterns, consider replacing with icons from verified free sources like:
- Material Community Icons (already in your dependencies)
- React Native Vector Icons (already in your dependencies)
- Heroicons (MIT License)

#### File Type Icons (html.png, html@2x.png)
HTML file type icons are commonly available from:
- System file type icon sets
- Free icon libraries
- Web development icon packs

**Recommendation**: Replace with custom-designed file icons or use from verified free sources.

#### Avatar/Profile Icons (phiz.png, phiz@2x.png, phiz@3x.png)
The "phiz" (slang for face/physiognomy) icons appear to be profile/avatar placeholders.

**Recommendation**: These can easily be replaced with:
- Custom-designed avatar icons
- Icons from Material Community Icons
- Simple geometric shapes (circles, etc.)

#### Translation Icon (translate.png)
Language/translation icons are common in UI libraries.

**Recommendation**: Replace with verified free alternative from Material Icons or similar.

### ✅ Verified Commercial-Safe Assets
- **Fredoka Font Family**: SIL Open Font License - fully commercial safe
- **All Icons**: MaterialCommunityIcons (MIT License) - fully commercial safe

### ✅ Assets Fully Compliant
All assets in the project now use verified commercial-safe licenses:
- **Fonts**: Fredoka family from Google Fonts (SIL OFL)
- **Icons**: MaterialCommunityIcons from react-native-vector-icons (MIT License)

**No licensing concerns remain** - all assets are properly licensed for commercial use.

### Recommended Actions

#### Immediate (High Priority):
1. **Use Icon Verification Guide** to identify sources of existing icons
2. **Replace unknown icons** with verified free alternatives
3. **Document any found sources** and their licensing

#### Medium Priority:
1. **Audit usage** of each icon in the application
2. **Design consistency** review - ensure all icons match app style
3. **Create icon replacement plan** with timeline

#### Low Priority:
1. **Consider custom icon design** for unique branding
2. **Optimize icon file sizes** and formats
3. **Implement icon theming** for consistency

## Alternative Icon Sources (Verified Commercial-Safe)

### Free Commercial Use (No Attribution Required):
1. **React Native Vector Icons** (MIT License)
   - Already in your dependencies
   - Material Community Icons subset
   - FontAwesome subset
   - Ionicons subset

2. **Heroicons** (MIT License)
   - Modern, clean design
   - Available as React components
   - Outline and solid variants

3. **Feather Icons** (MIT License)
   - Minimal, consistent style
   - Open source
   - React Native compatible

4. **Material Design Icons** (Apache 2.0)
   - Google's icon set
   - Extensive collection
   - Multiple variants

### Free with Attribution:
1. **Flaticon** (Free tier requires attribution)
2. **Icons8** (Free tier requires attribution)

### Paid Commercial:
1. **Noun Project** (Various licensing options)
2. **Adobe Stock Icons** (Subscription based)

## Implementation Recommendations

### Replace Icons Strategy:

```typescript
// Example: Using React Native Vector Icons (already in dependencies)
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// Replace copy.png with:
<MaterialCommunityIcons name="content-copy" size={24} color="#000" />

// Replace cut.png with:
<MaterialCommunityIcons name="content-cut" size={24} color="#000" />

// Replace paste.png with:
<MaterialCommunityIcons name="content-paste" size={24} color="#000" />

// Replace translate.png with:
<MaterialCommunityIcons name="translate" size={24} color="#000" />

// Replace html.png with:
<MaterialCommunityIcons name="language-html5" size={24} color="#000" />

// Replace phiz.png with:
<MaterialCommunityIcons name="account-circle" size={24} color="#000" />
```

## Legal Compliance Checklist

- [ ] **Verify all icon sources** using reverse image search
- [ ] **Document findings** for each icon
- [ ] **Replace unclear icons** with verified free alternatives
- [ ] **Add attribution** where required by license
- [ ] **Update this documentation** with verified information
- [ ] **Legal review** if significant commercial usage

## License Compatibility Matrix

| License Type | Commercial Use | Attribution Required | Modification Allowed | Redistribution |
|-------------|----------------|---------------------|---------------------|----------------|
| SIL OFL (Fonts) | ✅ Yes | No | ✅ Yes | ✅ Yes |
| MIT | ✅ Yes | No* | ✅ Yes | ✅ Yes |
| Apache 2.0 | ✅ Yes | No* | ✅ Yes | ✅ Yes |
| CC-BY | ✅ Yes | ✅ Required | ✅ Yes | ✅ Yes |
| CC0 | ✅ Yes | No | ✅ Yes | ✅ Yes |

*MIT and Apache 2.0 require including the license text but not attribution in UI

## Contact Information

If you need help with icon licensing verification or have questions:
- **Technical**: Review the `ICON_VERIFICATION_GUIDE.md`
- **Legal**: Consider consulting an IP attorney for complex cases
- **Design**: Consider hiring a designer for custom icon creation

---

*This document should be updated as icon licensing is verified and assets are replaced.*

**Last Updated**: September 21, 2025  
**Next Review**: When icon verification is complete