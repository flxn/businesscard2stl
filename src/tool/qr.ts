import QRCode from 'qrcode';
import type { ToolOptions } from './options';

export interface QrMatrix {
  size: number;
  version: number;
  isDark: (column: number, row: number) => boolean;
}

const escapeVcard = (value: string) => value.replace(/\\/g, '\\\\').replace(/[,;]/g, (char) => `\\${char}`);

const withProtocol = (url: string) => (/^[a-z][a-z0-9+.-]*:/i.test(url) ? url : `https://${url}`);

/** Profile URLs for the social contact types, so vCard and website QR codes open the right page. */
const socialUrl = (type: string, value: string): string | null => {
  const handle = value.trim().replace(/^@/, '');
  if (!handle) return null;
  if (/^https?:\/\//i.test(handle)) return handle;
  switch (type) {
    case 'linkedin': return `https://www.linkedin.com/${handle.startsWith('in/') ? handle : `in/${handle}`}`;
    case 'github': return `https://github.com/${handle}`;
    case 'instagram': return `https://instagram.com/${handle}`;
    case 'x': return `https://x.com/${handle}`;
    case 'youtube': return `https://youtube.com/@${handle}`;
    case 'facebook': return `https://facebook.com/${handle}`;
    default: return null;
  }
};

/** A compact vCard 3.0 with only the filled fields (every character makes the code denser). */
export const buildVcard = ({ content }: Pick<ToolOptions, 'content'>): string => {
  const name = content.name.trim();
  const parts = name.split(/\s+/);
  const last = parts.length > 1 ? parts.pop()! : '';
  const lines = ['BEGIN:VCARD', 'VERSION:3.0', `N:${escapeVcard(last)};${escapeVcard(parts.join(' '))};;;`, `FN:${escapeVcard(name)}`];
  if (content.company.trim()) lines.push(`ORG:${escapeVcard(content.company.trim())}`);
  if (content.title.trim()) lines.push(`TITLE:${escapeVcard(content.title.trim())}`);
  content.contacts.forEach(({ type, value }) => {
    const text = value.trim();
    if (!text) return;
    if (type === 'phone') lines.push(`TEL;TYPE=WORK:${text}`);
    else if (type === 'mobile') lines.push(`TEL;TYPE=CELL:${text}`);
    else if (type === 'email') lines.push(`EMAIL:${text}`);
    else if (type === 'website') lines.push(`URL:${withProtocol(text)}`);
    else if (type === 'address') lines.push(`ADR;TYPE=WORK:;;${escapeVcard(text)};;;;`);
    else {
      const url = socialUrl(type, text);
      if (url) lines.push(`URL:${url}`);
    }
  });
  lines.push('END:VCARD');
  return lines.join('\n');
};

/** The text encoded in the QR code. Empty when there is nothing to encode. */
export const qrPayload = (options: Pick<ToolOptions, 'qr' | 'content'>): string => {
  if (options.qr.content === 'custom') {
    return options.qr.text.trim();
  }
  if (options.qr.content === 'website') {
    const website = options.content.contacts.find((contact) => contact.type === 'website' && contact.value.trim());
    return website ? withProtocol(website.value.trim()) : '';
  }
  return options.content.name.trim() || options.content.contacts.some((contact) => contact.value.trim()) ? buildVcard(options) : '';
};

export const createQr = (text: string, errorCorrectionLevel: ToolOptions['qr']['errorCorrection']): QrMatrix => {
  const code = QRCode.create(text, { errorCorrectionLevel });
  const { size } = code.modules;
  return {
    size,
    version: code.version,
    isDark: (column, row) => code.modules.get(row, column) === 1,
  };
};
