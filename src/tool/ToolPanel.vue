<template>
  <div class="tool-panel">
    <UiTabs v-model="tab" class="panel-tabs" :tabs="tabs" :aria-label="t('settingsPanel')" />

    <div class="tab-panels">
      <!-- design -->
      <div v-show="tab === 'design'" class="tab-panel" role="tabpanel">
        <UiSection :title="t('tool.layout')" default-open>
          <TemplateGallery v-model="options.template" :colors="options.colors" />
        </UiSection>

        <UiSection :title="t('tool.stylePresets')" default-open>
          <p class="field-hint">{{ t('tool.stylePresetsHelp') }}</p>
          <div class="presets">
            <button
              v-for="(preset, id) in STYLE_PRESETS"
              :key="id"
              type="button"
              class="preset"
              :class="{ 'is-active': activePreset === id }"
              :style="{ background: preset.colors.base, color: preset.colors.text }"
              @click="applyPreset(String(id))"
            >
              <span class="preset__name" :style="{ fontFamily: `'preview-${preset.typography.heading}', var(--font-sans)` }">
                {{ t(`tool.presets.${id}`) }}
              </span>
              <span class="preset__dot" :style="{ background: preset.colors.accent }"></span>
            </button>
          </div>
        </UiSection>

        <UiSection :title="t('tool.colors')" default-open>
          <p class="field-hint">{{ t('tool.colorsHelp') }}</p>
          <UiField :label="t('tool.colorBase')" stack>
            <ColorSwatches v-model="options.colors.base" :label="t('tool.colorBase')" />
          </UiField>
          <UiField :label="t('tool.colorText')" stack>
            <ColorSwatches v-model="options.colors.text" :label="t('tool.colorText')" />
          </UiField>
          <UiField :label="t('tool.colorAccent')" stack>
            <ColorSwatches v-model="options.colors.accent" :label="t('tool.colorAccent')" />
          </UiField>
        </UiSection>

        <UiSection :title="t('tool.typography')">
          <UiField :label="t('tool.headingFont')" stack>
            <FontPicker v-model="options.typography.heading" :label="t('tool.headingFont')" />
          </UiField>
          <UiField :label="t('tool.bodyFont')" stack>
            <FontPicker v-model="options.typography.body" :label="t('tool.bodyFont')" />
          </UiField>
          <UiField :label="t('tool.nameWeight')">
            <UiSegmented v-model="options.typography.nameWeight" block :options="weightOptions" :aria-label="t('tool.nameWeight')" />
          </UiField>
          <UiField :label="t('tool.bodyWeight')" :help="t('tool.bodyWeightHelp')">
            <UiSegmented v-model="options.typography.bodyWeight" block :options="weightOptions" :aria-label="t('tool.bodyWeight')" />
          </UiField>
          <UiSlider
            v-model="options.typography.scale"
            :label="t('tool.textScale')"
            :help="t('tool.textScaleHelp')"
            :min="50"
            :max="160"
            :step="5"
            unit=" %"
            :reset-to="100"
            :reset-label="t('tool.resetScale')"
          />
          <UiNumberField v-model="options.typography.nameSize" :label="t('tool.nameSize')" :help="t('tool.sizeHelp')" :min="1" :step="0.1" />
          <UiNumberField v-model="options.typography.titleSize" :label="t('tool.titleSize')" :min="1" :step="0.1" />
          <UiNumberField
            v-model="options.typography.detailSize"
            :label="t('tool.detailSize')"
            :min="1"
            :step="0.1"
            :warning="warningFor('textScaled', 'contentOverflow', 'textSmall')"
          />
        </UiSection>
      </div>

      <!-- content -->
      <div v-show="tab === 'content'" class="tab-panel" role="tabpanel">
        <UiSection :title="t('tool.person')" default-open>
          <UiField :label="t('tool.name')" stack>
            <input v-model="options.content.name" class="input input--name" type="text" :placeholder="t('tool.namePlaceholder')" />
          </UiField>
          <UiField :label="t('tool.jobTitle')" stack>
            <input v-model="options.content.title" class="input" type="text" :placeholder="t('tool.jobTitlePlaceholder')" />
          </UiField>
          <UiField :label="t('tool.company')" stack>
            <input v-model="options.content.company" class="input" type="text" :placeholder="t('tool.companyPlaceholder')" />
          </UiField>
        </UiSection>

        <UiSection :title="t('tool.contacts')" default-open>
          <template #aside>
            <UiToggle v-model="options.content.showIcons" small :label="t('tool.showIcons')" />
          </template>
          <ContactList v-model="options.content.contacts" />
        </UiSection>

        <UiSection :title="t('tool.logo')" default-open>
          <LogoPicker v-model="options.logo" />
        </UiSection>
      </div>

      <!-- QR code -->
      <div v-show="tab === 'qr'" class="tab-panel" role="tabpanel">
        <UiSection v-model:enabled="options.qr.enabled" :title="t('tool.qrSection')" toggleable default-open>
          <Transition name="rise">
            <div v-if="!TEMPLATES[options.template].qr" class="notice notice--info">
              <UiIcon name="info" />
              <span>{{ t('tool.qrTemplateHint', { template: t(`tool.templates.${options.template}.name`) }) }}</span>
            </div>
          </Transition>
          <p class="field-hint">{{ t('tool.qrHelp') }}</p>
          <UiField :label="t('tool.qrContent')">
            <UiSegmented v-model="options.qr.content" block :options="qrContentOptions" :aria-label="t('tool.qrContent')" />
          </UiField>
          <UiCollapse :open="options.qr.content === 'custom'">
            <textarea
              v-model="options.qr.text"
              v-autosize
              class="textarea qr-text"
              rows="2"
              :placeholder="t('tool.qrCustomPlaceholder')"
              :aria-label="t('tool.qrCustomPlaceholder')"
            ></textarea>
          </UiCollapse>
          <QrPreview :matrix="qrMatrix" :size="qrSize" :quiet-zone="qrInverted ? 2 : 0" :empty-text="qrEmptyText" />
          <p v-if="qrInverted && qrMatrix" class="field-hint">{{ t('tool.qrInvertedHint') }}</p>
          <UiNumberField
            v-model="options.qr.size"
            :label="t('tool.qrSize')"
            :min="8"
            :max="60"
            :step="0.5"
            :warning="warningFor('qrDense')"
          />
          <UiField :label="t('tool.qrStyle')">
            <UiSegmented v-model="options.qr.style" block :options="qrStyleOptions" :aria-label="t('tool.qrStyle')" />
          </UiField>
          <UiField :label="t('tool.errorCorrection')" :help="t('tool.errorCorrectionHelp')">
            <UiSegmented v-model="options.qr.errorCorrection" block :options="errorCorrectionOptions" :aria-label="t('tool.errorCorrection')" />
          </UiField>
        </UiSection>
      </div>

      <!-- card -->
      <div v-show="tab === 'card'" class="tab-panel" role="tabpanel">
        <UiSection :title="t('tool.size')" default-open>
          <div class="sizes" role="radiogroup" :aria-label="t('tool.size')">
            <button
              v-for="(size, id) in CARD_SIZES"
              :key="id"
              type="button"
              class="size"
              :class="{ 'is-active': options.card.size === id }"
              role="radio"
              :aria-checked="options.card.size === id ? 'true' : 'false'"
              @click="selectSize(id)"
            >
              <span class="size__glyph" :style="glyphStyle(size)" aria-hidden="true"></span>
              <span class="size__name">{{ t(`tool.cardSizes.${id}`) }}</span>
              <span class="size__dims">{{ size ? `${size.width} × ${size.height}` : '…' }}</span>
            </button>
          </div>
          <UiCollapse :open="options.card.size === 'custom'">
            <UiNumberField v-model="options.card.width" :label="t('width')" :min="30" :max="200" />
            <UiNumberField v-model="options.card.height" :label="t('height')" :min="30" :max="200" />
          </UiCollapse>
          <UiNumberField v-model="options.card.thickness" :label="t('thickness')" :min="0.6" :step="0.2" />
          <UiNumberField
            v-model="options.card.cornerRadius"
            :label="t('tool.cornerRadius')"
            :min="0"
            :step="0.5"
            :warning="warningFor('radiusLimited')"
          />
          <UiNumberField v-model="options.card.margin" :label="t('tool.margin')" :help="t('tool.marginHelp')" :min="1" :step="0.5" />
        </UiSection>

        <UiSection :title="t('tool.relief')" default-open>
          <div class="reliefs" role="radiogroup" :aria-label="t('tool.relief')">
            <button
              v-for="mode in reliefModes"
              :key="mode"
              type="button"
              class="relief"
              :class="{ 'is-active': options.card.relief === mode }"
              role="radio"
              :aria-checked="options.card.relief === mode ? 'true' : 'false'"
              @click="options.card.relief = mode"
            >
              <svg class="relief__glyph" viewBox="0 0 40 16" aria-hidden="true">
                <rect class="relief__card" x="1" :y="mode === 'raised' ? 8 : 4" width="38" :height="mode === 'raised' ? 7 : 11" rx="1.5" />
                <template v-if="mode === 'raised'">
                  <rect class="relief__detail" x="9" y="4" width="8" height="4" />
                  <rect class="relief__detail" x="23" y="4" width="8" height="4" />
                </template>
                <template v-else-if="mode === 'engraved'">
                  <rect class="relief__cut" x="9" y="4" width="8" height="4" />
                  <rect class="relief__cut" x="23" y="4" width="8" height="4" />
                </template>
                <template v-else>
                  <rect class="relief__detail" x="9" y="4" width="8" height="4" />
                  <rect class="relief__detail" x="23" y="4" width="8" height="4" />
                </template>
              </svg>
              <span class="relief__name">{{ t(`tool.reliefModes.${mode}`) }}</span>
            </button>
          </div>
          <p class="field-hint">{{ t(`tool.reliefDescriptions.${options.card.relief}`) }}</p>
          <UiNumberField
            v-model="options.card.reliefDepth"
            :label="t('tool.reliefDepth')"
            :help="t('tool.reliefDepthHelp')"
            :min="0.2"
            :step="0.2"
            :warning="warningFor('depthLimited')"
          />
          <UiCollapse :open="options.card.relief === 'inlay'">
            <UiField :label="t('tool.faceDown')" :help="t('tool.faceDownHelp')">
              <UiToggle v-model="options.card.faceDown" :aria-label="t('tool.faceDown')" />
            </UiField>
          </UiCollapse>
        </UiSection>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Settings sidebar of the business card. Edits the options from useToolOptions() directly;
 * the workbench notices every change (live preview, outdated-preview hint, settings export).
 */
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import UiCollapse from '@/core/components/ui/UiCollapse.vue';
import UiField from '@/core/components/ui/UiField.vue';
import UiIcon from '@/core/components/ui/UiIcon.vue';
import UiNumberField from '@/core/components/ui/UiNumberField.vue';
import UiSection from '@/core/components/ui/UiSection.vue';
import UiSegmented from '@/core/components/ui/UiSegmented.vue';
import UiSlider from '@/core/components/ui/UiSlider.vue';
import UiTabs from '@/core/components/ui/UiTabs.vue';
import UiToggle from '@/core/components/ui/UiToggle.vue';
import { useModelWarnings } from '@/core/composables/useModelWarnings';
import { useToolOptions } from '@/core/composables/useWorkbench';
import { CARD_SIZES, TEMPLATES, type CardSizeId } from './catalog';
import ColorSwatches from './components/ColorSwatches.vue';
import ContactList from './components/ContactList.vue';
import FontPicker from './components/FontPicker.vue';
import LogoPicker from './components/LogoPicker.vue';
import QrPreview from './components/QrPreview.vue';
import TemplateGallery from './components/TemplateGallery.vue';
import {
  STYLE_PRESETS, type ErrorCorrection, type FontWeightChoice, type QrContent, type QrStyle, type ReliefMode, type ToolOptions,
} from './options';
import { createQr, qrPayload, type QrMatrix } from './qr';

const { t } = useI18n();
const options = useToolOptions<ToolOptions>();
const { warningFor } = useModelWarnings();

const tab = ref('design');
const reliefModes: ReliefMode[] = ['raised', 'engraved', 'inlay'];

const tabs = computed(() => [
  { id: 'design', label: t('tool.tabDesign'), icon: 'palette' },
  { id: 'content', label: t('tool.tabContent'), icon: 'contact' },
  { id: 'qr', label: t('tool.tabQr'), icon: 'qr-code' },
  { id: 'card', label: t('tool.tabCard'), icon: 'square' },
]);

const weightOptions = computed(() => [
  { value: 'regular' as FontWeightChoice, label: t('tool.weightRegular') },
  { value: 'bold' as FontWeightChoice, label: t('tool.weightBold') },
]);

const qrContentOptions = computed(() => [
  { value: 'vcard' as QrContent, label: t('tool.qrVcard') },
  { value: 'website' as QrContent, label: t('tool.qrWebsite') },
  { value: 'custom' as QrContent, label: t('tool.qrCustom') },
]);

const qrStyleOptions = computed(() => [
  { value: 'rounded' as QrStyle, label: t('tool.qrRounded') },
  { value: 'square' as QrStyle, label: t('tool.qrSquare') },
]);

const errorCorrectionOptions = (['L', 'M', 'Q', 'H'] as ErrorCorrection[]).map((level) => ({ value: level, label: level }));

/* ---------- style presets ---------- */
const activePreset = computed(() => Object.keys(STYLE_PRESETS).find((id) => {
  const preset = STYLE_PRESETS[id];
  return preset.typography.heading === options.typography.heading
    && preset.typography.body === options.typography.body
    && preset.colors.base === options.colors.base
    && preset.colors.text === options.colors.text
    && preset.colors.accent === options.colors.accent;
}));

const applyPreset = (id: string) => {
  const preset = STYLE_PRESETS[id];
  Object.assign(options.typography, preset.typography);
  Object.assign(options.colors, preset.colors);
};

/* ---------- QR code (computed here too, for the 2D preview and the module size) ---------- */
const luminance = (hex: string) => {
  const value = parseInt(hex.slice(1), 16);
  return (0.2126 * ((value >> 16) & 255) + 0.7152 * ((value >> 8) & 255) + 0.0722 * (value & 255)) / 255;
};
const qrInverted = computed(() => luminance(options.colors.base) < luminance(options.colors.text));
const qrSize = computed(() => (Number.isFinite(options.qr.size) ? options.qr.size : 20));

const qrMatrix = computed((): QrMatrix | null => {
  const payload = qrPayload(options);
  if (!payload) return null;
  try {
    return createQr(payload, options.qr.errorCorrection);
  } catch {
    return null;
  }
});

const qrEmptyText = computed(() => (options.qr.content === 'website' ? t('tool.qrNoWebsite') : t('tool.qrNoContent')));

/* ---------- card size ---------- */
const selectSize = (id: CardSizeId) => {
  const size = CARD_SIZES[id];
  if (id === 'custom') {
    // start the custom size from the previous preset
    const previous = CARD_SIZES[options.card.size];
    if (previous) {
      options.card.width = previous.width;
      options.card.height = previous.height;
    }
  } else if (size) {
    options.card.width = size.width;
    options.card.height = size.height;
  }
  options.card.size = id;
};

const glyphStyle = (size: { width: number; height: number } | null) => {
  const ratio = size ? size.height / size.width : 0.65;
  return { width: `${size && ratio > 0.9 ? 18 : 24}px`, height: `${size && ratio > 0.9 ? 18 : Math.round(24 * ratio)}px` };
};
</script>

<style scoped>
.presets {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
}

.preset {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  padding: 0 8px;
  border: 1px solid rgba(0, 0, 0, 0.14);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-xs);
  transition: transform var(--duration-fast) ease, box-shadow var(--duration) ease;
}

.preset:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.preset.is-active {
  box-shadow: 0 0 0 2px var(--surface), 0 0 0 4px var(--accent);
}

.preset__name {
  overflow: hidden;
  font-size: 13.5px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preset__dot {
  position: absolute;
  top: 5px;
  right: 5px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.input--name {
  font-weight: 600;
}

.qr-text.textarea {
  min-height: 60px;
  max-height: 160px;
  resize: none;
}

.sizes {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
}

.size,
.relief {
  display: grid;
  justify-items: center;
  align-content: center;
  gap: 3px;
  min-width: 0;
  padding: 8px 4px;
  border: 1px solid var(--input-border);
  border-radius: var(--radius-sm);
  background: var(--input-bg);
  color: var(--text-2);
  transition: border-color var(--duration) ease, background-color var(--duration) ease, color var(--duration) ease;
}

.size:hover,
.relief:hover {
  border-color: var(--input-border-hover);
  color: var(--text);
}

.size.is-active,
.relief.is-active {
  border-color: var(--accent-soft-border);
  background: var(--accent-soft);
  color: var(--text);
  box-shadow: inset 0 0 0 1px var(--accent-soft-border);
}

.size__glyph {
  display: block;
  margin-bottom: 2px;
  border: 1.5px solid currentColor;
  border-radius: 3px;
}

.size.is-active .size__glyph {
  border-color: var(--accent);
}

.size__name,
.relief__name {
  max-width: 100%;
  overflow: hidden;
  font-size: 12.5px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.size__dims {
  color: var(--text-3);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}

.reliefs {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
}

.relief__glyph {
  width: 48px;
  height: 20px;
}

.relief__card {
  fill: var(--surface-active);
  stroke: var(--text-3);
  stroke-width: 1;
}

.relief__detail {
  fill: var(--accent);
}

.relief__cut {
  fill: var(--surface);
  stroke: var(--text-3);
  stroke-width: 0.8;
}
</style>
