# Rootwork — brand spec

Tài liệu ràng buộc để Rootwork và Rootflow đọc như hai app của cùng một studio.
Mọi giá trị dưới đây đã nằm trong code; đây là bản giải thích, không phải đề xuất.

## 1. Palette — đã khớp 1:1 với Rootflow v3.5

Khai báo một lần duy nhất ở `:root` trong `index.html`. Không rule nào bên dưới
được hardcode màu.

| Token | Giá trị | Dùng cho |
|---|---|---|
| `--bg` | `#F3F0E7` | Nền app, `theme_color`, `background_color` |
| `--surface` | `#FFFDF9` | Mặt thẻ |
| `--surface-2` | `#F7F5EF` | Mặt thẻ chìm, trạng thái hover |
| `--surface-3` | `#EFECE3` | Rãnh, nền bị lõm |
| `--ink` | `#101110` | Chữ chính |
| `--muted` | `#5B5F5A` | Chữ phụ |
| `--subtle` | `#858981` | Nhãn nhỏ, tagline |
| `--line` | `#E3E1D8` | Viền thường |
| `--line-strong` | `#C9C6BB` | Viền input, nút |
| `--brand` | `#14614A` | Màu thương hiệu duy nhất |
| `--brand-strong` | `#0E4A38` | Trạng thái nhấn |
| `--brand-soft` | `#E2EEE8` | Nền nhạt màu brand |
| `--danger` | `#9A352B` | Quá hạn, xoá |
| `--warning` | `#8A641D` | Cần chú ý |

**Một màu xanh duy nhất: `#14614A`.** Không thêm biến thể xanh, không gradient
xanh, ở bất kỳ đâu — mark, header, nút, hay biểu đồ.

## 2. Typography

| Vai | Font | Dùng ở |
|---|---|---|
| Display | Manrope 800 | Wordmark, `.screen-title`, `.sheet-title`, số liệu lớn, `%` |
| UI | System stack | Mọi chữ vận hành còn lại |

Manrope là tuỳ chọn: mất mạng thì rơi về Avenir Next rồi system, không ảnh hưởng
bố cục. Đây đúng cách Rootflow phân vai — thương hiệu ở ngoài, hệ điều hành
bình thản ở trong.

## 3. Mark — ràng buộc bắt buộc khi thay bản cuối

`brand/rootwork-mark.svg` là chữ W trắng trên nền brand. Mọi lần sửa mark về sau
phải giữ nguyên năm điều dưới đây — đây mới là thứ tạo ra tín hiệu family,
không phải màu:

1. **Nền phủ kín canvas**, `#14614A` đặc. Không gradient, không nền kem.
2. **`viewBox="0 0 1000 1000"`, `rect rx="220"`.** Cùng tỉ lệ bo với Rootflow.
3. **Hình vẽ bằng nét trắng `#FFFFFF`**, `stroke-width` 74, `stroke-linecap` và
   `stroke-linejoin` đều `round`. Nét, không phải mảng đặc.
4. **Toàn bộ hình nằm trong HÌNH TRÒN tâm (500,500) bán kính 400.** Android
   crop tròn, không crop vuông — nên khung vuông 200–800 là SAI: bốn góc của
   nó cách tâm 424px, tức nằm ngoài vùng sống. Thực dụng: giữ nét trong
   khoảng 230–770 và bo hình lại ở các góc.
5. **Chủ đề: rễ / nhánh phân tầng**, có một chấm neo đặc như Rootflow có chấm
   root. Cùng ngữ pháp, khác từ vựng: Rootflow là dòng chảy, Rootwork là bộ rễ.

Ba trục tuyệt đối không được làm ngược Rootflow:
figure/ground (hình xanh trên nền kem), kỹ thuật (fill thay vì stroke), nền
(radial gradient thay vì màu đặc).

### Prompt gợi ý cho ChatGPT

> Design an app icon as a single SVG, viewBox 0 0 1000 1000. Background: a
> `rect` with `rx="220"` filled solid `#14614A`, covering the full canvas.
> Foreground: a branching root system with a solid anchor dot, drawn only as
> white (`#FFFFFF`) strokes —
> `fill="none"`, `stroke-width="74"`, `stroke-linecap="round"`,
> `stroke-linejoin="round"` — plus one solid white anchor dot. No gradients, no
> filled shapes, no text. Keep every drawn element inside the central 20%–80%
> of the canvas so it survives a circular mask. 3–5 strokes maximum; the icon
> must stay legible at 48px. Every drawn element must fit inside a circle
> centred at (500,500) with radius 400 — anything outside is cropped away on
> Android.

## 4. Khi sửa mark

1. Ghi đè `brand/rootwork-mark.svg`.
2. Xuất bản PNG 1024×1024 thành `brand/rootwork-mark-1024.png`.
3. `python make_icons.py` — sinh lại `icon-180/192/256/512/1024.png`.
4. Đổi `CACHE` trong `sw.js` sang ngày deploy, nếu không Home Screen vẫn giữ
   icon cũ.

Mark hiện tại: chữ W một nét, `stroke-width` 96, đỉnh
(240,318) (409,682) (500,435) (591,682) (760,318), chấm neo tại (500,818) r=49.
Mép xa tâm nhất 367/400 — còn dư chỗ, nhưng đừng phóng thêm quá 1,08× nữa.

## 5. Wordmark

Hiện dựng bằng chữ, không phải asset: `ROOT` màu `--ink`, `WORK` màu `--brand`,
Manrope 800, letter-spacing `-1.55px`. Cùng công thức với `ROOT`/`FLOW` của
Rootflow. Nếu sau này cần wordmark SVG để lên store, dựng từ đúng thông số này.

Tagline: `BUILD STRONG FOUNDATIONS.` — 8.4px, weight 750, letter-spacing 1.7px,
màu `--subtle`. Song song với `SEE WHAT COMES NEXT.` của Rootflow.
