# Business2STL branding

The header logo and matching simplified favicon were generated with the built-in imagegen tool with transparent backgrounds.

## Sources and prompts

- Header logo: `../../public/business2stl-logo.png`
- Header generation prompt: [business2stl-logo-prompt.txt](business2stl-logo-prompt.txt)
- Favicon master: [business2stl-favicon-master.png](business2stl-favicon-master.png)
- Favicon generation prompt: [business2stl-favicon-prompt.txt](business2stl-favicon-prompt.txt), using the header logo as the reference image

## Exported assets

`public/` contains the transparent 16, 32, 48, and 64 pixel PNG favicons, a multi-size ICO containing 16, 32, and 48 pixel images, 192 and 512 pixel app icons, and an opaque white 180 pixel Apple touch icon. The header and footer use the full header logo. The HTML icon links and generated web manifest use the matching favicon exports.

To rebuild all favicon exports, install ImageMagick and run from the repository root:

```sh
bash scripts/export-brand-icons.sh
```

## Verification

The `verification/` directory stores browser checks, results, and screenshots inside the repo. It is ignored by Git to keep verification artifacts out of commits.

To repeat the browser checks, open the running app, paste `verification/brand-check.js` into the browser console, and run it in both light and dark themes. It checks icon requests, PNG dimensions, ICO entries, HTML favicon links, and header/footer image loading and colors. Use `verification/header-check.js` at desktop width and 390 by 844 pixels to check header sizing and overflow.

Run `npm run build` and check that `dist/site.webmanifest` refers to the matching app icons and 64 pixel favicon.
