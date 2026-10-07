/**
 * Static data shared by the panel (UI) and the generator (worker):
 * card sizes, contact types, icons, layout templates, style presets and filament colors.
 */
import {
  mdiAccount, mdiAnchor, mdiAt, mdiAtom, mdiBicycle, mdiBriefcase, mdiBrush, mdiCamera, mdiCameraIris,
  mdiCellphone, mdiCodeTags, mdiCoffee, mdiCompass, mdiCrown, mdiCube, mdiCubeOutline, mdiDiamondStone,
  mdiDumbbell, mdiEarth, mdiEmail, mdiFacebook, mdiFeather, mdiFire, mdiFlash, mdiFlower, mdiGamepadVariant,
  mdiGithub, mdiHammerWrench, mdiHeart, mdiHexagonMultiple, mdiHome, mdiImageFilterHdr, mdiInfinity,
  mdiInstagram, mdiLeaf, mdiLightbulbOn, mdiLinkedin, mdiMapMarker, mdiMastodon, mdiMusic, mdiPalette, mdiPaw,
  mdiPencil, mdiPhone, mdiPrinter3d, mdiPrinter3dNozzle, mdiRobot, mdiRocketLaunch, mdiScaleBalance,
  mdiSilverwareForkKnife, mdiSprout, mdiStar, mdiStethoscope, mdiTooth, mdiTree, mdiWeb, mdiWhiteBalanceSunny,
  mdiWrench, mdiYoga, mdiYoutube,
} from '@mdi/js';

/* ------------------------------------------------------------------ */
/* Card sizes                                                          */
/* ------------------------------------------------------------------ */

export const CARD_SIZES = {
  eu: { width: 85, height: 55 },
  us: { width: 88.9, height: 50.8 },
  creditCard: { width: 85.6, height: 53.98 },
  japan: { width: 91, height: 55 },
  square: { width: 65, height: 65 },
  custom: null,
} as const;

export type CardSizeId = keyof typeof CARD_SIZES;

/* ------------------------------------------------------------------ */
/* Icons (Material Design Icons, Apache 2.0; X logo from Simple Icons, CC0) */
/* ------------------------------------------------------------------ */

const X_LOGO = 'M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z';

export const CONTACT_TYPES = {
  phone: { icon: mdiPhone, placeholder: '+49 30 1234567' },
  mobile: { icon: mdiCellphone, placeholder: '+49 151 2345678' },
  email: { icon: mdiEmail, placeholder: 'name@example.com' },
  website: { icon: mdiWeb, placeholder: 'example.com' },
  address: { icon: mdiMapMarker, placeholder: 'Main Street 1, Berlin' },
  linkedin: { icon: mdiLinkedin, placeholder: 'in/yourname' },
  github: { icon: mdiGithub, placeholder: 'yourname' },
  instagram: { icon: mdiInstagram, placeholder: '@yourname' },
  x: { icon: X_LOGO, placeholder: '@yourname' },
  mastodon: { icon: mdiMastodon, placeholder: '@you@mastodon.social' },
  youtube: { icon: mdiYoutube, placeholder: '@yourchannel' },
  facebook: { icon: mdiFacebook, placeholder: 'yourname' },
  other: { icon: mdiAt, placeholder: '' },
} as const;

export type ContactType = keyof typeof CONTACT_TYPES;

export const LOGO_ICONS: Record<string, string> = {
  printer3d: mdiPrinter3d,
  nozzle: mdiPrinter3dNozzle,
  cube: mdiCube,
  cubeOutline: mdiCubeOutline,
  hexagons: mdiHexagonMultiple,
  diamond: mdiDiamondStone,
  star: mdiStar,
  heart: mdiHeart,
  crown: mdiCrown,
  infinity: mdiInfinity,
  flash: mdiFlash,
  fire: mdiFire,
  sun: mdiWhiteBalanceSunny,
  lightbulb: mdiLightbulbOn,
  rocket: mdiRocketLaunch,
  atom: mdiAtom,
  robot: mdiRobot,
  code: mdiCodeTags,
  gamepad: mdiGamepadVariant,
  camera: mdiCamera,
  aperture: mdiCameraIris,
  palette: mdiPalette,
  brush: mdiBrush,
  pencil: mdiPencil,
  music: mdiMusic,
  wrench: mdiWrench,
  tools: mdiHammerWrench,
  briefcase: mdiBriefcase,
  scale: mdiScaleBalance,
  stethoscope: mdiStethoscope,
  tooth: mdiTooth,
  leaf: mdiLeaf,
  sprout: mdiSprout,
  tree: mdiTree,
  flower: mdiFlower,
  mountains: mdiImageFilterHdr,
  earth: mdiEarth,
  compass: mdiCompass,
  anchor: mdiAnchor,
  feather: mdiFeather,
  paw: mdiPaw,
  bicycle: mdiBicycle,
  dumbbell: mdiDumbbell,
  yoga: mdiYoga,
  coffee: mdiCoffee,
  food: mdiSilverwareForkKnife,
  home: mdiHome,
  person: mdiAccount,
};

/* ------------------------------------------------------------------ */
/* Layout templates                                                    */
/* ------------------------------------------------------------------ */

export const TEMPLATES = {
  classic: { qr: true },
  split: { qr: true },
  accent: { qr: true },
  centered: { qr: false },
  minimal: { qr: false },
  monogram: { qr: false },
} as const;

export type TemplateId = keyof typeof TEMPLATES;

/* ------------------------------------------------------------------ */
/* Colors and style presets                                            */
/* ------------------------------------------------------------------ */

/** Common filament colors, so the preview looks like the print. */
export const FILAMENT_COLORS = [
  { id: 'white', hex: '#f4f4f1' },
  { id: 'ivory', hex: '#efe6d2' },
  { id: 'silver', hex: '#a9adb3' },
  { id: 'grey', hex: '#62666d' },
  { id: 'black', hex: '#1b1c1e' },
  { id: 'gold', hex: '#c9a447' },
  { id: 'copper', hex: '#b8734a' },
  { id: 'wood', hex: '#a07a52' },
  { id: 'red', hex: '#c8312f' },
  { id: 'orange', hex: '#e7782c' },
  { id: 'yellow', hex: '#f1c232' },
  { id: 'green', hex: '#2f8f5b' },
  { id: 'teal', hex: '#1f8a8a' },
  { id: 'blue', hex: '#2f5fb3' },
  { id: 'navy', hex: '#1f2a4d' },
  { id: 'purple', hex: '#6b46a8' },
  { id: 'pink', hex: '#e07aa6' },
] as const;
