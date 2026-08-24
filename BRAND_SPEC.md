# Rootwork V2 brand and interface specification

Rootwork should feel like a serious weekly progression system: energetic
through hierarchy and visible movement, calm enough to use every day.

## Principles

- Game mechanics underneath; premium productivity interface on top.
- Use information hierarchy, typography, connectors, and state change for
  energy—not visual effects.
- Prefer whitespace and decisive grouping over floating dashboard cards.
- The tree is top-down. It must never become a mind map.
- Mobile readability wins over displaying every branch at once.

## Palette

All interface colors are declared once in styles.css.

| Token | Value | Role |
|---|---|---|
| --bg | #F5F5F1 | application background |
| --surface | #FFFFFF | primary surface |
| --ink | #171A18 | primary text |
| --muted | #737A75 | supporting text |
| --line | #E1E5DF | dividers and structure |
| --green | #176B45 | primary action and progress |
| --green-deep | #0F432E | strong green text/state |
| --danger | #A64239 | destructive/overdue state |
| --warning | #8A641D | stalled/attention state |

The app mark uses the same #176B45 primary green as the interface so the
installed icon, launch sequence, and product state feel continuous.

## Typography

Use the local system UI stack. Large campaign/week headings are heavy,
compact, and tightly tracked; operational copy remains neutral and highly
legible. Rootwork has no web-font dependency, so the installed PWA renders
consistently offline.

## Mark

`brand/rootwork-mark.svg` is the square app-mark source and
`brand/rootwork-symbol.svg` is the transparent symbol source:

- one bottom root node grows into two structural junctions;
- the junctions resolve into three upper target nodes;
- the complete geometry reads as both a progression tree and a W;
- the symbol remains one color with round joins and no decorative detail;
- the app mark uses a solid green rounded-square field and white geometry;
- all meaningful geometry remains safe inside circular Android masks.

`make_icons.py` owns the matching raster geometry and regenerates the 180,
192, 256, 512, and 1024 px PWA icons plus transparent symbol PNG.

## Shape and spacing

- Controls target at least 44 px.
- Cards and sheets use restrained 12–18 px radii.
- Avoid nested card stacks when a divider or direct layout is clearer.
- Borders should usually carry structure; shadows remain shallow.
- Bottom navigation and sheet actions account for device safe areas.

## Motion

Motion communicates progression:

- every app entry begins on white with the root node;
- lines grow upward from the root before their destination nodes resolve;
- a single pale ring acknowledges the complete structure without glow;
- the lowercase wordmark appears after the symbol;
- the localized subtitle follows: “Turn effort into progress.” / “Biến nỗ
  lực thành tiến bộ.”;
- the white layer fades away to reveal current context in about 2.4 seconds;
- the week root resolves first;
- the trunk and target connectors draw downward;
- target nodes appear after connectors;
- actions resolve after their target;
- progress and XP bars advance smoothly;
- level acknowledgement is textual and subtle.

No particles, neon, explosions, loot effects, or decorative looping motion.
prefers-reduced-motion collapses all animation and transition duration.

## Voice

Copy is concise, direct, and forward-looking. Avoid self-help clichés,
emotional overreach, fake urgency, and videogame vocabulary in normal
operation. “Campaign” is used sparingly for the weekly-start sense of a new
beginning.
