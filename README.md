# Rootwork V2

Rootwork is a local-first real-life progression system. The user chooses what
to move this week, defines the actions that create movement, schedules only the
actions that benefit from a day or time, maintains routines, and closes the
week with a permanent campaign record.

**Game mechanics underneath. Premium productivity interface on top.**

There is no server, account, analytics, or tracking. Data lives in this
browser's localStorage.

The interface supports complete English and Vietnamese modes. The language
preference is stored separately from campaign data, so switching languages
does not alter weekly records or backup compatibility.

## Product structure

~~~text
WEEK
├── TARGET
│   ├── ACTION
│   └── ACTION
├── TARGET
│   └── ACTION
├── LOOSE ACTION
└── ROUTINE RESULTS
~~~

The week—not a limitless task database—is the operating unit. Completed weeks
are read-only in Archive. Calendar is a view over the same actions shown in the
tree, and an action remains valid with no date or time.

The weekly start journey is:

~~~text
Greeting → Review carried targets → Previous-week recap → Blank-week builder → Current campaign
~~~

On a fresh week with no carried targets, the greeting leads to a focused
builder state rather than an empty dashboard. The dashboard appears only after
the user creates a target or action.

## Code boundaries

~~~text
index.html     PWA shell
styles.css    mobile-first visual system and motion
assets/       generated raster artwork used by the weekly-start and progress UI
app.js         React UI and interaction only
domain.js      pure dates, weekly lifecycle, metrics, XP, and level rules
store.js       localStorage, schema migration, cleanup, and backup
sw.js          offline application shell
manifest.json  install metadata
vendor/        local React 18.3.1 UMD runtime
~~~

The boundary is deliberate: scoring and weekly calculations do not belong in
app.js; DOM and storage do not belong in domain.js; business rules do not
belong in store.js.

See [PRODUCT_MODEL.md](PRODUCT_MODEL.md) for the audit, lifecycle, schema, and
migration rationale.

## Data and migration

- STORAGE_KEY remains rootwork:v1 so existing installations are found.
- SCHEMA_VERSION is 5.
- Existing migrations still run sequentially from v1 through v4 before v5.
- Active Objectives become current-week Targets.
- Tasks across Key Results flatten into Actions under their target.
- Archived Objectives, original KRs, metrics, loose work, and deleted data are
  retained in legacyArchive for backup integrity.
- Completed V1 work outside the current calendar week is not injected into the
  new campaign or awarded XP.
- Data from a schema newer than the running app is rejected before cleanup or
  save can overwrite it.
- The existing rootwork-backup format remains valid; old backups migrate on
  import and v5 backups contain the full new schema.

V1 cannot provide authentic weekly history because it never stored Week
snapshots. Rootwork therefore does not fabricate old weeks or progression.

## XP and levels

Rules live only in domain.js:

| Event | XP |
|---|---:|
| Complete a normal action | 20 |
| Complete a high-priority action | 30 |
| Complete every action under a non-empty target | 40 |
| Routine check, capped at the weekly commitment | 5 |
| Reach a routine's weekly commitment | 20 |
| Close a 3+ action week at 50%+ | 50 |
| Additional close bonus at 80%+ | 50 |

Unchecking current-week work removes provisional XP. Once a week is closed,
its recap and XP are frozen. The gap to the next level is
500 × current level. Levels are grouped into six long-term stages: Beginning,
Rooted, Momentum, Established, Mastery, and Enduring. Stage labels do not alter
XP; they make long-term progress easier to read.

The weekly-start background is a real photograph by
[Lennart Rudolph](https://unsplash.com/photos/mountain-valley-landscape-at-sunrise-with-soft-pastel-sky-8rLobnurnXA),
used under the Unsplash License.

## Run locally

Serve the repository over HTTP; service workers do not run correctly from a
file URL.

~~~sh
python -m http.server 4173
~~~

Open http://127.0.0.1:4173/.

## Tests

~~~sh
node tests/run-tests.js
~~~

The suite covers date/week boundaries, scheduled and unscheduled completion,
XP caps and bonuses, level thresholds, rollover immutability, carry-forward
behavior, v4 migration, newer-schema guards, the date/time invariant, and
language-preference persistence.

The mobile QA pass also verifies:

- 390 px rendering without horizontal overflow;
- complete English/Vietnamese switching and persistence;
- greeting, target review, tree, calendar, routine, recap, and Archive states;
- action completion in the tree;
- backup export format;
- PWA manifest;
- reload while offline after initial load;
- no browser console or page errors.

## Deploy

Upload the repository root to any static HTTPS host such as GitHub Pages.
Keep vendor/, brand/, icons, and styles.css in place. sw.js caches the complete
local application shell.

Before changing domains or clearing browser data, export a backup from
**Settings & data**. localStorage is origin-specific and does not follow a
deployment automatically.
