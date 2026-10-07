import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import type { ModelWarning, WarningParams } from '@/core/types';
import { cloneOptions } from '@/core/utils/options';
import { TEMPLATES, type TemplateId } from './catalog';
import generateModel from './generator';
import { defaultOptions, type ToolOptions } from './options';
import { buildVcard, qrPayload } from './qr';

const run = async (change: (options: ToolOptions) => void = () => {}) => {
  const options = cloneOptions(defaultOptions);
  change(options);
  const warnings: ModelWarning[] = [];
  const started = performance.now();
  const parts = await generateModel(options, {
    warn: (code: string, params?: WarningParams) => warnings.push({ code, params }),
  });
  return {
    parts, warnings, codes: warnings.map((warning) => warning.code), duration: performance.now() - started,
  };
};

const box = (geometry: THREE.BufferGeometry) => {
  geometry.computeBoundingBox();
  return geometry.boundingBox!;
};

describe('business card generator', () => {
  it('builds the default card', async () => {
    const { parts, codes } = await run();
    expect(codes).toEqual([]);
    expect(parts.map((part) => part.name)).toEqual(['base', 'text', 'icons', 'qr']);
    const base = box(parts[0].geometry).getSize(new THREE.Vector3());
    expect(base.x).toBeCloseTo(85, 3);
    expect(base.y).toBeCloseTo(55, 3);
    expect(base.z).toBeCloseTo(1.2, 3);
    // raised details stand on the card and stay inside it
    parts.slice(1).forEach((part) => {
      const b = box(part.geometry);
      expect(b.min.z).toBeCloseTo(1.2, 3);
      expect(b.max.z).toBeCloseTo(1.8, 3);
      expect(b.min.x).toBeGreaterThanOrEqual(-42.5 + 4.9);
      expect(b.max.x).toBeLessThanOrEqual(42.5 - 4.9);
      expect(b.min.y).toBeGreaterThanOrEqual(-27.5 + 4.9);
      expect(b.max.y).toBeLessThanOrEqual(27.5 - 4.9);
    });
  });

  it.each(Object.keys(TEMPLATES) as TemplateId[])('lays out the %s template', async (template) => {
    const { parts, codes } = await run((options) => {
      options.template = template;
      options.qr.enabled = TEMPLATES[template].qr;
    });
    expect(codes.filter((code) => code !== 'textScaled')).toEqual([]);
    expect(parts.find((part) => part.name === 'text')).toBeDefined();
  });

  it('engraves the details into the card', async () => {
    const raised = await run();
    const { parts, codes } = await run((options) => {
      options.card.relief = 'engraved';
    });
    expect(codes).toEqual([]);
    expect(parts.map((part) => part.name)).toEqual(['base']);
    expect(box(parts[0].geometry).max.z).toBeCloseTo(1.2, 3);
    const triangles = (geometry: THREE.BufferGeometry) => geometry.getAttribute('position').count / 3;
    expect(triangles(parts[0].geometry)).toBeGreaterThan(triangles(raised.parts[0].geometry) * 10);
  });

  it('inlays mirrored details face down', async () => {
    const { parts, codes } = await run((options) => {
      options.card.relief = 'inlay';
      options.card.faceDown = true;
    });
    expect(codes).toEqual(['faceDown']);
    const text = parts.find((part) => part.name === 'text')!;
    expect(box(text.geometry).min.z).toBeCloseTo(0, 3);
    expect(box(text.geometry).max.z).toBeCloseTo(0.6, 3);
  });

  it('shrinks text that does not fit and reports it', async () => {
    const { codes, warnings } = await run((options) => {
      options.content.name = 'Maximilian Alexander Hohenzollern';
    });
    expect(codes).toContain('textScaled');
    expect(warnings.find((warning) => warning.code === 'textScaled')!.params!.percent).toBeLessThan(100);
  });

  // width of the name, i.e. of the text vertices in the top line of the card
  const nameWidth = (parts: { name: string; geometry: THREE.BufferGeometry }[], top: number) => {
    const position = parts.find((part) => part.name === 'text')!.geometry.getAttribute('position');
    let min = Infinity;
    let max = -Infinity;
    for (let i = 0; i < position.count; i += 1) {
      if (position.getY(i) > top) {
        min = Math.min(min, position.getX(i));
        max = Math.max(max, position.getX(i));
      }
    }
    return max - min;
  };

  it('shrinks only the contacts when they grow too big', async () => {
    const normal = await run();
    const large = await run((options) => {
      options.content.contacts[1].value = 'contact@flxn-studio.de';
      options.typography.detailSize = 4;
    });
    expect(large.codes).toContain('textScaled');
    // the name block is untouched
    expect(nameWidth(large.parts, 18)).toBeCloseTo(nameWidth(normal.parts, 18), 3);
  });

  it('scales all text with the text scale', async () => {
    const normal = await run();
    const smaller = await run((options) => {
      options.typography.scale = 80;
    });
    expect(nameWidth(smaller.parts, 20) / nameWidth(normal.parts, 18)).toBeCloseTo(0.8, 2);
  });

  it('warns about dense QR codes and unsupported combinations', async () => {
    const dense = await run((options) => {
      options.qr.content = 'vcard';
      options.qr.size = 14;
    });
    expect(dense.codes).toContain('qrDense');
    const unsupported = await run((options) => {
      options.template = 'centered';
    });
    expect(unsupported.codes).toEqual(['qrUnsupported']);
  });

  it('inverts the QR code on dark cards', async () => {
    const light = await run();
    const dark = await run((options) => {
      options.colors.base = '#1b1c1e';
      options.colors.text = '#f4f4f1';
    });
    const qrBox = (result: typeof light) => box(result.parts.find((part) => part.name === 'qr')!.geometry).getSize(new THREE.Vector3());
    // the inverted code includes its quiet zone, so it covers the full QR area
    expect(qrBox(dark).x).toBeCloseTo(24, 3);
    expect(qrBox(light).x).toBeLessThanOrEqual(24);
  });
});

describe('QR payload', () => {
  it('builds a compact vCard with only filled fields', () => {
    const vcard = buildVcard(defaultOptions);
    expect(vcard).toContain('FN:Felix Stein');
    expect(vcard).toContain('N:Stein;Felix;;;');
    expect(vcard).toContain('EMAIL:spam@flxn.de');
    expect(vcard).toContain('URL:https://flxn.de');
    expect(vcard).not.toContain('ORG');
    expect(vcard).not.toContain('ADR');
  });

  it('uses the website contact for website codes', () => {
    expect(qrPayload(defaultOptions)).toBe('https://flxn.de');
  });
});
