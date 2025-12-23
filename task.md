# List Page Restoration Task List

- [x] Update `taskStore.ts` to compute detailed task lists <!-- id: 0 -->
    - [x] `overdueTasks`: Active tasks before today <!-- id: 1 -->
    - [x] `todayTasks`: Active tasks for today <!-- id: 2 -->
    - [x] `upcomingTasks`: Active tasks after today <!-- id: 3 -->
- [x] Refactor `ListPage.vue` UI <!-- id: 4 -->
    - [x] Implement Sticky Header (Search + Toggle) <!-- id: 5 -->
    - [x] Implement "Overdue" Section (Red) <!-- id: 6 -->
    - [x] Implement "Today" Section (Blue) <!-- id: 7 -->
    - [x] Implement "Upcoming" Section (Gray) <!-- id: 8 -->
    - [x] Implement "Completed" Section (Toggleable) <!-- id: 9 -->
- [x] Restore Core UX Details <!-- id: 11 -->
    - [x] Reorder Navigation Menu (List -> Calendar -> Analytics) <!-- id: 12 -->
    - [x] Implement Strict Overdue Logic (Time-based, inclusive of Visit) <!-- id: 13 -->
    - [x] Restore Calendar Badges (Absence/Re-call counts) <!-- id: 14 -->
- [x] Investigate Calendar Feedback (Absence/Recall) <!-- id: 15 -->
    - [x] Resolved "Ghost String" Data Corruption (Reset to `sf_tasks_v5`) <!-- id: 16 -->
    - [x] Fix Badge reactivity in `CalendarPage.vue` <!-- id: 17 -->
- [x] Verify UI matches `백업9.html` visually and functionally <!-- id: 10 -->
- [x] Restore Backup/Restore Functionality <!-- id: 18 -->
    - [x] Implement `exportData` and `importData` in `taskStore` <!-- id: 19 -->
    - [x] Connect `MainLayout.vue` buttons to store actions <!-- id: 20 -->
    - [x] Verify Import/Export flow <!-- id: 21 -->

# Analytics & Search Enhancements
- [x] Part A: Interactive Analytics <!-- id: 22 -->
    - [x] Import `SmartResultModal` in `AnalyticsPage.vue` <!-- id: 23 -->
    - [x] Make drill-down list items clickable to open modal <!-- id: 24 -->
- [x] Part B: Date Range Filters <!-- id: 25 -->
    - [x] Add Time Range Filter UI (Today/Week/All) in `AnalyticsPage.vue` <!-- id: 26 -->
    - [x] Update `stats` and `drillDownLogs` to support time filtering <!-- id: 27 -->
- [x] Part C: Deep Search <!-- id: 28 -->
    - [x] Update `ListPage.vue` search logic to include history notes and result text <!-- id: 29 -->

# Analytics Refinement
- [x] Implement Inline Timeline in Analytics <!-- id: 30 -->
    - [x] Update `AnalyticsPage.vue` to fetch full task history for drill-down items <!-- id: 31 -->
    - [x] Replace simple list with `q-expansion-item` <!-- id: 32 -->
    - [x] Visualize history timeline and full memos in body <!-- id: 33 -->

# Phase 2: Backend Integration <!-- id: 34 -->
- [x] Configure Environment & Client <!-- id: 35 -->
    - [x] Create `.env` file <!-- id: 36 -->
    - [x] Create `src/supabase.ts` <!-- id: 37 -->
- [x] Implement Authentication <!-- id: 38 -->
    - [x] Create `LoginPage.vue` <!-- id: 39 -->
    - [x] Update `router/routes.ts` with Auth Guard <!-- id: 40 -->
- [x] Refactor Store for Cloud Sync <!-- id: 41 -->
    - [x] Update `loadTasks` to fetch from Supabase <!-- id: 42 -->
    - [x] Update `addTask`, `updateTask`, `deleteTask` to sync with Supabase <!-- id: 43 -->

# Phase 3: Deployment <!-- id: 44 -->
- [x] Prepare Codebase <!-- id: 45 -->
    - [x] `git add .` and `git commit` <!-- id: 46 -->
    - [x] Create `vercel.json` (optional, for rewrites if needed) <!-- id: 47 -->
- [ ] Deploy to Vercel <!-- id: 48 -->
    - [x] `git push -u origin main` (User Action - Authentication Required) <!-- id: 49 -->
    - [x] Import in Vercel & Set Env Vars <!-- id: 50 -->
- [ ] PWA Conversion (Bonus) <!-- id: 51 -->
    - [ ] Configure `vite-plugin-pwa` <!-- id: 52 -->
    - [ ] Add Manifest & Icons <!-- id: 53 -->
