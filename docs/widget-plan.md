# Widget implementation plan

Reviewed all application modules, services, tools, shared HTTP/parser/session handling, bootstrap, widget configuration, and installed NitroStack build/runtime code. Baseline: 33e3c9e.

The backend already supplies structured data for seven domains; the widget app has no routes. Production NitroStack bundles page components directly, bypassing Next layouts, so runtime and styles must live in the shared page shell.

## Sequential delivery

1. Attendance and shared shell: full/low-attendance outputs, explicit academic term, threshold filtering, subject counts and details.
2. Timetable: weekly days, free periods, and date-specific output; explain that schedules are weekday-based.
3. Marks: assessment details and course search, preserve raw scores and unknown/zero maxima without inventing aggregate grades.
4. Leave: history with statuses, reasons, and exact portal date strings; filter statuses.
5. Gate passes: history plus request preview/result; keep explicit verbal confirmation in chat, never submit from the widget.
6. Calendar: full/upcoming output, search and chronological events with inclusive date ranges.
7. Session: authenticated/signed-out status with manual SSO guidance; no automatic login/logout.

Each step has a GitHub issue and a separate branch/PR. Build, type-check, run synthetic browser tests, inspect the diff, push and merge before beginning the next step. Each PR closes its issue.

## Common acceptance criteria

- Link existing tools using @Widget; preserve backend response and authentication behavior.
- Host SDK data updates, light/dark theme, accessible labeled controls, responsive layout.
- Distinguish waiting, missing data, malformed data, empty results, and session-expired/error results.
- Synthetic fixtures only in tests; no credentials, student data, portal calls, or real gate-pass requests.
- Verify production HTML bundles, not just Next development pages.

## Scope limits

No announcements widget: that module was closed without an implementation. No invented timetable clock times, term names, approval guarantees, or academic grading rules. Live host and portal integration require a manual authenticated smoke check after automated verification.
