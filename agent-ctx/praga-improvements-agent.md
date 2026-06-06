# PRAGA Living Improvements - Work Summary

## Task ID: praga-improvements

## Changes Made

### Task 1: "Abrir Sitio" Button in Admin Top Bar
**File:** `src/components/praga/AdminPanel.tsx`
- Added `ExternalLink` icon import from `lucide-react`
- Added an `<a>` element with `href="/"`, `target="_blank"`, and `rel="noopener noreferrer"` before the "Actualizar" button
- Styled consistently with other top bar buttons (same text size, tracking, color, hover)
- Includes the `ExternalLink` icon (w-3 h-3) inline with the text "Abrir Sitio"

### Task 2: SEO & Social Section in SiteConfigEditor
**File:** `src/components/praga/SiteConfigEditor.tsx`
- Added `'seo'` to the `SectionKey` type union
- Added `{ id: 'seo', label: 'SEO & Social' }` to `configuracionTabs` array
- Added `SeoEditor` function component with fields:
  - Meta Title (TextField)
  - Meta Description (TextField, multiline)
  - OG Image (ImageField with upload)
  - Social media links section (Instagram, Facebook, LinkedIn - all TextField)
- Added rendering condition `{activeSubTab === 'seo' && <SeoEditor ... />}` in the main component

**File:** `src/data/site-config.json`
- Added `seo` section with default values:
  - `metaTitle`: "PRAGA Living | Residencias Premium en Caldas, Antioquia"
  - `metaDescription`: "Residencias premium con diseño biophilic en Caldas, Antioquia..."
  - `ogImage`: "/images/renders/hero-day.jpg"
  - `instagram`: "https://instagram.com/pragaliving"
  - `facebook`: "https://facebook.com/pragaliving"
  - `linkedin`: ""

### Task 3: Page Metadata Reads from site-config
**File:** `src/app/layout.tsx`
- Added `fs` and `path` imports for reading config file server-side
- Reads `src/data/site-config.json` at build time with try/catch fallback
- Extracts `seoConfig` from the parsed JSON
- Updated `metadata` export to use `seoConfig.metaTitle` (with fallback) for both `title` and `openGraph.title`
- Updated `description` and `openGraph.description` to use `seoConfig.metaDescription` (with fallback)
- Added `openGraph.images` conditionally from `seoConfig.ogImage`

## Verification
- ESLint passes with no errors
- Dev server compiles and serves pages correctly
- All existing functionality preserved
