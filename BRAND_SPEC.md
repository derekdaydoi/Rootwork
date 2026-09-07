# Rootwork brand specification

## Identity

Rootwork uses the approved target-and-arrow mark. The canonical palette is:

- Indigo `#1800AD` — primary brand/action color
- Light blue `#AFE2FF` — launch and homescreen icon background
- White — surfaces

The product remains light-only. Open Sans is the primary UI and wordmark typeface with system fallbacks.

## Brand asset

The app uses `brand/rootwork-logo.png`, a 512×512 raster with the approved `#AFE2FF` background and safe padding for homescreen/maskable crops. The same file is used in the splash and top bar so the runtime has one canonical binary brand source.

Do not apply SVG drawing, CSS `content:url`, image replacement hacks, blur or drop-shadow filters to the raster logo.

## Launch motion

The opening screen is one transition, not onboarding. The raster logo is fully opaque from its first rendered frame. A separate ring layer expands behind it, the logo settles from 94% to 100% scale, then the Open Sans wordmark, tagline and copyright fade upward before the screen exits.

The splash is fixed to `100dvh` with overflow locked to prevent iOS Safari scroll indicators during launch. Reduced-motion preferences disable decorative motion.

## Copyright

`Rootwork`, the target-and-arrow brand mark and this product identity are © 2026 Rootwork / @derekdaydoi. The notice appears on the launch screen and in `NOTICE.md`.
