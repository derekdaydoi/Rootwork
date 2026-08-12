# Rootwork

Personal execution system cho mục tiêu, công việc, lịch tuần và thói quen.
PWA local-first: không server, không tài khoản, không tracking. Dữ liệu nằm
trong `localStorage` của chính thiết bị đang mở.

Cùng họ với [Rootflow](https://github.com/derekdaydoi/Rootflow) — chung bảng
màu, chung typography, chung cách chia tầng code.

## Cấu trúc

```
index.html    design token + toàn bộ CSS
domain.js     ngày, tiến độ, streak, chỉ số tuần — hàm thuần, không DOM/storage
store.js      localStorage, migrate theo version, export/import backup
app.js        React UI, không chứa công thức nào
sw.js         service worker, cache-first khi mất mạng
manifest.json PWA manifest
vendor/       React 18.3.1 UMD, cùng bản với Rootflow
brand/        rootwork-mark.svg + master PNG 1024
icon-*.png    180 / 192 / 256 / 512 / 1024
make_icons.py sinh lại bộ icon từ brand/rootwork-mark-1024.png
BRAND_SPEC.md ràng buộc màu, chữ và mark
```

Ranh giới ba tầng là bất biến của repo này: `app.js` không được chứa phép tính
nào, `domain.js` không được chạm vào DOM hay storage, `store.js` không được
chứa nghiệp vụ OKR. Vi phạm ranh giới là lý do bản cũ không test được.

## Mô hình dữ liệu

```
Objective ──┬── Key Result ──┬── Task
            │                └── Task
            └── Key Result ──── Task

loose[]      Task phát sinh, không thuộc mục tiêu nào
routines[]   Thói quen, target n lần / tuần, log theo ngày
trash[]      Xoá mềm 30 ngày
```

- Task không ngày = kho · có ngày, không giờ = linh hoạt trong ngày ·
  có ngày + giờ = cố định.
- Key Result có chỉ số thì đo bằng chỉ số; không có thì suy ra từ tỉ lệ task
  xong. Objective là trung bình cộng các KR, không trọng số.
- Streak đếm theo **tuần đạt target**, không phải ngày liên tiếp — đặt 3 lần/
  tuần rồi làm đúng 3 lần cách quãng vẫn là đạt.
- Điểm nhịp = 50% hoàn thành + 30% ưu tiên cao + 20% thói quen. Trọng số nằm
  ở `D.RHYTHM_WEIGHTS`, một chỗ duy nhất.

## Deploy GitHub Pages

1. **Xuất bản sao lưu từ app đang chạy trước.** Menu → Xuất bản sao lưu.
2. Upload toàn bộ file lên root repo. `vendor/` và `brand/` phải giữ nguyên
   là thư mục, không kéo phẳng ra root.
3. Commit + push. Settings → Pages → Source → branch `main`, folder `/`.
4. Mở bằng tab ẩn danh để kiểm tra.
5. Nếu Home Screen còn cache bản cũ: xoá shortcut rồi Add to Home Screen lại.

Khi deploy đè lên repo cũ, nhớ xoá tay những file không còn trong danh sách
trên — GitHub chỉ ghi đè, không tự dọn.

## Kiểm tra sau khi deploy

| Việc | Kỳ vọng |
|---|---|
| Mở app | Dữ liệu cũ còn nguyên, không mất objective/task/thói quen |
| **Bật máy bay rồi tải lại** | App vẫn lên — chứng minh React chạy từ `vendor/`, không phải CDN |
| Nạp nhầm file `rootflow-backup-*.json` | Báo *"Đây là bản sao lưu của Rootflow"*, không xoá gì |
| Vuốt nhanh một task | Ăn cử chỉ ngay lần đầu, không nuốt |
| Icon trên Home Screen | Chữ W trắng trên nền xanh đặc, không viền kem |

## Dữ liệu

- `STORAGE_KEY = rootwork:v1`, `SCHEMA_VERSION = 4`.
- Migration chạy tự động theo bậc 1→2→3→4 ngay lần mở đầu tiên, không reset.
- Backup cũ (`format: rootwork-backup`) nạp được bình thường; schema mới hơn
  bản app đang chạy sẽ bị từ chối thay vì nạp bừa.
- `localStorage` gắn với **origin**. Đổi sang domain hoặc repo khác là dữ liệu
  không đi theo — phải xuất backup rồi nạp lại bằng tay.
- Vượt 3 MB thì app tự cảnh báo. Xoá website data hoặc reset browser là mất
  sạch; xuất backup định kỳ, đừng commit backup cá nhân lên GitHub.

## Bàn phím

`1` Mục tiêu · `2` Hôm nay · `3` Thói quen · `4` Cả tuần · `N` việc mới ·
`Esc` về Tổng quan.

## Sửa mark hoặc bảng màu

Đọc `BRAND_SPEC.md` trước. Màu khai báo một lần ở `:root` trong `index.html`;
không rule nào bên dưới được hardcode hex. Sau khi thay mark, chạy
`python make_icons.py` và đổi `CACHE` trong `sw.js` sang ngày deploy.
