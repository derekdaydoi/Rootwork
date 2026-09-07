# Rootwork product model

## Core model

Rootwork coi tuần là operating unit. Hai loại đối tượng người dùng trực tiếp quản lý là:

```text
Goal
└── Weekly task

Routine
└── repeated check-ins by date
```

Goal trả lời **tuần này cần tiến tới kết quả gì**. Weekly task trả lời **hành động cụ thể nào tạo ra tiến độ**. Routine trả lời **hành vi lặp lại nào cần giữ nhịp**. Routine không bị biến thành task để tránh trộn “việc phải hoàn thành” với “hành vi cần duy trì”.

## Primary surfaces

- Dashboard — execution snapshot + routine consistency.
- Goals — Goal → Weekly task trực tiếp.
- Calendar — square month grid trên cùng task/routine data.
- Routine — target/tuần, day check-ins, weekly consistency, streak.
- Progress — execution trend, goal progress, routine consistency.
- Add FAB — Goal / Weekly task / Routine.

## Architecture

`app.js` giữ state/mutations/bootstrap. `ui-core.js` chứa UI primitive dùng chung. `ui-views.js` chứa các screen. `domain.js` giữ business rules; `store.js` giữ persistence/migration/backup.

Schema hiện tại đã có `routines[]` với recurrence và date log, nên việc đưa Routine trở lại UI không cần migration mới và không làm mất dữ liệu cũ.

## Local-first

Không có server hoặc account dependency. Data ở browser localStorage và gắn với origin. Backup export là cơ chế portability chính thức.
