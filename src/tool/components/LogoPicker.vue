<template>
  <div class="logo-picker">
    <UiSegmented v-model="logo.type" block :options="typeOptions" :aria-label="t('tool.logo')" />

    <div v-if="logo.type === 'icon'" class="icon-grid" role="radiogroup" :aria-label="t('tool.logoIcon')">
      <button
        v-for="(path, id) in LOGO_ICONS"
        :key="id"
        type="button"
        class="icon-grid__item"
        :class="{ 'is-active': logo.icon === id }"
        role="radio"
        :aria-checked="logo.icon === id ? 'true' : 'false'"
        :aria-label="String(id)"
        @click="logo.icon = String(id)"
      >
        <MdiIcon :path="path" />
      </button>
    </div>

    <label
      v-else-if="logo.type === 'custom'"
      class="file-drop"
      :class="{ 'is-dragover': dragover }"
      @dragover.prevent="dragover = true"
      @dragleave="dragover = false"
      @drop.prevent="onDrop"
    >
      <input type="file" accept=".svg,image/svg+xml" @change="onFile" />
      <span class="file-drop__icon">
        <svg v-if="logo.custom" class="logo-preview" :viewBox="`0 0 ${logo.custom.width} ${logo.custom.height}`" aria-hidden="true">
          <path :d="previewPath" fill="currentColor" fill-rule="evenodd" />
        </svg>
        <UiIcon v-else name="upload" />
      </span>
      <span class="file-drop__text">
        <span class="file-drop__title">{{ logo.custom ? logo.custom.name : t('tool.logoUploadTitle') }}</span>
        <span>{{ logo.custom ? t('tool.logoReplace') : t('tool.logoUploadHint') }}</span>
      </span>
    </label>
  </div>
</template>

<script setup lang="ts">
import * as THREE from 'three';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import UiIcon from '@/core/components/ui/UiIcon.vue';
import UiSegmented from '@/core/components/ui/UiSegmented.vue';
import { toast } from '@/core/composables/useToasts';
import { LOGO_ICONS } from '../catalog';
import type { CustomLogo, ToolOptions } from '../options';
import MdiIcon from './MdiIcon.vue';

/** the logo is normalized to this size, so stored coordinates need only two decimals */
const NORMALIZED_SIZE = 1000;
const MAX_POINTS = 40000;

const logo = defineModel<ToolOptions['logo']>({ required: true });
const { t } = useI18n();
const dragover = ref(false);

const typeOptions = computed(() => [
  { value: 'none' as const, label: t('tool.logoNone') },
  { value: 'icon' as const, label: t('tool.logoIcon') },
  { value: 'custom' as const, label: t('tool.logoUpload') },
]);

const previewPath = computed(() => (logo.value.custom?.polygons ?? []).map((polygon) => [polygon.outer, ...polygon.holes]
  .map((ring) => `M${ring.join(' ')}Z`).join('')).join(''));

const isWhite = (fill: string | undefined) => !!fill && /^(#fff(fff)?|white|rgb\(255,\s*255,\s*255\))$/i.test(fill.trim());

/**
 * Converts an SVG into polygons in the browser (SVGLoader needs the DOM, the model worker has none).
 * Filled paths become shapes; unfilled lines and white fills are skipped.
 */
const parseSvg = (text: string, name: string): CustomLogo => {
  const data = new SVGLoader().parse(text);
  const shapes = data.paths.flatMap((path) => {
    const style = (path.userData as { style?: { fill?: string } } | undefined)?.style;
    if (!style?.fill || style.fill === 'none' || style.fill === 'transparent' || isWhite(style.fill)) {
      return [];
    }
    return path.toShapes();
  });
  if (!shapes.length) {
    throw new Error(t('tool.logoNoShapes'));
  }
  const rings = shapes.map((shape) => shape.extractPoints(10));
  const box = new THREE.Box2();
  rings.forEach((ring) => ring.shape.forEach((point) => box.expandByPoint(point)));
  const size = box.getSize(new THREE.Vector2());
  const scale = NORMALIZED_SIZE / Math.max(size.x, size.y, 1e-6);
  const flat = (points: THREE.Vector2[]) => points.flatMap((point) => [
    Math.round((point.x - box.min.x) * scale * 100) / 100,
    Math.round((point.y - box.min.y) * scale * 100) / 100,
  ]);
  const polygons = rings.map((ring) => ({ outer: flat(ring.shape), holes: ring.holes.map(flat) }));
  const points = polygons.reduce((sum, polygon) => sum + polygon.outer.length + polygon.holes.flat().length, 0) / 2;
  if (points > MAX_POINTS) {
    throw new Error(t('tool.logoTooComplex'));
  }
  return {
    name,
    width: Math.round(size.x * scale * 100) / 100,
    height: Math.round(size.y * scale * 100) / 100,
    polygons,
  };
};

const load = async (file: File | undefined) => {
  if (!file) {
    return;
  }
  try {
    const text = await file.text();
    if (!/<svg[\s>]/i.test(text)) {
      throw new Error(t('tool.logoInvalid'));
    }
    logo.value.custom = parseSvg(text, file.name);
    toast({ type: 'success', message: t('tool.logoLoaded') });
  } catch (error) {
    toast({ type: 'error', message: error instanceof Error ? error.message : t('tool.logoInvalid') });
  }
};

const onFile = (event: Event) => {
  const input = event.target as HTMLInputElement;
  load(input.files?.[0]);
  input.value = '';
};

const onDrop = (event: DragEvent) => {
  dragover.value = false;
  load(event.dataTransfer?.files[0]);
};
</script>

<style scoped>
.logo-picker {
  display: grid;
  gap: 10px;
}

.icon-grid {
  display: grid;
  grid-template-columns: repeat(8, minmax(0, 1fr));
  gap: 4px;
  max-height: 186px;
  padding: 6px;
  overflow-y: auto;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface-inset);
}

.icon-grid__item {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1;
  padding: 0;
  border: 1px solid transparent;
  border-radius: var(--radius-xs);
  background: transparent;
  color: var(--text-2);
  font-size: 17px;
  transition: background-color var(--duration-fast) ease, color var(--duration-fast) ease;
}

.icon-grid__item:hover {
  background: var(--surface-hover);
  color: var(--text);
}

.icon-grid__item.is-active {
  border-color: var(--accent);
  background: var(--accent-soft);
  color: var(--accent-text);
}

.logo-preview {
  width: 24px;
  height: 24px;
}
</style>
