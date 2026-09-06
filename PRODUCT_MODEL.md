# Rootwork product model

## Core loop

Rootwork treats the week as the operating unit. The visible planning hierarchy is intentionally shallow:

```text
Goal
└── Weekly task
```

There is no visible Key Result layer. A task may be flexible, dated, or dated with a valid time in the persisted schema. Routines remain preserved in the data model for migration/backward compatibility but are not a primary navigation surface in this UI.

## Primary surfaces

- Dashboard — completion, execution pace, daily progress and goals in motion
- Weekly goals — goals with their weekly tasks directly underneath
- Calendar — square monthly grid plus selected-day task list
- Progress — weekly execution trend and progress by goal
- Add — direct creation of a goal or weekly task

## Architecture

`app.js` owns rendering and interaction. `domain.js` owns dates, weekly lifecycle, metrics, XP and domain rules. `store.js` owns persistence, migration and backups. Existing schema guards and migration behavior are kept intact so older local data is not discarded.

## Local-first behavior

Rootwork has no server or account dependency. Data is stored in browser localStorage and is origin-specific. Backup export remains the explicit portability mechanism.

## UI rules

The final interface is light-only. Open Sans is the primary UI typeface with system fallbacks. Navigation symbols use inline UI SVG paths for crisp controls, while the brand itself uses only the canonical raster asset `brand/rootwork-logo.png`.

The launch sequence is not onboarding. It is a short brand transition on app open and requires no user action.