# Rootwork v4.4

Bản overwrite trực tiếp cho GitHub Pages.

## Thay đổi v4.4
- Header trang Tổng quan dùng **Rootwork brand lockup** (logo + ROOTWORK + tagline), bỏ `Chào mày / Hôm nay` khỏi đầu app.
- Ngày hiện tại và % hoàn thành hôm nay chuyển thành context line nhỏ bên dưới brand header.
- Thêm copyright cố định ở cuối nội dung: `© <năm> @derekdaydoi · Rootwork`.
- Giữ nguyên UI/UX, data schema và icon family của v4.3.
- Cache version: `rootwork-v4.4-2026-08-07`.

## Deploy
1. Backup dữ liệu Rootwork hiện tại.
2. Giải nén file ZIP.
3. Upload **toàn bộ file ở root ZIP** lên root GitHub repo và chọn Replace/Overwrite.
4. Commit + push.
5. Mở GitHub Pages bằng tab ẩn danh để kiểm tra.
6. Nếu PWA/homescreen còn cache bản cũ, xoá shortcut Rootwork khỏi Home Screen rồi Add to Home Screen lại.

## Data compatibility
- `STORAGE_KEY = rootwork:v1`
- `SCHEMA_VERSION = 3`

Không reset dữ liệu local hiện tại khi deploy trên cùng domain/browser.
