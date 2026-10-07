<template>
  <svg class="thumb" viewBox="0 0 85 55" aria-hidden="true">
    <rect class="thumb__card" x="0.75" y="0.75" width="83.5" height="53.5" rx="4" />
    <template v-if="template === 'classic' || template === 'accent'">
      <rect v-if="template === 'accent'" class="thumb__accent" x="0.75" y="0.75" width="8" height="53.5" rx="3" />
      <g :transform="template === 'accent' ? 'translate(8 0)' : undefined">
        <rect class="thumb__ink" x="7" y="8" width="30" height="4.5" rx="1" />
        <rect class="thumb__soft" x="7" y="15.5" width="20" height="2.4" rx="1" />
        <g v-for="row in 3" :key="row">
          <circle class="thumb__accent" :cx="8.2" :cy="31 + row * 4.6" r="1.3" />
          <rect class="thumb__soft" x="11" :y="29.9 + row * 4.6" :width="24 - row * 3" height="2.2" rx="1" />
        </g>
      </g>
      <circle v-if="template === 'classic'" class="thumb__accent" cx="72" cy="12" r="4.5" />
      <g transform="translate(56 30)"><QrGlyph :size="19" /></g>
    </template>
    <template v-else-if="template === 'split'">
      <g transform="translate(7 15)"><QrGlyph :size="25" /></g>
      <rect class="thumb__accent" x="38" y="12" width="0.9" height="31" />
      <rect class="thumb__ink" x="45" y="14" width="28" height="4.5" rx="1" />
      <rect class="thumb__soft" x="45" y="21.5" width="18" height="2.4" rx="1" />
      <g v-for="row in 3" :key="row">
        <circle class="thumb__accent" cx="46.2" :cy="24 + row * 4.6" r="1.3" />
        <rect class="thumb__soft" x="49" :y="22.9 + row * 4.6" :width="22 - row * 3" height="2.2" rx="1" />
      </g>
    </template>
    <template v-else-if="template === 'centered'">
      <circle class="thumb__accent" cx="42.5" cy="11" r="3.6" />
      <rect class="thumb__ink" x="24" y="18" width="37" height="4.5" rx="1" />
      <rect class="thumb__soft" x="31" y="25.5" width="23" height="2.4" rx="1" />
      <rect class="thumb__accent" x="35" y="31" width="15" height="0.9" />
      <rect v-for="row in 3" :key="row" class="thumb__soft" :x="28 + row * 1.5" :y="31.5 + row * 4.4" :width="29 - row * 3" height="2.2" rx="1" />
    </template>
    <template v-else-if="template === 'minimal'">
      <rect class="thumb__ink" x="17" y="20" width="51" height="6.5" rx="1.2" />
      <rect class="thumb__soft" x="28" y="30" width="29" height="2.4" rx="1" />
      <rect class="thumb__soft" x="32" y="45" width="21" height="2.2" rx="1" />
    </template>
    <template v-else-if="template === 'monogram'">
      <circle class="thumb__ring" cx="20" cy="27.5" r="12" />
      <rect class="thumb__ink" x="14" y="25" width="12" height="5" rx="1" />
      <rect class="thumb__ink" x="39" y="13" width="30" height="4.5" rx="1" />
      <rect class="thumb__soft" x="39" y="20.5" width="20" height="2.4" rx="1" />
      <g v-for="row in 3" :key="row">
        <circle class="thumb__accent" cx="40.2" :cy="25 + row * 4.6" r="1.3" />
        <rect class="thumb__soft" x="43" :y="23.9 + row * 4.6" :width="24 - row * 3" height="2.2" rx="1" />
      </g>
    </template>
  </svg>
</template>

<script setup lang="ts">
/** Schematic preview of a layout template. */
import type { TemplateId } from '../catalog';
import QrGlyph from './QrGlyph.vue';

defineProps<{ template: TemplateId }>();
</script>

<style scoped>
.thumb {
  display: block;
  width: 100%;
  height: auto;
}

.thumb__card {
  fill: var(--thumb-card, var(--surface));
  stroke: var(--border-strong);
  stroke-width: 1.5;
}

.thumb__ink {
  fill: var(--thumb-ink, var(--text));
}

.thumb__soft {
  fill: var(--thumb-ink, var(--text));
  opacity: 0.45;
}

.thumb__accent {
  fill: var(--thumb-accent, var(--accent));
}

.thumb__ring {
  fill: none;
  stroke: var(--thumb-accent, var(--accent));
  stroke-width: 1.4;
}
</style>
