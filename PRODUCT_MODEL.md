# Rootwork V2 product model

## Audit summary

Rootwork V1 is a static React 18 UMD PWA. It has no build step, account,
server, analytics, or network dependency after the first successful load.
The strongest part of the codebase is its three-layer boundary:

- `app.js` owns rendering and interaction;
- `domain.js` owns date, progress, routine, weekly, and scoring rules;
- `store.js` owns local persistence, schema migration, and backups.

The reusable foundations are local-first persistence, explicit sequential
migrations, import guards, optional date/time scheduling, Monday-based week
helpers, routine logs, soft-delete data, local React assets, and cache-first
PWA behavior.

The obsolete product structure is the visible Objective → Key Result → Task
hierarchy, the generic dashboard-first home, duplicate Today/Week planning
surfaces, and the post-render UI patch layer. V1 has weekly metrics, but it has
no durable Week entity; moving between dates only filters a single live task
database. That is the main migration risk because genuine past-week snapshots
cannot be reconstructed from V1 data.

## Weekly lifecycle

1. Opening a calendar week finalizes any older active week.
2. Rootwork creates one current campaign for the current Monday–Sunday range.
3. The user sees a sparse greeting.
4. Carried or imported targets can be kept, edited, removed, or supplemented.
5. If a previous week exists, its progression tree and recap are shown.
6. The campaign becomes active and drives Home, Tree, and Calendar.
7. At the next rollover, tasks, routine results, completion, XP, and target
   outcomes are snapshotted. Completed weeks are read-only in Archive.

Targets carry forward as candidates, not obligations. Only incomplete actions
carry with them, and old dates/times are cleared. A user can discard or edit
the candidates before starting the campaign.

## Schema v5

```text
RootworkData
├── profile { name }
├── progress { baseXp }
├── weeks[]
│   └── Week
│       ├── id, startDate, endDate, status, phase
│       ├── targets[]
│       │   └── Target { id, title, description, status, tasks[] }
│       ├── looseTasks[]
│       └── recap { completion, xpEarned, target/routine outcomes }
├── routines[]
│   └── Routine { id, name, recurrence, log }
├── trash[]
├── legacyArchive
└── meta
```

A task may have neither date nor time, a date only, or a date and time. Time is
invalid without a date. Routine definitions are reusable; week recap data
stores the historical result so later edits to a routine do not rewrite the
past.

## Migration from v1–v4

- Existing migration steps still run in order before v5 conversion.
- Every active Objective becomes a target in the current week.
- Tasks from all of its Key Results are flattened under that target.
- Completed V1 tasks outside the current calendar week remain in the preserved
  legacy hierarchy instead of creating current-week completion or XP.
- KR names and metric data remain in `legacyArchive` with the original cleaned
  hierarchy so backup/export does not discard them.
- Loose tasks remain loose weekly actions.
- Routine definitions and all valid dated logs are retained.
- Existing deleted data is retained in the legacy archive.
- Archived objectives are not injected into the current campaign, but remain
  in the legacy archive.
- No fake completed weeks, completion history, levels, or XP are inferred.
- Data with a schema newer than the running app is rejected before cleanup or
  save can overwrite it.

## XP and levels

XP is earned only from recorded execution:

- completed normal action: 20 XP;
- completed high-priority action: 30 XP;
- target with at least one action and all actions complete: 40 XP;
- routine check, capped at that routine's weekly commitment: 5 XP;
- routine weekly commitment reached: 20 XP;
- closing a week at 50%+ with at least three actions: 50 XP;
- additional closing bonus at 80%+: 50 XP.

The formula is centralized in `domain.js`. Unchecking an action before the
week closes removes its provisional XP. Completed-week XP is frozen in its
recap. Levels use increasing thresholds: the gap to the next level is
`500 × current level`; level 1 begins at 0 XP. Level stages add readable
long-term chapters without changing the XP curve: Beginning (1–4), Rooted
(5–9), Momentum (10–19), Established (20–34), Mastery (35–49), and Enduring
(50+).

## Navigation and screen states

The primary mobile navigation is Home, Tree, Create, Calendar, and Routine.
Progress, Archive, and Settings/Data are secondary. The compact Level indicator
opens Progress; it reports only recorded XP and completed-week outcomes. Home answers the current-campaign
questions; Tree is the primary target/action planning surface; Calendar is a
weekly agenda over the same tasks; Routine is independent. Greeting, target
review, and recap temporarily replace primary navigation at weekly start.
