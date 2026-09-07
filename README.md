# Rootwork

Rootwork là PWA local-first để biến mục tiêu thành tác vụ tuần, duy trì routine và theo dõi khả năng hoàn thành bằng dashboard, calendar và thống kê.

## Cấu trúc sản phẩm

- Dashboard — theo dõi tiến độ tuần, rủi ro và routine consistency
- Mục tiêu — đi thẳng từ mục tiêu xuống tác vụ tuần
- Lịch — calendar tháng dạng ô vuông, theo dõi task và routine theo ngày
- Routine — target theo tuần, check-in từng ngày, consistency và streak
- Thống kê — KPI hoàn thành, routine và tiến độ theo mục tiêu
- FAB `+` — thêm Mục tiêu / Tác vụ tuần / Routine

## Kiến trúc

- `domain.js` — business/domain logic
- `store.js` — local persistence, migration, backup
- `ui-core.js` — primitive UI và shared helpers
- `ui-views.js` — các màn hình chính
- `app.js` — app state, modal flow và mutations
- `styles.css` — layout/component base
- `brand-theme.css` — brand palette và launch treatment
- `sw.js` — PWA/offline cache

## Brand assets

Rootwork tách rõ runtime mark và install icon:

- `brand/rootwork-mark.png` — nền trong suốt, chỉ dùng trong UI/splash
- `brand/rootwork-icon.png` — nền `#AFE2FF`, chỉ dùng cho favicon/homescreen/PWA install

Không dùng homescreen icon trong UI runtime.

## Theme

Light-only. Font chính: Open Sans. Màu chủ đạo: Indigo `#1800AD` và Light Blue `#AFE2FF`.

## Dữ liệu

Rootwork là local-first: dữ liệu được lưu trong browser storage. Hãy export backup trước khi xoá dữ liệu trình duyệt hoặc đổi domain.

## Copyright

© 2026 Rootwork / @derekdaydoi. Xem `NOTICE.md` và `BRAND_SPEC.md`.
