<template>
  <g class="qr-glyph">
    <rect v-for="(cell, index) in cells" :key="index" :x="cell[0] * unit" :y="cell[1] * unit" :width="unit" :height="unit" />
  </g>
</template>

<script setup lang="ts">
/** A decorative QR-like pattern for thumbnails (not a real code). */
import { computed } from 'vue';

const props = defineProps<{ size: number }>();

const PATTERN = [
  '1111101011111',
  '1000101010001',
  '1011100110111',
  '1011101011101',
  '1000100100001',
  '1111101011111',
  '0000011010000',
  '1101110111011',
  '0010001100100',
  '1111100101101',
  '1000101101010',
  '1011100011011',
  '1111101101101',
];

const unit = computed(() => props.size / PATTERN.length);
const cells = PATTERN.flatMap((row, y) => Array.from(row).flatMap((value, x) => (value === '1' ? [[x, y]] : [])));
</script>

<style scoped>
.qr-glyph rect {
  fill: var(--thumb-ink, var(--text));
}
</style>
