---
Task ID: 1
Agent: Main Agent
Task: Fix Plantas Interactivas bug - overlay data not saving or displaying on main page

Work Log:
- Investigated the complete data flow: FloorPlanEditor → POST /api/floor-plans → Supabase
- Identified 4 root causes:
  1. Editor sends data WITHOUT floorNumber (uses id: "piso-1"), POST handler checks for floor.floorNumber → Supabase update never called
  2. Vercel ephemeral filesystem - writes to floor-plans.json don't persist on serverless
  3. GET handler data format mismatch - Supabase rows mapped to wrong field names
  4. Missing /api/upload/route.ts for image uploads (404 errors)
  5. site_config table uses key/value columns (Supabase-Vercel integration), not section/data (our schema)
- Fixed getFloorPlans() to read from site_config table with key='floor_plans'
- Fixed POST /api/floor-plans to save via saveFloorPlansConfig() → updateSiteConfig()
- Fixed updateSiteConfig() to use fresh Supabase client per-request (bypass serverless caching)
- Fixed column name mapping: section→key, data→value for site_config table
- Added auto-save with debounce to FloorPlanEditor for apartment property edits
- Created /api/upload/route.ts with Supabase Storage support + base64 fallback
- Removed filesystem writes from site-config POST route (EROFS on Vercel)
- Seeded all 19 floors with 110 apartment overlays to Supabase site_config
- Verified: POST returns {"success":true}, GET returns all 19 floors with correct format

Stage Summary:
- Bug completely fixed and deployed to production
- Floor plan overlays now persist to Supabase and appear on main page
- Auto-save works with 1-second debounce
- Image upload route created (requires Supabase Storage bucket for production)
- All changes pushed to GitHub and auto-deployed to Vercel
