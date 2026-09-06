# Rootwork brand specification

## Canonical asset

`brand/rootwork-logo.png` is the only runtime logo/mark asset. It is a raster PNG intentionally used as a real image element; no SVG drawing animation, CSS pseudo-element logo, runtime image replacement, or duplicate legacy marks are part of the final UI.

## Wordmark

`Rootwork` is rendered as text in Open Sans 800 so the name remains sharp at every device density. The supporting line is `Small steps. A better you.` / `Nhỏ hôm nay, lớn ngày mai`.

## Palette

- App background: `#F5F6F2`
- Surface: `#FFFFFF`
- Primary text: `#162019`
- Secondary text: `#5E685F`
- Primary green: `#176B45`
- Progress green: `#2F8A59`
- Soft green: `#E8F3EC`
- Border: `#DDE3DD`
- Warning text: `#8A5A12`
- Warning surface: `#FFF4DF`

The interface is light-only. Primary and secondary text colors were chosen to retain readable contrast on white and the off-white app background.

## Launch motion

The opening sequence is one screen only:

1. real raster logo scales/fades in;
2. a soft green halo expands behind it;
3. the Rootwork wordmark and subtitle rise/fade in;
4. the splash fades out directly into the app.

Reduced-motion preferences are respected.