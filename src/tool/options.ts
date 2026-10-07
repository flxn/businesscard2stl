import { isFontFamily, type FontFamilyId } from '@/core/geometry/fonts';
import {
  CARD_SIZES, CONTACT_TYPES, LOGO_ICONS, TEMPLATES, type CardSizeId, type ContactType, type TemplateId,
} from './catalog';

export type ReliefMode = 'raised' | 'engraved' | 'inlay';
export type FontWeightChoice = 'regular' | 'bold';
export type QrContent = 'vcard' | 'website' | 'custom';
export type ErrorCorrection = 'L' | 'M' | 'Q' | 'H';
export type QrStyle = 'rounded' | 'square';

export interface Contact {
  type: ContactType;
  value: string;
}

/** An uploaded SVG logo, converted to polygons in the browser (see components/LogoPicker.vue). */
export interface CustomLogo {
  name: string;
  width: number;
  height: number;
  polygons: { outer: number[]; holes: number[][] }[];
}

/**
 * All settings of the business card. Plain JSON: reactive in the UI, sent to the worker,
 * compared to detect outdated previews and exported as a settings file.
 * Number fields hold NaN while the user has emptied them.
 */
export interface ToolOptions {
  template: TemplateId;
  content: {
    name: string;
    title: string;
    company: string;
    contacts: Contact[];
    showIcons: boolean;
  };
  logo: {
    type: 'none' | 'icon' | 'custom';
    icon: string;
    custom: CustomLogo | null;
  };
  qr: {
    enabled: boolean;
    content: QrContent;
    text: string;
    size: number;
    errorCorrection: ErrorCorrection;
    style: QrStyle;
  };
  typography: {
    heading: FontFamilyId;
    body: FontFamilyId;
    nameWeight: FontWeightChoice;
    bodyWeight: FontWeightChoice;
    /** scales all text sizes at once, in percent */
    scale: number;
    nameSize: number;
    titleSize: number;
    detailSize: number;
  };
  colors: {
    base: string;
    text: string;
    accent: string;
  };
  card: {
    size: CardSizeId;
    width: number;
    height: number;
    thickness: number;
    cornerRadius: number;
    margin: number;
    relief: ReliefMode;
    reliefDepth: number;
    faceDown: boolean;
  };
}

export const MAX_CONTACTS = 6;

export const defaultOptions: ToolOptions = {
  template: 'classic',
  content: {
    name: 'Felix Stein',
    title: 'Full Stack Developer',
    company: '',
    contacts: [
      { type: 'website', value: 'flxn.de' },
      { type: 'email', value: 'spam@flxn.de' },
    ],
    showIcons: true,
  },
  logo: {
    type: 'none',
    icon: 'nozzle',
    custom: null,
  },
  qr: {
    enabled: true,
    content: 'website',
    text: '',
    size: 24,
    errorCorrection: 'M',
    style: 'rounded',
  },
  typography: {
    heading: 'montserrat',
    body: 'inter',
    nameWeight: 'bold',
    bodyWeight: 'bold',
    scale: 100,
    nameSize: 5.5,
    titleSize: 3.2,
    detailSize: 3,
  },
  colors: {
    base: '#f4f4f1',
    text: '#1b1c1e',
    accent: '#1b1c1e',
  },
  card: {
    size: 'eu',
    width: 85,
    height: 55,
    thickness: 1.2,
    cornerRadius: 3,
    margin: 5,
    relief: 'raised',
    reliefDepth: 0.6,
    faceDown: false,
  },
};

/** Style presets: fonts, title style and colors that work well together. */
export const STYLE_PRESETS: Record<string, { typography: Partial<ToolOptions['typography']>; colors: ToolOptions['colors'] }> = {
  modern: {
    typography: { heading: 'montserrat', body: 'inter', nameWeight: 'bold' },
    colors: { base: '#f4f4f1', text: '#1b1c1e', accent: '#1b1c1e' },
  },
  elegant: {
    typography: { heading: 'playfair', body: 'inter', nameWeight: 'bold' },
    colors: { base: '#1f2a4d', text: '#efe6d2', accent: '#c9a447' },
  },
  tech: {
    typography: { heading: 'spaceGrotesk', body: 'jetbrainsMono', nameWeight: 'bold' },
    colors: { base: '#1b1c1e', text: '#f4f4f1', accent: '#2f8f5b' },
  },
  bold: {
    typography: { heading: 'oswald', body: 'montserrat', nameWeight: 'bold' },
    colors: { base: '#f1c232', text: '#1b1c1e', accent: '#1b1c1e' },
  },
  natural: {
    typography: { heading: 'playfair', body: 'montserrat', nameWeight: 'regular' },
    colors: { base: '#efe6d2', text: '#2f4a35', accent: '#a07a52' },
  },
};

/** Whether a live update may run (number fields are checked separately). */
export const isReadyForUpdate = (options: ToolOptions): boolean => (
  options.content.name.trim() !== '' || options.content.contacts.some((contact) => contact.value.trim() !== '')
);

const oneOf = <T extends string>(value: unknown, allowed: readonly T[], fallback: T): T => (
  allowed.includes(value as T) ? value as T : fallback
);

const isNumberList = (value: unknown): value is number[] => Array.isArray(value) && value.every((item) => typeof item === 'number');

const isCustomLogo = (value: unknown): value is CustomLogo => {
  const logo = value as CustomLogo | null;
  return !!logo
    && typeof logo.name === 'string'
    && typeof logo.width === 'number' && logo.width > 0
    && typeof logo.height === 'number' && logo.height > 0
    && Array.isArray(logo.polygons)
    && logo.polygons.every((polygon) => isNumberList(polygon?.outer) && Array.isArray(polygon.holes) && polygon.holes.every(isNumberList));
};

/**
 * Repairs settings from saved state or imported files (values that no longer exist, broken lists),
 * so the UI and the generator can rely on the types. Number fields are clamped by the generator.
 */
export const normalizeOptions = (options: ToolOptions): void => {
  const defaults = defaultOptions;
  options.template = oneOf(options.template, Object.keys(TEMPLATES) as TemplateId[], defaults.template);

  const contacts = Array.isArray(options.content.contacts) ? options.content.contacts : [];
  options.content.contacts = contacts
    .filter((contact) => contact && typeof contact.value === 'string' && contact.type in CONTACT_TYPES)
    .slice(0, MAX_CONTACTS)
    .map((contact) => ({ type: contact.type, value: contact.value }));

  options.logo.type = oneOf(options.logo.type, ['none', 'icon', 'custom'], 'none');
  if (!(options.logo.icon in LOGO_ICONS)) options.logo.icon = 'nozzle';
  if (!isCustomLogo(options.logo.custom)) options.logo.custom = null;
  if (options.logo.type === 'custom' && !options.logo.custom) options.logo.type = 'none';

  options.qr.content = oneOf(options.qr.content, ['vcard', 'website', 'custom'], defaults.qr.content);
  options.qr.errorCorrection = oneOf(options.qr.errorCorrection, ['L', 'M', 'Q', 'H'], defaults.qr.errorCorrection);
  options.qr.style = oneOf(options.qr.style, ['rounded', 'square'], defaults.qr.style);

  const { typography } = options;
  if (!isFontFamily(typography.heading)) typography.heading = defaults.typography.heading;
  if (!isFontFamily(typography.body)) typography.body = defaults.typography.body;
  typography.nameWeight = oneOf(typography.nameWeight, ['regular', 'bold'], defaults.typography.nameWeight);
  typography.bodyWeight = oneOf(typography.bodyWeight, ['regular', 'bold'], defaults.typography.bodyWeight);

  (['base', 'text', 'accent'] as const).forEach((key) => {
    if (!/^#[0-9a-f]{6}$/i.test(options.colors[key])) options.colors[key] = defaults.colors[key];
  });

  options.card.size = oneOf(options.card.size, Object.keys(CARD_SIZES) as CardSizeId[], defaults.card.size);
  options.card.relief = oneOf(options.card.relief, ['raised', 'engraved', 'inlay'], defaults.card.relief);
};
