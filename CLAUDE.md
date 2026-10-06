# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A single-file IT PMO Kanban demo app for a fictitious bank: `index.html` (markup, `<style>`, `<script>` all inline). There is no build, lint, or test tooling. To run it, open the file in a browser (double-click works; no server).

## Hard constraints (from the original brief)

- Vanilla HTML/CSS/JS only: no frameworks, bundlers, npm, CDN scripts, web fonts, or image files. Use system fonts and inline SVG/Unicode.
- No persistence of any kind (no localStorage, sessionStorage, IndexedDB, cookies). Refresh must reset to seed data.
- Backend is FormSubmit's AJAX endpoint only (`FORMSUBMIT_ENDPOINT`, top of the script). Never send the email address anywhere else.
- Do not use real UOB logos or branding; the header is a neutral "IT PMO" wordmark. The `UOB-ITPM-####` ID prefix and `[UOB IT PMO]` email subject are required by the brief.
- CSS: custom properties for palette/spacing, no `!important`. No `alert()`/`confirm()`; use inline UI and toasts.

## Architecture

All behaviour hangs off one `state` object (`tasks`, `filters`, `nextId`, plus UI fields `confirmDeleteId` and `focusKey`). The flow is always: mutate `state` → `renderBoard()`.

- `renderBoard()` rebuilds every column and card via `innerHTML` (and calls `renderSummary()`); it is the only place card DOM is built. Do not mutate card DOM elsewhere. Every user-supplied string must go through `escapeHtml()`.
- Inline "Delete? Yes/No" is state-driven (`state.confirmDeleteId`), not DOM-driven. Because re-rendering destroys elements, `state.focusKey` + `data-focus` attributes restore keyboard focus after a render; set `focusKey` before calling `renderBoard()` when focus should survive.
- Card interactions use event delegation on `#board` (`data-action` / `data-id` attributes for move select and delete buttons; native HTML5 DnD in `setupDragAndDrop()`). Both DnD and the "Move ▸" select end in `moveTask()`.
- Add Task flow (`handleSubmit`): validate → `addTask()` (optimistic, card appears immediately) → `notifyNewTask()` in parallel inside try/catch. Failure only shows a warning toast and must never break the board. The submit button is disabled with "Sending…" until the request settles, then the dialog closes.
- Dates are handled as local `YYYY-MM-DD` strings (`toIsoDate`, not `toISOString`) so overdue/"not in the past" comparisons are plain string compares. Seed due dates are offsets from today, so overdue demo cards stay overdue.
- Fixed lists (`STATUSES`, `PROJECTS`, `CATEGORIES`, `PRIORITIES`) drive both the form/filter selects and validation; add new values there only.

## Testing note

`FORMSUBMIT_ENDPOINT` ships with a placeholder address, so the notification call fails by design until it is swapped and activated (first submission triggers a confirmation email). Expect the "email notification failed" warning toast in local testing.

## v2 (`v2/index.html`)

A separate single-file redesign, deployed to `/v2/` by CI; the root `index.html` (v1) must stay untouched. Same constraints and architecture as above, except `renderBoard()` also calls `renderDashboard()` (KPI tiles, SVG timeline, donut and bars, all derived from the filtered tasks). v2 ships a CSP `<meta>` (CI fails if it is removed), so any new external origin must be added there deliberately. User text goes through `cleanText()` then `escapeHtml()`.

Project skills in `.claude/skills/` (frontend-design, ui-ux-pro-max, cybersecurity-analyst) carry project-specific sections; use them for design and security reviews.
