# Rootwork

Rootwork là ứng dụng local-first cho thực thi theo tuần. Cấu trúc lập kế hoạch được giữ nông và rõ:

```text
Goal → Weekly task
Routine → repeated weekly behavior
```

## Bề mặt chính

- **Dashboard** — tỷ lệ hoàn thành tuần, khả năng hoàn thành, tiến độ theo ngày và consistency của Routine.
- **Mục tiêu** — mục tiêu đi thẳng xuống tác vụ tuần, không có tầng Key Result ở UI.
- **Lịch** — calendar tháng dạng ô vuông, hiển thị tác vụ có ngày và trạng thái Routine theo ngày.
- **Routine** — target số lần/tuần, check-in từng ngày, weekly consistency và streak.
- **Thống kê** — tiến độ theo tuần, mục tiêu và Routine.
- **FAB Thêm** — tạo Goal, Weekly task hoặc Routine mà không chiếm thêm một tab navigation.

## Runtime

- `index.html` — light-only PWA shell và splash frame đầu tiên.
- `ui-core.js` — UI primitives, icons, helpers và component dùng chung.
- `ui-views.js` — Dashboard, Goals, Calendar, Routine, Progress và navigation.
- `app.js` — state, mutations, modal và bootstrap React.
- `domain.js` — date/week lifecycle, target/routine metrics, XP và business rules.
- `store.js` — localStorage, schema migration và backup.
- `styles.css` — Open Sans, visual system, responsive layout và launch motion.
- `sw.js` — offline application shell.
- `brand/rootwork-logo.png` — asset raster brand duy nhất ở runtime.

Không có account, server, analytics hay tracking. Dữ liệu nằm trong localStorage của origin hiện tại. Trước khi xoá browser data hoặc đổi domain, hãy export backup.

## Brand & launch

Rootwork dùng đúng một raster logo. Splash render `<img>` thật ngay từ frame đầu, chạy scale/fade + halo nhẹ, sau đó đi thẳng vào app. Wordmark `Rootwork` là text Open Sans 800 để luôn sắc nét ở mọi mật độ màn hình. Theme chỉ có light mode.

## Run & test

```sh
python -m http.server 4173
node tests/run-tests.js
```
