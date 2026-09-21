# Rootwork Desktop Local

Desktop-first presentation layer cho Rootwork. Bản này **không fork business model**: nó dùng trực tiếp `domain.js`, `store.js`, `roadmap-model.js`, React UMD và brand assets ở root repository.

## Chạy local

Mở `desktop/index.html` từ repository. Dữ liệu được lưu bằng `localStorage` theo origin/path của browser. Vì hành vi `file://` có thể khác nhau giữa browser/profile, hãy dùng **Xuất backup** như cơ chế portability chính thức.

Nếu browser của bạn hạn chế persistence với `file://`, chạy một static server local ở root repository (ví dụ IDE Live Server) rồi mở `/desktop/`. Không cần backend và không cần account.

## Dữ liệu và compatibility

Desktop dùng cùng schema hiện tại của Rootwork (`rootwork:v1`, schema 5), nên backup JSON tương thích với PWA chính. UI có thêm importer cho bản local cũ `rootwork_single_local.html` / JSON v1.

Khi migrate v1, task có ngày nằm ngoài tuần hiện tại sẽ chuyển thành **Linh hoạt**. Lý do: Rootwork coi tuần là operating unit và Weekly task chỉ thuộc tuần đang thực thi. Routine log theo ngày được giữ lại.

## Brand

Runtime dùng trực tiếp `../brand/rootwork-mark.png`. `rootwork-icon.png` chỉ được dùng làm favicon/install icon, không được dùng trong UI. Không dựng lại logo bằng CSS, chữ `R`, SVG thay thế, blur, shadow hay glow.

## Keyboard

`1…6` chuyển tab. `N` tạo Weekly task. `G` tạo Goal. `R` tạo Routine. `Esc` đóng modal/menu.
