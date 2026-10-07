import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  fontKey, isFontFamily, loadFont, type FontFamilyId, type FontWeight, type LoadedFont,
} from '@/core/geometry/fonts';
import { gridToShapes } from '@/core/geometry/grid';
import { mirrorShapesX, subtractShapes, unionShapes } from '@/core/geometry/polygons';
import {
  circlePath, circleShape, extrudeShape, ringShape, roundedRectShape,
} from '@/core/geometry/shapes';
import { shapesFromPathData, shapesFromPolygons } from '@/core/geometry/svg';
import {
  lineExtent, measureText, textShapes, type TextStyle,
} from '@/core/geometry/text';
import type { GenerateContext, Generator, ModelPart } from '@/core/types';
import { round1, toNumber } from '@/core/utils/options';
import {
  CARD_SIZES, CONTACT_TYPES, LOGO_ICONS, TEMPLATES, type ContactType, type TemplateId,
} from './catalog';
import {
  hstack, leaf, vstack, type Box, type Output, type PartGroup,
} from './layout';
import type { ToolOptions } from './options';
import { createQr, qrPayload, type QrMatrix } from './qr';
import {
  ACCENT_BAR, contentRect, TEMPLATE_LAYOUTS, type Align, type TemplateContext,
} from './templates';

/** smallest fit scale before the content is reported as not fitting */
const MIN_SCALE = 0.45;
/** cap height below which text gets hard to print with a 0.4 mm nozzle */
const MIN_TEXT_SIZE = 2;
/** QR modules smaller than this are hard to print and to scan */
const MIN_QR_MODULE = 0.8;
/** material that has to remain below engraved or inlaid details */
const MIN_FLOOR = 0.4;
/** quiet zone (in modules) around an inverted QR code, which is part of the print */
const QR_QUIET_ZONE = 2;
/** corner radius of rounded QR modules, as a fraction of the module size */
const QR_ROUNDING = 0.5;

const colorValue = (hex: string, fallback: number) => {
  const value = /^#[0-9a-f]{6}$/i.test(hex) ? parseInt(hex.slice(1), 16) : Number.NaN;
  return Number.isFinite(value) ? value : fallback;
};

const luminance = (color: number) => {
  const channel = (shift: number) => ((color >> shift) & 0xff) / 255;
  return 0.2126 * channel(16) + 0.7152 * channel(8) + 0.0722 * channel(0);
};

const initialsOf = (name: string) => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '';
  const first = Array.from(words[0])[0];
  const last = words.length > 1 ? Array.from(words[words.length - 1])[0] : '';
  return (first + last).toLocaleUpperCase();
};

/** Card outline with only the part left of `width` (the accent bar), following the rounded corners. */
const leftStripShape = (cardWidth: number, cardHeight: number, radius: number, width: number) => {
  const left = -cardWidth / 2;
  const r = Math.min(radius, width, cardHeight / 2);
  const shape = new THREE.Shape();
  shape.moveTo(left + width, -cardHeight / 2);
  shape.lineTo(left + r, -cardHeight / 2);
  if (r > 0) shape.absarc(left + r, -cardHeight / 2 + r, r, -Math.PI / 2, -Math.PI, true);
  shape.lineTo(left, cardHeight / 2 - r);
  if (r > 0) shape.absarc(left + r, cardHeight / 2 - r, r, Math.PI, Math.PI / 2, true);
  shape.lineTo(left + width, cardHeight / 2);
  shape.lineTo(left + width, -cardHeight / 2);
  return shape;
};

const sanitizeContacts = (contacts: unknown): { type: ContactType; value: string }[] => (
  Array.isArray(contacts)
    ? contacts
      .filter((contact) => contact && typeof contact.value === 'string' && contact.type in CONTACT_TYPES)
      .map((contact) => ({ type: contact.type as ContactType, value: contact.value.trim() }))
      .filter((contact) => contact.value)
    : []
);

/**
 * Business card: a flat card with name, contacts, logo, QR code and decorations,
 * laid out by a template. Details are raised, engraved or inlaid flush (for multi-color printers).
 * Runs in the model worker (see src/core/worker/model.worker.ts).
 */
const generateModel: Generator<ToolOptions> = async (options, { warn }: GenerateContext) => {
  /* ---------- settings ---------- */
  const template: TemplateId = options.template in TEMPLATES ? options.template : 'classic';
  const features = TEMPLATES[template];
  const preset = CARD_SIZES[options.card.size] ?? null;
  const width = preset ? preset.width : toNumber(options.card.width, 85, 30, 200);
  const height = preset ? preset.height : toNumber(options.card.height, 55, 30, 200);
  const thickness = toNumber(options.card.thickness, 1.2, 0.6, 10);
  const margin = toNumber(options.card.margin, 5, 1, Math.min(width, height) / 4);
  const relief = ['raised', 'engraved', 'inlay'].includes(options.card.relief) ? options.card.relief : 'raised';
  let depth = toNumber(options.card.reliefDepth, 0.6, 0.2, 5);
  if (relief !== 'raised' && depth > thickness - MIN_FLOOR) {
    depth = Math.max(0.2, thickness - MIN_FLOOR);
    warn('depthLimited', { value: round1(depth) });
  }
  const faceDown = relief === 'inlay' && options.card.faceDown;

  let radius = toNumber(options.card.cornerRadius, 3, 0);
  if (radius > Math.min(width, height) / 2) {
    radius = Math.min(width, height) / 2;
    warn('radiusLimited', { value: round1(radius) });
  }

  const typography = options.typography;
  const heading: FontFamilyId = isFontFamily(typography.heading) ? typography.heading : 'montserrat';
  const body: FontFamilyId = isFontFamily(typography.body) ? typography.body : 'inter';
  const nameWeight: FontWeight = typography.nameWeight === 'regular' ? 'regular' : 'bold';
  const bodyWeight: FontWeight = typography.bodyWeight === 'regular' ? 'regular' : 'bold';
  const textScale = toNumber(typography.scale, 100, 25, 300) / 100;
  const nameSize = toNumber(typography.nameSize, 5.5, 1, 20) * textScale;
  const titleSize = toNumber(typography.titleSize, 3.2, 1, 12) * textScale;
  const detailSize = toNumber(typography.detailSize, 3, 1, 12) * textScale;

  const content = {
    name: String(options.content.name ?? '').trim(),
    title: String(options.content.title ?? '').trim(),
    company: String(options.content.company ?? '').trim(),
    contacts: sanitizeContacts(options.content.contacts),
  };

  const colors = {
    base: colorValue(options.colors.base, 0xf4f4f1),
    text: colorValue(options.colors.text, 0x1b1c1e),
    accent: colorValue(options.colors.accent, 0x1b1c1e),
  };

  const fontList: [FontFamilyId, FontWeight][] = [
    [heading, nameWeight], [heading, bodyWeight], [heading, 'bold'], [body, bodyWeight],
  ];
  const fonts = new Map<string, LoadedFont>(await Promise.all(fontList.map(
    async ([family, weight]) => [fontKey(family, weight), await loadFont(family, weight)] as const,
  )));

  /* ---------- QR code ---------- */
  let qrMatrix: QrMatrix | null = null;
  // a dark card with light print: invert the modules so phones still see dark-on-light
  const qrInverted = luminance(colors.base) < luminance(colors.text);
  if (options.qr.enabled) {
    const payload = qrPayload(options);
    if (!features.qr) {
      warn('qrUnsupported');
    } else if (!payload) {
      warn('qrEmpty');
    } else {
      qrMatrix = createQr(payload, ['L', 'M', 'Q', 'H'].includes(options.qr.errorCorrection) ? options.qr.errorCorrection : 'M');
    }
  }

  /* ---------- layout ---------- */
  const rect = contentRect(template, width, height, margin);
  const qrSize = Math.min(toNumber(options.qr.size, 20, 8, 100), rect.h, rect.w * 0.6);

  /**
   * Builds the layout with separate fit scales for the name block (name, title, company, logo)
   * and the contact block, so making one block bigger never shrinks the other one unless needed.
   */
  const buildLayout = (headerScale: number, contactScale: number) => {
    let smallestText = Infinity;
    const s = Math.min(headerScale, contactScale);
    const h = headerScale;
    const c = contactScale;

    const text = (value: string, style: TextStyle, group: PartGroup = 'text'): Box | null => {
      if (!value) return null;
      const font = fonts.get(fontKey(style.family, style.weight))!;
      smallestText = Math.min(smallestText, style.size);
      const textWidth = measureText(font, value, style);
      const { ascent, descent } = lineExtent(font, value, style);
      // the box spans ascenders to descenders, so nothing sticks out of the layout
      return leaf(textWidth, ascent + descent, (x, y, out) => {
        const [wx, wy] = out.toWorld(x, y + ascent);
        out.add(group, textShapes(font, value, style, wx, wy));
      });
    };

    const icon = (path: string, size: number, group: PartGroup = 'icons'): Box => leaf(size, size, (x, y, out) => {
      const [wx, wy] = out.toWorld(x, y + size);
      out.add(group, shapesFromPathData(path, {
        x: wx, y: wy, width: size, height: size,
      }));
    });

    const name = (factor = 1) => text(content.name, { family: heading, weight: nameWeight, size: nameSize * factor * h });
    const subtitle = (align: Align) => vstack([
      text(content.title, { family: body, weight: bodyWeight, size: titleSize * h }),
      text(content.company, { family: heading, weight: bodyWeight, size: titleSize * h }),
    ], { gap: titleSize * 0.25 * h, align });

    const contactBox = (type: ContactType, value: string, withIcon: boolean) => {
      const label = text(value, { family: body, weight: bodyWeight, size: detailSize * c });
      return withIcon
        ? hstack([icon(CONTACT_TYPES[type].icon, detailSize * 1.55 * c), label], { gap: detailSize * 0.75 * c, align: 'center' })
        : label;
    };

    const context: TemplateContext = {
      rect,
      s,
      nameSize: nameSize * h,
      qrSize,
      name,
      subtitle,
      header: (align) => vstack([name(), subtitle(align)], { gap: nameSize * 0.2 * h, align }),
      contacts: (align) => vstack(
        content.contacts.map(({ type, value }) => contactBox(type, value, options.content.showIcons)),
        { gap: detailSize * 0.3 * c, align },
      ),
      contactLine: (types) => {
        const type = types.find((candidate) => content.contacts.some((item) => item.type === candidate));
        const contact = content.contacts.find((item) => item.type === type);
        return contact ? contactBox(contact.type, contact.value, false) : null;
      },
      logo: (size) => {
        const { logo } = options;
        if (logo.type === 'icon' && LOGO_ICONS[logo.icon]) {
          return icon(LOGO_ICONS[logo.icon], size);
        }
        if (logo.type === 'custom' && logo.custom?.polygons?.length) {
          const { custom } = logo;
          const aspect = Math.min(3, Math.max(1 / 3, custom.width / custom.height));
          const boxWidth = aspect >= 1 ? size * Math.min(aspect, 2) : size * aspect;
          const boxHeight = aspect >= 1 ? boxWidth / aspect : size;
          return leaf(boxWidth, boxHeight, (x, y, out) => {
            const [wx, wy] = out.toWorld(x, y + boxHeight);
            out.add('icons', shapesFromPolygons(custom.polygons, custom, {
              x: wx, y: wy, width: boxWidth, height: boxHeight,
            }));
          });
        }
        return null;
      },
      qr: (size) => {
        if (!qrMatrix) return null;
        const matrix = qrMatrix;
        const quiet = qrInverted ? QR_QUIET_ZONE : 0;
        const cells = matrix.size + 2 * quiet;
        return leaf(size, size, (x, y, out) => {
          const [left, top] = out.toWorld(x, y);
          out.add('qr', gridToShapes({
            columns: cells,
            rows: cells,
            cell: size / cells,
            left,
            top,
            cornerRadius: options.qr.style === 'square' ? 0 : QR_ROUNDING,
            filled: (c, r) => {
              const dark = matrix.isDark(c - quiet, r - quiet);
              const inside = c >= quiet && r >= quiet && c < quiet + matrix.size && r < quiet + matrix.size;
              return qrInverted ? !(inside && dark) : dark;
            },
          }));
        });
      },
      rule: (ruleWidth, ruleHeight) => leaf(ruleWidth, ruleHeight, (x, y, out) => {
        const [cx, cy] = out.toWorld(x + ruleWidth / 2, y + ruleHeight / 2);
        out.add('decor', [roundedRectShape(ruleWidth, ruleHeight, Math.min(ruleWidth, ruleHeight) / 2, cx, cy)]);
      }),
      monogram: (size) => leaf(size, size, (x, y, out) => {
        const ring = Math.max(0.8, size * 0.03);
        const [cx, cy] = out.toWorld(x + size / 2, y + size / 2);
        out.add('decor', [ringShape(circleShape(size / 2, cx, cy), circlePath(size / 2 - ring, cx, cy))]);
        const initials = initialsOf(content.name);
        const style: TextStyle = { family: heading, weight: 'bold', size: size * 0.3 };
        const font = fonts.get(fontKey(heading, 'bold'))!;
        const textWidth = measureText(font, initials, style);
        out.add('text', textShapes(font, initials, style, cx - textWidth / 2, cy - style.size / 2));
      }),
    };

    const root = TEMPLATE_LAYOUTS[template](context);
    const fits = !root || (root.fits && root.w <= rect.w + 1e-6 && root.h <= rect.h + 1e-6);
    return { root, fits, smallestText };
  };

  // largest scale (up to the configured sizes) at which `test` passes, or null if not even the smallest
  const largestScale = (test: (scale: number) => boolean): number | null => {
    if (test(1)) return 1;
    if (!test(MIN_SCALE)) return null;
    let low = MIN_SCALE;
    let high = 1;
    for (let i = 0; i < 14 && high - low > 0.002; i += 1) {
      const middle = (low + high) / 2;
      if (test(middle)) low = middle; else high = middle;
    }
    return low;
  };
  const fits = (header: number, contacts: number) => buildLayout(header, contacts).fits;

  // shrink only the block that does not fit if possible (the one that needs less shrinking wins),
  // and both together only as a last resort
  let scales = { header: 1, contacts: 1 };
  if (!fits(1, 1)) {
    const contactsOnly = largestScale((scale) => fits(1, scale));
    const headerOnly = largestScale((scale) => fits(scale, 1));
    if (contactsOnly !== null && contactsOnly >= (headerOnly ?? 0)) {
      scales = { header: 1, contacts: contactsOnly };
    } else if (headerOnly !== null) {
      scales = { header: headerOnly, contacts: 1 };
    } else {
      const both = largestScale((scale) => fits(scale, scale));
      if (both === null) {
        warn('contentOverflow');
      }
      scales = { header: both ?? MIN_SCALE, contacts: both ?? MIN_SCALE };
    }
    const smallest = Math.min(scales.header, scales.contacts);
    if (smallest < 0.995 && smallest > MIN_SCALE) {
      warn('textScaled', { percent: Math.round(smallest * 100) });
    }
  }
  const layout = buildLayout(scales.header, scales.contacts);
  if (layout.smallestText < MIN_TEXT_SIZE) {
    warn('textSmall', { size: round1(layout.smallestText) });
  }
  if (qrMatrix) {
    const module = qrSize / (qrMatrix.size + (qrInverted ? 2 * QR_QUIET_ZONE : 0));
    if (module < MIN_QR_MODULE) {
      warn('qrDense', { size: Math.round(module * 100) / 100 });
    }
  }

  /* ---------- shapes ---------- */
  const groups: Record<PartGroup, THREE.Shape[]> = {
    text: [], icons: [], qr: [], decor: [],
  };
  const output: Output = {
    add: (group, shapes) => groups[group].push(...shapes),
    toWorld: (x, y) => [x - width / 2, height / 2 - y],
  };
  layout.root?.place(rect.x, rect.y, output);

  if (template === 'accent') {
    groups.decor.push(leftStripShape(width, height, radius, ACCENT_BAR));
  }

  /* ---------- parts ---------- */
  const partColors: Record<PartGroup, number> = {
    text: colors.text, qr: colors.text, icons: colors.accent, decor: colors.accent,
  };
  const segments = (group: PartGroup) => (group === 'text' ? 6 : 12);
  const nonEmpty = (Object.keys(groups) as PartGroup[]).filter((group) => groups[group].length);
  const cardShape = roundedRectShape(width, height, radius);
  const parts: ModelPart[] = [];
  let card: THREE.BufferGeometry;

  if (relief === 'raised') {
    card = extrudeShape(cardShape, thickness);
    nonEmpty.forEach((group) => parts.push({
      name: group, role: 'detail', color: partColors[group], geometry: extrudeShape(groups[group], depth, thickness, segments(group)),
    }));
  } else {
    // engraving and inlays are cut in 2D: the card's surface layer gets the details as holes,
    // and the inlay parts use exactly the same outlines, so they fill the holes without gaps
    const mirror = (shapes: THREE.Shape[]) => (faceDown ? mirrorShapesX(shapes) : shapes);
    const details = nonEmpty.map((group) => ({ group, shapes: mirror(unionShapes(groups[group], segments(group))) }));
    const surface = subtractShapes([cardShape], details.flatMap((detail) => detail.shapes), 24);
    const surfaceZ = faceDown ? 0 : thickness - depth;
    const solidZ = faceDown ? depth : 0;
    card = mergeGeometries([
      extrudeShape(cardShape, thickness - depth, solidZ),
      extrudeShape(surface, depth, surfaceZ, 1),
    ]);
    if (relief === 'inlay') {
      details.forEach(({ group, shapes }) => parts.push({
        name: group, role: 'detail', color: partColors[group], geometry: extrudeShape(shapes, depth, surfaceZ, 1),
      }));
    }
  }
  if (faceDown) {
    warn('faceDown');
  }

  return [{ name: 'base', role: 'base', color: colors.base, geometry: card }, ...parts];
};

export default generateModel;
