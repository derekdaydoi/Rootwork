# Rootwork

Công cụ cá nhân: OKR, lịch tuần và thói quen trong một chỗ. Chạy như web app,
cài vào màn hình chính, dữ liệu nằm trên máy — không server, không tài khoản.

**Phiên bản dữ liệu:** v3 · cập nhật 2026-07-25

---

## Cấu trúc

| File | Vai trò |
|---|---|
| `index.html` | Khung trang + toàn bộ CSS |
| `app.js` | Toàn bộ logic ứng dụng (React, không cần build) |
| `sw.js` | Service worker — cache offline, kiểm soát phiên bản |
| `manifest.json` | Khai báo PWA: tên, icon, chế độ standalone |
| `icon-192/256/512.png` | Icon dùng trong app |
| `icon-1024.png` | Icon độ phân giải cao, để dành khi cần |

React nạp từ unpkg và được service worker cache lại. **Lần mở đầu tiên sau mỗi
lần deploy cần có mạng**, sau đó chạy offline bình thường.

## Deploy

1. Commit file lên nhánh `main`.
2. **Đổi dòng `CACHE` trong `sw.js`** — ví dụ `rootwork-v3.2-2026-08-10`.
   Bỏ qua bước này thì máy đang cài sẽ giữ bản cũ mãi mãi.
3. Mở app khi có mạng, đóng hẳn, mở lại.

Nếu app không đổi sau khi deploy: service worker cũ đang giữ bản cũ.
**Xuất bản sao lưu trước**, rồi Safari → Cài đặt → xoá dữ liệu website cho
domain này → mở lại → Thêm vào màn hình chính → nạp lại bản sao lưu.

## Sao lưu

Menu ☰ → **Xuất bản sao lưu** ra tệp `.json`. Nạp lại bằng **Nạp bản sao lưu**.

Dữ liệu chỉ nằm trong `localStorage` của một trình duyệt trên một máy. App có
gọi `navigator.storage.persist()` để giảm rủi ro bị hệ điều hành dọn, nhưng đó
không phải bảo đảm. **Xuất định kỳ.** Không commit tệp sao lưu lên repo —
nó chứa toàn bộ nội dung cá nhân.

## Mô hình dữ liệu

```
Objective ─┬─ deadline, archived
           └─ Key Result ─┬─ metric { current, target, unit }  (tuỳ chọn)
                          └─ Task
Task độc lập  → mục "Phát sinh"
Routine       → target n lần/tuần, log theo ngày
Trash         → giữ 30 ngày rồi tự dọn
```

**Ngày và giờ của task quyết định loại việc:**

| Ngày | Giờ | Nghĩa |
|---|---|---|
| — | — | Nằm trong kho, chưa xếp lịch |
| có | — | Làm trong ngày đó, tự sắp xếp |
| có | có | Giờ cố định, lên đầu danh sách |

**Tiến độ Key Result:** có chỉ số thì tính theo `current / target`; không có
chỉ số thì tính theo tỷ lệ task đã xong.

**Chuỗi thói quen** đếm số **tuần liên tiếp** đạt đủ target, không đếm ngày
liên tiếp — vì target đặt theo tuần.

## Thao tác

| Thao tác | Kết quả |
|---|---|
| Chạm một việc | Mở chi tiết |
| Vuốt phải | Hoãn một ngày |
| Vuốt trái | Xoá (vào thùng rác 30 ngày) |
| Chạm tiêu đề Objective / KR | Sửa tại chỗ |
| `1` `2` `3` `4` | Mục tiêu · Hôm nay · Thói quen · Cả tuần |
| `N` | Thêm việc |
| `Esc` | Về màn hình chính |

## Giới hạn đã biết

- Một máy, một trình duyệt. Không đồng bộ giữa các thiết bị.
- Không thông báo nhắc việc.
- Không có việc lặp lại — phải tạo tay mỗi lần.
