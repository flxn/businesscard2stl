<template>
  <div class="gallery" role="radiogroup" :aria-label="t('tool.layout')">
    <button
      v-for="id in templateIds"
      :key="id"
      type="button"
      class="gallery__item"
      :class="{ 'is-active': model === id }"
      role="radio"
      :aria-checked="model === id ? 'true' : 'false'"
      :style="thumbColors"
      @click="model = id"
    >
      <TemplateThumb :template="id" />
      <span class="gallery__name">
        {{ t(`tool.templates.${id}.name`) }}
        <span v-if="TEMPLATES[id].qr" class="gallery__badge">{{ t('tool.withQr') }}</span>
      </span>
      <span class="gallery__description">{{ t(`tool.templates.${id}.description`) }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { TEMPLATES, type TemplateId } from '../catalog';
import TemplateThumb from './TemplateThumb.vue';

const props = defineProps<{
  /** card colors, so the thumbnails show the current design */
  colors: { base: string; text: string; accent: string };
}>();

const model = defineModel<TemplateId>({ required: true });
const { t } = useI18n();
const templateIds = Object.keys(TEMPLATES) as TemplateId[];

const thumbColors = computed(() => ({
  '--thumb-card': props.colors.base,
  '--thumb-ink': props.colors.text,
  '--thumb-accent': props.colors.accent,
}));
</script>

<style scoped>
.gallery {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.gallery__item {
  display: grid;
  gap: 4px;
  padding: 8px 8px 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface-inset);
  color: var(--text);
  text-align: left;
  transition: border-color var(--duration) ease, box-shadow var(--duration) ease, transform var(--duration-fast) ease;
}

.gallery__item:hover {
  border-color: var(--border-hover);
  transform: translateY(-1px);
}

.gallery__item.is-active {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-ring);
}

.gallery__item:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

.gallery__item :deep(.thumb) {
  margin-bottom: 4px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.12));
}

.gallery__name {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
}

.gallery__badge {
  padding: 1px 5px;
  border-radius: 4px;
  background: var(--accent-soft);
  color: var(--accent-text);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.gallery__description {
  color: var(--text-3);
  font-size: 11.5px;
  line-height: 1.35;
}
</style>
