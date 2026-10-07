import { describe, expect, it } from 'vitest';
import { cloneOptions, mergeKnownOptions } from '@/core/utils/options';
import { defaultOptions, normalizeOptions, type ToolOptions } from './options';

const load = (saved: unknown) => {
  const options = cloneOptions(defaultOptions);
  mergeKnownOptions(options as unknown as Record<string, unknown>, saved);
  normalizeOptions(options);
  return options;
};

describe('normalizeOptions', () => {
  it('keeps valid saved settings', () => {
    const saved: ToolOptions = cloneOptions(defaultOptions);
    saved.content.name = 'Jane Doe';
    saved.content.contacts = [{ type: 'github', value: 'jane' }];
    saved.template = 'monogram';
    saved.typography.nameSize = Number.NaN;
    const options = load(JSON.parse(JSON.stringify(saved)));
    expect(options.content.name).toBe('Jane Doe');
    expect(options.content.contacts).toEqual([{ type: 'github', value: 'jane' }]);
    expect(options.template).toBe('monogram');
    // an emptied number field survives the JSON round trip as NaN
    expect(options.typography.nameSize).toBeNaN();
  });

  it('repairs values that no longer exist', () => {
    const options = load({
      template: 'retro',
      content: { contacts: [{ type: 'fax', value: '123' }, { type: 'email', value: 42 }, null, { type: 'phone', value: '1' }] },
      logo: { type: 'custom', custom: { name: 'x', polygons: 'broken' } },
      typography: { heading: 'comic-sans' },
      colors: { base: 'red' },
      card: { size: 'a4', relief: 'embossed' },
    });
    expect(options.template).toBe(defaultOptions.template);
    expect(options.content.contacts).toEqual([{ type: 'phone', value: '1' }]);
    expect(options.logo).toMatchObject({ type: 'none', custom: null });
    expect(options.typography.heading).toBe(defaultOptions.typography.heading);
    expect(options.colors.base).toBe(defaultOptions.colors.base);
    expect(options.card).toMatchObject({ size: 'eu', relief: 'raised' });
  });
});
