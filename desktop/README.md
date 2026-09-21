# Rootwork Desktop Local

Desktop-first presentation layer cho Rootwork. Bản này **không fork business model** và không copy lại logic ứng dụng: nó dùng trực tiếp `domain.js`, `store.js`, `roadmap-model.js`, toàn bộ production UI/runtime và brand assets ở root repository.

## Chạy local

Cách ổn định nhất là chạy một static server ở root repository rồi mở `/desktop/`:

```sh
python3 -m http.server 4173
```

Sau đó mở `http://localhost:4173/desktop/`.

Có thể mở trực tiếp `desktop/index.html`, nhưng persistence của `localStorage` trên `file://` khác nhau giữa browser/profile. Vì vậy backup JSON vẫn là cơ chế portability chính thức.

## Kiến trúc

Desktop chỉ thêm hai thứ:

- `desktop/index.html` — entry point dùng lại toàn bộ production runtime.
- `desktop/desktop.css` — desktop information architecture: sidebar trái, workspace rộng, Dashboard hai cột, Goal/Routine grid, calendar lớn và Roadmap canvas rộng.

Không có schema mới, không có database riêng và không có một bản business logic thứ hai để drift khỏi PWA.

## Brand

Runtime dùng trực tiếp `../brand/rootwork-mark.png`. `rootwork-icon.png` chỉ dùng cho favicon/install icon. Không dựng lại logo bằng CSS, chữ `R`, SVG thay thế, blur, shadow hay glow.

## Dữ liệu

Desktop dùng đúng `rootwork:v1` / schema hiện tại của Rootwork. Backup export/import của production app vẫn hoạt động. Bản `rootwork_single_local.html` cũ dùng một schema khác và không còn được xem là source of truth; nếu cần giữ dữ liệu cũ, migrate nó sang schema chính thay vì tiếp tục phát triển hai model song song.
