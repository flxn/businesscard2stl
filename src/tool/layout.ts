import type * as THREE from 'three';

/**
 * A tiny box layout for the card, measured in mm with Y pointing down from the card's top left
 * corner (like CSS). Boxes are measured first; `place` then emits the shapes at their final position.
 * Templates combine leaves (text, icons, QR code, rules) with stacks.
 */

export type PartGroup = 'text' | 'icons' | 'qr' | 'decor';

export interface Output {
  add(group: PartGroup, shapes: THREE.Shape[]): void;
  /** card coordinates (mm, Y down) to world coordinates (Y up, centered on the card) */
  toWorld(x: number, y: number): [number, number];
}

export interface Box {
  w: number;
  h: number;
  /** false if a stack with a fixed size is too small for its content */
  fits: boolean;
  place(x: number, y: number, out: Output): void;
}

type Align = 'start' | 'center' | 'end';
type Justify = 'start' | 'center' | 'end' | 'between';

export const leaf = (w: number, h: number, place: Box['place'] = () => {}): Box => ({
  w, h, fits: true, place,
});

export const spacer = (w = 0, h = 0): Box => leaf(w, h);

const present = (children: (Box | null | false | undefined)[]) => children.filter((child): child is Box => !!child);

const offset = (free: number, align: Align) => {
  if (align === 'center') return free / 2;
  if (align === 'end') return free;
  return 0;
};

const stack = (
  axis: 'x' | 'y',
  items: (Box | null | false | undefined)[],
  {
    gap = 0, align = 'start', justify = 'start', size, cross,
  }: { gap?: number; align?: Align; justify?: Justify; size?: number; cross?: number },
): Box | null => {
  const children = present(items);
  if (!children.length) return null;
  const main = (box: Box) => (axis === 'x' ? box.w : box.h);
  const other = (box: Box) => (axis === 'x' ? box.h : box.w);
  const natural = children.reduce((sum, child) => sum + main(child), 0) + gap * (children.length - 1);
  const naturalCross = Math.max(...children.map(other));
  const length = size ?? natural;
  const breadth = cross ?? naturalCross;
  const fits = children.every((child) => child.fits) && natural <= length + 1e-6 && naturalCross <= breadth + 1e-6;

  return {
    w: axis === 'x' ? length : breadth,
    h: axis === 'x' ? breadth : length,
    fits,
    place(x, y, out) {
      const free = Math.max(0, length - natural);
      let spacing = gap;
      let position = 0;
      if (justify === 'between' && children.length > 1) {
        spacing = gap + free / (children.length - 1);
      } else if (justify === 'center') {
        position = free / 2;
      } else if (justify === 'end') {
        position = free;
      }
      children.forEach((child) => {
        const across = offset(breadth - other(child), align);
        if (axis === 'x') child.place(x + position, y + across, out);
        else child.place(x + across, y + position, out);
        position += main(child) + spacing;
      });
    },
  };
};

/** Children side by side; `align` positions them vertically, `width` fixes the row width. */
export const hstack = (
  children: (Box | null | false | undefined)[],
  options: { gap?: number; align?: Align; justify?: Justify; width?: number; height?: number } = {},
) => stack('x', children, { ...options, size: options.width, cross: options.height });

/** Children below each other; `align` positions them horizontally, `height` fixes the column height. */
export const vstack = (
  children: (Box | null | false | undefined)[],
  options: { gap?: number; align?: Align; justify?: Justify; width?: number; height?: number } = {},
) => stack('y', children, { ...options, size: options.height, cross: options.width });

/** A box that draws `content` and reserves exactly its size, regardless of what is inside. */
export const fixed = (w: number, h: number, content: (Box | null)[]): Box => leaf(w, h, (x, y, out) => {
  content.forEach((child) => child?.place(x + (w - child.w) / 2, y + (h - child.h) / 2, out));
});
