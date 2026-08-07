# Rootwork v4

Personal execution system: Objective → Key Result → Task, lịch ngày/tuần và routine trong một PWA local-first.

**UI release:** v4.0 · 2026-08-07  
**Data schema:** v3 — tương thích dữ liệu Rootwork cũ.

## Có gì mới trong v4

- Dashboard mới bám mockup: Today progress, Next action, Objective pulse, Week pulse, Attention.
- Bottom navigation 5 tab: Tổng quan · Hôm nay · Mục tiêu · Thói quen · Cả tuần.
- Today view tách việc có giờ / linh hoạt / overdue + habit check.
- Objective view có filter và mặc định mở KR để outcome nổi hơn task.
- Routine view có weekly summary + trend 8 tuần từ chính routine log.
- Week view dùng day cards + backlog thay cho calendar 7 cột dày thông tin.
- Brand palette: Root Green / Graphite / Ivory và icon Rootwork dạng nhánh mềm.
- Fix data-loss edge case: restore KR sẽ không xoá entry khỏi Trash nếu Objective gốc không còn.

## File

| File | Vai trò |
|---|---|
| `index.html` | HTML + toàn bộ CSS |
| `app.js` | React UI, domain logic, local storage |
| `sw.js` | Service Worker / offline cache |
| `manifest.json` | PWA manifest |
| `rootwork-mark.svg` | Master vector logo mark |
| `icon-180.png` | iOS home screen |
| `icon-192.png` | PWA |
| `icon-256.png` | PWA |
| `icon-512.png` | PWA |
| `icon-maskable-512.png` | Android maskable icon |
| `icon-1024.png` | Master raster export |

React được load từ unpkg và cache sau lần mở đầu tiên. Không có build step.

## Deploy GitHub Pages

1. Backup dữ liệu hiện tại trong Rootwork: **Menu → Xuất bản sao lưu**.
2. Copy toàn bộ file trong folder này lên repo, thay file cũ.
3. Commit vào branch đang deploy GitHub Pages (`main` nếu repo đang dùng main).
4. Đảm bảo `sw.js` có cache version mới. Release này dùng:

```js
const CACHE = "rootwork-v4.0-2026-08-07";
```

5. Mở site khi có mạng. Nếu PWA đang cài trên điện thoại, đóng hẳn app rồi mở lại 1–2 lần để service worker mới activate.

### Nếu vẫn thấy UI cũ

Ưu tiên thử theo thứ tự:

1. Mở URL trực tiếp trong Safari/Chrome và refresh.
2. Đóng PWA hoàn toàn rồi mở lại.
3. Nếu service worker cũ vẫn bám cache: backup trước, xoá website data của domain rồi mở lại và Add to Home Screen.

## Data

Dữ liệu vẫn dùng key:

```text
rootwork:v1
```

và schema v3. Vì vậy update UI v4 **không yêu cầu migrate hay import lại** nếu deploy trên đúng domain/browser đang dùng.

Mô hình lõi:

```text
Objective
  └─ Key Result
      └─ Task

Loose Task / Backlog
Routine
Trash (30 ngày)
```

Task:

| Date | Time | Meaning |
|---|---|---|
| none | none | Backlog / chưa xếp |
| yes | none | Flexible trong ngày |
| yes | yes | Fixed-time task |

KR progress:

- Có metric → `current / target`
- Không metric → tỷ lệ task hoàn thành

Routine streak tiếp tục tính theo **số tuần liên tiếp đạt weekly target**, không dùng daily streak.

## Giới hạn hiện tại

- Local-only, một browser/device; chưa có cloud sync.
- Không notification hệ điều hành.
- Chưa có recurring task engine.
- Week planner chưa có drag & drop; thao tác vẫn qua task detail / quick add.

## Backup

Menu ở Dashboard → **Xuất bản sao lưu**. File JSON chứa dữ liệu cá nhân; không commit backup lên GitHub repo public.
