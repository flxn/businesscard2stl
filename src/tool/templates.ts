import type { TemplateId } from './catalog';
import {
  hstack, spacer, vstack, type Box,
} from './layout';

export type Align = 'start' | 'center' | 'end';

/** What a template can build, already sized for the current fit scale. */
export interface TemplateContext {
  /** content area in card coordinates (mm, Y down) */
  rect: { x: number; y: number; w: number; h: number };
  /** fit scale (1 = sizes as configured); gaps should be multiplied by it */
  s: number;
  nameSize: number;
  name(factor?: number): Box | null;
  /** job title and company */
  subtitle(align: Align): Box | null;
  /** name, job title and company */
  header(align: Align): Box | null;
  contacts(align: Align): Box | null;
  /** the first filled contact of these types, as plain text without icon */
  contactLine(types: string[]): Box | null;
  logo(size: number): Box | null;
  qr(size: number): Box | null;
  /** QR size from the settings, limited to the content height */
  qrSize: number;
  rule(w: number, h: number): Box;
  /** the initials of the name in a ring */
  monogram(size: number): Box;
}

/** Width of the colored bar of the "accent" template. */
export const ACCENT_BAR = 8;

/** Content area of a template: the card minus margins (and the accent bar). */
export const contentRect = (template: TemplateId, width: number, height: number, margin: number) => {
  const left = template === 'accent' ? ACCENT_BAR + margin * 0.8 : margin;
  return {
    x: left, y: margin, w: width - left - margin, h: height - 2 * margin,
  };
};

/** Name across the top with the logo on the right; contacts bottom left, QR code bottom right. */
const classic = (ctx: TemplateContext) => {
  const { rect, s } = ctx;
  const top = hstack([ctx.header('start'), ctx.logo(ctx.nameSize * 2.4)], {
    justify: 'between', align: 'start', width: rect.w, gap: 4 * s,
  });
  const bottom = hstack([ctx.contacts('start'), ctx.qr(ctx.qrSize)], {
    justify: 'between', align: 'end', width: rect.w, gap: 4 * s,
  });
  return vstack([top, bottom], { justify: 'between', height: rect.h, gap: 3 * s });
};

/** QR code (or a large logo) on the left, separated by a line from the text. */
const split = (ctx: TemplateContext) => {
  const { rect, s } = ctx;
  const qr = ctx.qr(ctx.qrSize);
  const side = qr ?? ctx.logo(rect.h * 0.62);
  const right = vstack([qr && ctx.logo(ctx.nameSize * 2), ctx.header('start'), ctx.contacts('start')], { gap: 3.5 * s });
  return hstack([side, side && ctx.rule(0.8, rect.h * 0.8), right], {
    gap: 4.5 * s, align: 'center', width: rect.w, height: rect.h,
  });
};

/** Everything centered, with a short line between name and contacts. */
const centered = (ctx: TemplateContext) => {
  const { rect, s } = ctx;
  return vstack([
    ctx.logo(ctx.nameSize * 2.2),
    ctx.header('center'),
    ctx.rule(Math.min(24, rect.w * 0.35), 0.8),
    ctx.contacts('center'),
  ], {
    align: 'center', justify: 'center', gap: 2.6 * s, width: rect.w, height: rect.h,
  });
};

/** A large name in the middle and a single line (website or email) at the bottom. */
const minimal = (ctx: TemplateContext) => {
  const { rect, s } = ctx;
  const bottom = ctx.contactLine(['website', 'email', 'mobile', 'phone']);
  const center = vstack([ctx.logo(ctx.nameSize * 2.6), ctx.name(1.35), ctx.subtitle('center')], {
    align: 'center', gap: 2.6 * s,
  });
  // the spacer balances the bottom line, so the name block sits in the middle
  return vstack([spacer(0, bottom?.h ?? 0), center, bottom ?? spacer()], {
    justify: 'between', align: 'center', width: rect.w, height: rect.h,
  });
};

/** Like classic, with a colored bar along the left edge. */
const accent = classic;

/** Initials in a ring, text (and the logo) on the right. */
const monogram = (ctx: TemplateContext) => {
  const { rect, s } = ctx;
  const size = Math.min(rect.h * 0.82, rect.w * 0.36);
  const right = vstack([ctx.logo(ctx.nameSize * 2), ctx.header('start'), ctx.contacts('start')], { gap: 3.5 * s });
  return hstack([ctx.monogram(size), right], {
    gap: 6 * s, align: 'center', width: rect.w, height: rect.h,
  });
};

export const TEMPLATE_LAYOUTS: Record<TemplateId, (ctx: TemplateContext) => Box | null> = {
  classic, split, centered, minimal, accent, monogram,
};
