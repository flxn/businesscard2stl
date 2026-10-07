<template>
  <div class="qr-preview">
    <svg
      v-if="matrix"
      class="qr-preview__code"
      :viewBox="`-2 -2 ${matrix.size + 4} ${matrix.size + 4}`"
      shape-rendering="crispEdges"
      role="img"
      :aria-label="t('tool.qrScanTest')"
    >
      <rect x="-2" y="-2" :width="matrix.size + 4" :height="matrix.size + 4" fill="#fff" />
      <path :d="path" fill="#000" />
    </svg>
    <div v-else class="qr-preview__empty">
      <UiIcon name="qr-code" />
    </div>
    <div class="qr-preview__info">
      <template v-if="matrix">
        <p class="qr-preview__stats" :class="{ 'is-dense': moduleSize < 0.8 }">
          <UiIcon v-if="moduleSize < 0.8" name="alert" />
          {{ t('tool.qrStats', { version: matrix.version, modules: matrix.size, module: moduleSize.toFixed(2) }) }}
        </p>
        <p class="field-hint">{{ t('tool.qrScanTest') }}</p>
      </template>
      <p v-else class="field-hint">{{ emptyText }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
/** The QR code as a plain 2D image to test with a phone, plus its module size on the print. */
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import UiIcon from '@/core/components/ui/UiIcon.vue';
import type { QrMatrix } from '../qr';

const props = defineProps<{
  matrix: QrMatrix | null;
  /** printed size in mm (including the quiet zone when the code is inverted) */
  size: number;
  quietZone: number;
  emptyText: string;
}>();

const { t } = useI18n();

const moduleSize = computed(() => (props.matrix ? props.size / (props.matrix.size + 2 * props.quietZone) : 0));

const path = computed(() => {
  const { matrix } = props;
  if (!matrix) return '';
  let d = '';
  for (let row = 0; row < matrix.size; row += 1) {
    for (let column = 0; column < matrix.size; column += 1) {
      if (matrix.isDark(column, row)) d += `M${column} ${row}h1v1h-1z`;
    }
  }
  return d;
});
</script>

<style scoped>
.qr-preview {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface-inset);
}

.qr-preview__code,
.qr-preview__empty {
  flex-shrink: 0;
  width: 96px;
  height: 96px;
  border-radius: 6px;
}

.qr-preview__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1.5px dashed var(--border-strong);
  color: var(--text-3);
}

.qr-preview__empty .svg-icon {
  width: 30px;
  height: 30px;
}

.qr-preview__info {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.qr-preview__info p {
  margin: 0;
}

.qr-preview__stats {
  display: flex;
  align-items: flex-start;
  gap: 5px;
  color: var(--text);
  font-size: 13px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.qr-preview__stats.is-dense {
  color: var(--warning-text);
}

.qr-preview__stats .svg-icon {
  width: 15px;
  height: 15px;
  margin-top: 1px;
}
</style>
