# Implementation Plan: Restoring Legacy UX Details

## Goal
Address user feedback regarding Menu Order, Calendar Badges (Absence/Re-call counts), and "Today's Overdue" logic.

## Analysis
1.  **Menu Order**: Legacy was [List, Calendar, Analytics]. SaaS is [Home(List), Analytics, Calendar]. Need to reorder.
2.  **Calendar Badges**: `CalendarPage.vue` currently only shows the task content. `백업9.html` iterates through `task.history` to count 'absence' (부재) and 'callback' (재통화) events, displaying them as badges. This visual feedback is critical for the "Sales" context.
3.  **Overdue Logic**: `백업9.html` treats **any task with a due date in the past relative to NOW** as overdue.
    *   Legacy: `d < now` (Includes today 10 AM if now is 3 PM).
    *   Current SaaS: `d < todayStart` (Only yesterday and before).
    *   **Result**: Users miss "Today's Missed Calls" in the Red section.

## Proposed Changes

### 1. Reorder Navigation Menu
**File**: `src/layouts/MainLayout.vue`
*   Change `linksList` order to:
    1.  List (Home)
    2.  Calendar
    3.  Analytics

### 2. Restore Calendar Badges
**File**: `src/pages/CalendarPage.vue`
*   Add a helper function `countType(task, type)` similar to legacy.
*   Update the task card template to render badges:
    *   Refactor the task display loop to include these badges below the content.
    *   Use the same colors (Yellow for Absence, Orange for Re-call).

### 3. Update Overdue Logic
**File**: `src/stores/taskStore.ts`
*   Modify `overdueTasks` getter:
    *   Change logic from `isBefore(todayStart)` to `isBefore(now)`.
*   Modify `todayTasks` getter:
    *   Ensure it doesn't double-count overdue items. It should probably show "Remaining Today tasks" (future relative to now).
    *   *Correction*: Legacy actually keeps "Today Future" in Today. "Today Past" is Overdue.
    *   Legacy Logic:
        *   Overdue: `d < now`
        *   Today: `isToday(d) && d >= now`
        *   Upcoming: `d > now && !isToday(d)` (Essentially tomorrow+)

## Verification Plan
*   **Menu**: Visual check.
*   **Calendar**: Add a history item (Absence) to a task and verify badge appears on Calendar.
*   **Overdue**: Create a task for 1 hour ago. Verify it moves from "Today" section to "Overdue" section immediately (or on refresh).
