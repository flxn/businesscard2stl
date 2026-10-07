# businesscard2stl

Create 3D printable business cards in the browser: choose a layout, fill in your details, add icons,
a logo and a QR code, and download the STL. Live at https://businesscard2stl.printer.tools.

- **Layouts:** Classic, Split, Accent bar, Centered, Minimal, Monogram, plus style presets for fonts and colors
- **Content:** name, job title, company, up to six contact lines with icons, built-in logo icons or an uploaded SVG
- **QR code:** vCard, website or custom text, with a scannable 2D preview and the printed module size
- **Printing:** raised, engraved or flush inlay details (optionally face down on the bed), separate parts for
  multi-color printers, and warnings for text or QR modules that are too small to print

Built from the [printer.tools generator template](https://github.com/flxn/printer-tools-template)
with Vue 3, Vite, TypeScript and three.js. The model is generated in a web worker; nothing leaves the browser.

## How it works

- `src/tool/options.ts`: the settings, defaults and style presets
- `src/tool/catalog.ts`: card sizes, contact types, icons, templates and filament colors
- `src/tool/layout.ts`: a small box layout (text, icons, QR code, rules in horizontal and vertical stacks)
- `src/tool/templates.ts`: the six layouts, built from those boxes
- `src/tool/generator.ts`: fits the layout to the card (text is scaled down until it fits), builds the shapes and
  turns them into parts. Engraving and inlays are cut in 2D (Clipper) and then extruded, which keeps live updates
  under 100 ms.
- `src/tool/qr.ts`: vCard / website payloads and the QR matrix (shared by the generator and the 2D preview)

Changes to the shared workbench in `src/core/` compared to the template:
- text uses TTF fonts via opentype.js, sized by cap height, with kerning and letter spacing
  (`core/geometry/fonts.ts`, `core/geometry/text.ts`); the fonts are in `core/assets/fonts`
- `core/geometry/svg.ts` turns SVG path data and polygons into shapes (without a DOM, so it works in the worker)
- `core/geometry/grid.ts` traces cell grids (QR codes) into merged outlines
- `core/geometry/polygons.ts` provides 2D union, difference and mirroring; 3D CSG (three-bvh-csg) was removed

## SEO

`vite/site-plugin.ts` generates the search engine basis at build time from `src/site.config.ts` and the
translated `seo` texts in `src/tool/i18n`:

- one page per language (`/` and `/de/`) with its own title, description, canonical link, hreflang alternates,
  OpenGraph and Twitter tags; the app keeps URL, title and canonical in sync when the language changes
- JSON-LD: `WebApplication`, `FAQPage` (from `src/tool/faq.ts`), `BreadcrumbList` under printer.tools
- static page content inside `#app` (heading, features, print guide, FAQ, language links) for crawlers and
  link previews that do not run JavaScript; the app replaces it on start
- `sitemap.xml` with language alternates, `robots.txt`, `site.webmanifest` with PNG icons
- `public/preview.png` (1200×630) as the social preview image

Keep titles under ~60 and descriptions under ~155 characters. nginx answers unknown paths with 404, so no
duplicates of the start page get indexed.

## Development

Requires Node 22.

```sh
npm install
npm run dev        # http://localhost:8080
npm test           # geometry and layout tests (Vitest)
npm run lint
npm run build      # type check + production build into dist/
```

## Deployment (Coolify)

Dockerfile build pack, port 80. The image builds the site and serves `dist/` with nginx.

## Credits

- Fonts: Inter, Montserrat, Space Grotesk, Oswald, Playfair Display, JetBrains Mono (SIL Open Font License)
- Icons: [Material Design Icons](https://pictogrammers.com/library/mdi/) (Apache 2.0), X logo from
  [Simple Icons](https://simpleicons.org) (CC0)

## License

MIT
