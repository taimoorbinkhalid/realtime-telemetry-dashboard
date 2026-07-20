<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { SUPPORTED_LOCALES, LOCALE_NAMES, setLocale, type AppLocale } from '@/i18n'

const { t, locale } = useI18n()

function choose(next: AppLocale): void {
  setLocale(next)
}
</script>

<template>
  <v-menu>
    <template #activator="{ props }">
      <v-btn
        v-bind="props"
        variant="text"
        icon="mdi-translate"
        :aria-label="t('actions.language')"
      />
    </template>
    <v-list density="compact" min-width="180">
      <v-list-item
        v-for="l in SUPPORTED_LOCALES"
        :key="l"
        :active="locale === l"
        color="primary"
        @click="choose(l)"
      >
        <v-list-item-title>{{ LOCALE_NAMES[l] }}</v-list-item-title>
        <template #append>
          <v-icon v-if="locale === l" icon="mdi-check" size="18" color="primary" />
        </template>
      </v-list-item>
    </v-list>
  </v-menu>
</template>
