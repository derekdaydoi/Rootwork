# Rootwork brand specification

## Canonical asset

`brand/rootwork-logo.png` là brand asset raster duy nhất ở runtime. Không dùng SVG brand, line-drawing logo, pseudo-element logo, `content:url` hoặc duplicate legacy marks.

## Wordmark

`Rootwork` render bằng Open Sans 800 để chữ luôn sắc nét. Tagline: `Small steps. A better you.` / `Nhỏ hôm nay, lớn ngày mai`.

## UI

- Light theme only.
- Background `#F5F6F2`, surface `#FFFFFF`, text `#162019`, muted `#5E685F`.
- Primary green `#176B45`, progress green `#2F8A59`, soft green `#E8F3EC`.
- Navigation icon đủ lớn và touch target tối thiểu khoảng 44 px.
- Inline SVG chỉ dùng cho icon UI; không dùng để dựng brand mark.

## Launch motion

Một splash duy nhất:
1. raster logo scale/fade vào;
2. halo xanh nhẹ mở rộng phía sau;
3. wordmark/tagline fade-rise;
4. splash fade ra và vào thẳng app.

`prefers-reduced-motion` phải rút ngắn animation.
