<template>
  <div class="contacts">
    <TransitionGroup name="contact" tag="div" class="contacts__list">
      <div v-for="(contact, index) in contacts" :key="ids[index]" class="contact">
        <UiPopover placement="bottom-start" :width="232">
          <template #trigger="{ toggle, open }">
            <button
              type="button"
              class="contact__type"
              :class="{ 'is-open': open }"
              :aria-label="`${t('tool.changeType')}: ${t(`tool.contactTypes.${contact.type}`)}`"
              :data-tip="open ? '' : t(`tool.contactTypes.${contact.type}`)"
              aria-haspopup="menu"
              @click="toggle"
            >
              <MdiIcon :path="CONTACT_TYPES[contact.type].icon" />
              <UiIcon name="chevron-down" class="contact__chevron" />
            </button>
          </template>
          <div class="menu-heading">{{ t('tool.changeType') }}</div>
          <div class="type-grid">
            <button
              v-for="type in contactTypes"
              :key="type"
              type="button"
              class="menu-item type-option"
              :class="{ 'is-active': type === contact.type }"
              @click="contact.type = type"
            >
              <MdiIcon :path="CONTACT_TYPES[type].icon" />
              <span class="menu-item__label">{{ t(`tool.contactTypes.${type}`) }}</span>
            </button>
          </div>
        </UiPopover>
        <input
          v-model="contact.value"
          class="input contact__value"
          type="text"
          :placeholder="CONTACT_TYPES[contact.type].placeholder || t(`tool.contactTypes.${contact.type}`)"
          :aria-label="t(`tool.contactTypes.${contact.type}`)"
          spellcheck="false"
        />
        <div class="contact__actions">
          <button type="button" class="btn btn--ghost btn--icon btn--sm" :disabled="index === 0" :aria-label="t('tool.moveUp')" @click="move(index, -1)">
            <UiIcon name="arrow-up" />
          </button>
          <button
            type="button"
            class="btn btn--ghost btn--icon btn--sm"
            :disabled="index === contacts.length - 1"
            :aria-label="t('tool.moveDown')"
            @click="move(index, 1)"
          >
            <UiIcon name="arrow-down" />
          </button>
          <button type="button" class="btn btn--ghost btn--icon btn--sm contact__remove" :aria-label="t('tool.remove')" @click="remove(index)">
            <UiIcon name="trash" />
          </button>
        </div>
      </div>
    </TransitionGroup>

    <UiPopover v-if="contacts.length < MAX_CONTACTS" placement="bottom-start" :width="232">
      <template #trigger="{ toggle }">
        <button type="button" class="btn btn--sm contacts__add" @click="toggle">
          <UiIcon name="plus" />
          <span>{{ t('tool.addContact') }}</span>
        </button>
      </template>
      <div class="type-grid">
        <button v-for="type in contactTypes" :key="type" type="button" class="menu-item type-option" @click="add(type)">
          <MdiIcon :path="CONTACT_TYPES[type].icon" />
          <span class="menu-item__label">{{ t(`tool.contactTypes.${type}`) }}</span>
        </button>
      </div>
    </UiPopover>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import UiIcon from '@/core/components/ui/UiIcon.vue';
import UiPopover from '@/core/components/ui/UiPopover.vue';
import { CONTACT_TYPES, type ContactType } from '../catalog';
import { MAX_CONTACTS, type Contact } from '../options';
import MdiIcon from './MdiIcon.vue';

const contacts = defineModel<Contact[]>({ required: true });
const { t } = useI18n();
const contactTypes = Object.keys(CONTACT_TYPES) as ContactType[];

// stable keys for the list animation (contacts themselves have no id)
let nextId = 0;
const ids = ref<number[]>(contacts.value.map(() => nextId++));
watch(() => contacts.value.length, (length) => {
  while (ids.value.length < length) ids.value.push(nextId++);
  ids.value.length = length;
});

const add = (type: ContactType) => {
  ids.value.push(nextId++);
  contacts.value.push({ type, value: '' });
};

const remove = (index: number) => {
  ids.value.splice(index, 1);
  contacts.value.splice(index, 1);
};

const move = (index: number, delta: number) => {
  const target = index + delta;
  [contacts.value[index], contacts.value[target]] = [contacts.value[target], contacts.value[index]];
  [ids.value[index], ids.value[target]] = [ids.value[target], ids.value[index]];
};
</script>

<style scoped>
.contacts {
  display: grid;
  gap: 8px;
}

.contacts__list {
  display: grid;
  gap: 6px;
}

.contact {
  display: flex;
  align-items: center;
  gap: 6px;
}

.contact__type {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 2px;
  height: var(--control-height);
  padding: 0 6px 0 9px;
  border: 1px solid var(--input-border);
  border-radius: var(--radius-sm);
  background: var(--input-bg);
  color: var(--accent-text);
  font-size: 15px;
}

.contact__type:hover,
.contact__type.is-open {
  border-color: var(--input-border-hover);
}

.contact__chevron {
  width: 13px !important;
  height: 13px !important;
  color: var(--text-3);
}

.contact__value {
  flex: 1 1 auto;
  min-width: 0;
}

.contact__actions {
  display: flex;
  flex-shrink: 0;
}

.contact__actions .btn {
  width: 26px;
}

.contact__remove:hover {
  color: var(--danger-text);
}

.contacts__add {
  justify-self: start;
}

.type-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.type-option {
  min-height: 34px;
  font-size: 13px;
}

.type-option .mdi-icon {
  color: var(--text-3);
}

.contact-enter-active,
.contact-leave-active {
  transition: opacity 180ms ease, transform 220ms var(--ease-out);
}

.contact-enter-from,
.contact-leave-to {
  opacity: 0;
  transform: translateX(-8px);
}

.contact-move {
  transition: transform 220ms var(--ease-out);
}
</style>
