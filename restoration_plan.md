# UX Restoration Plan

## 1. Persistent Input Bar (The "Soul" Fix)
- **Goal**: Remove the click friction. Input should be always visible at the bottom.
- **Action**:
    - Modify `MainLayout.vue` to use `<q-footer>` with `SmartInput.vue`.
    - Remove the Floating Action Button (FAB).
    - Ensure `SmartInput` styling works in a narrow footer context (remove max-width constraints).

## 2. Page Structure Separation
- **Goal**: Restore the "List" vs "Analysis" separation.
- **Action**:
    - **Created `ListPage.vue`**: Will contain *only* the Task List (Overdue/Today/Upcoming).
    - **Create `AnalyticsPage.vue`**: Will contain the Charts, Stats Cards, and Drill-down list.
    - **Refactor `DashboardPage.vue`**: Delete it or redirect it? Better to replace it with `ListPage.vue`.

## 3. Navigation Update
- Update `router/index.ts`:
    - `/` -> `ListPage.vue` (Label: "리스트")
    - `/analytics` -> `AnalyticsPage.vue` (Label: "분석")
    - `/calendar` -> (Keep)
    - `/history` -> (Keep or Deprecate if Analysis covers it, but keep for now)

## 4. Execution Order
1.  Create `AnalyticsPage.vue` (Move stats logic there).
2.  Create `ListPage.vue` (Move list logic there).
3.  Update `router/index.ts`.
4.  Update `MainLayout.vue` (Input & Menu).
