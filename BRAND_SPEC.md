# Rootwork brand specification

## Identity

Rootwork uses the approved target-and-arrow mark. Canonical palette:

- Indigo `#1800AD` — primary brand/action color
- Light blue `#AFE2FF` — launch and homescreen icon background
- White — surfaces

The product is light-only. Open Sans is the primary UI and wordmark typeface with system fallbacks.

## Brand assets

Runtime and install assets are intentionally separated:

- `brand/rootwork-mark.png` — transparent 512×512 runtime mark used by splash, top bar and empty states. It is tightly framed so the symbol remains legible at small UI sizes.
- `brand/rootwork-icon.png` — 512×512 homescreen/PWA icon with `#AFE2FF` background and safe padding for iOS/Android masking.

Do not use the homescreen icon inside the app UI. Do not apply SVG drawing, CSS `content:url`, image-replacement hacks, blur or drop-shadow filters to the runtime mark.

## Launch motion

The opening screen is one transition, not onboarding. The runtime mark is fully opaque from the first rendered frame. A separate ring layer expands behind it, the mark settles from 94% to 100% scale, then the Open Sans wordmark, tagline and copyright fade upward before the screen exits.

The splash is fixed to `100dvh` with overflow locked to prevent iOS Safari scroll indicators during launch. Reduced-motion preferences disable decorative motion.

## Copyright

`Rootwork`, the target-and-arrow brand mark and this product identity are © 2026 Rootwork / @derekdaydoi. The notice appears on the launch screen and in `NOTICE.md`.
