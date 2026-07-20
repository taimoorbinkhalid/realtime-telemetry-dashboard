<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { useAppTheme } from '@/composables/useAppTheme'
import LanguageSwitcher from '@/components/LanguageSwitcher.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const { isDark, toggle } = useAppTheme()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref<string | null>(null)

/** Navigate to the post-login target (honoring ?redirect=). */
function goAfterLogin(): void {
  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
  router.push(redirect)
}

async function onSubmit(): Promise<void> {
  loading.value = true
  error.value = null
  try {
    await auth.login(email.value, password.value)
    goAfterLogin()
  } catch {
    error.value = t('login.invalid')
  } finally {
    loading.value = false
  }
}

async function onDemoLogin(): Promise<void> {
  loading.value = true
  error.value = null
  try {
    await auth.loginAsDemo()
    goAfterLogin()
  } catch {
    error.value = t('login.demoUnavailable')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <v-container class="fill-height" fluid>
    <v-row justify="center" align="center">
      <v-col cols="12" sm="8" md="5" lg="4">
        <div class="text-center mb-6">
          <v-icon icon="mdi-chart-line-variant" color="primary" size="48" />
          <h1 class="text-h5 font-weight-bold mt-2">{{ t('app.title') }}</h1>
          <p class="text-medium-emphasis">{{ t('app.subtitle') }}</p>
        </div>

        <v-card class="pa-2">
          <v-card-title class="text-body-1">{{ t('login.heading') }}</v-card-title>
          <v-card-text>
            <v-alert
              v-if="error"
              type="error"
              variant="tonal"
              density="compact"
              class="mb-4"
            >
              {{ error }}
            </v-alert>

            <v-form @submit.prevent="onSubmit">
              <v-text-field
                v-model="email"
                :label="t('login.email')"
                type="email"
                autocomplete="email"
                prepend-inner-icon="mdi-email-outline"
                variant="outlined"
                density="comfortable"
                required
              />
              <v-text-field
                v-model="password"
                :label="t('login.password')"
                type="password"
                autocomplete="current-password"
                prepend-inner-icon="mdi-lock-outline"
                variant="outlined"
                density="comfortable"
                required
              />
              <v-btn
                type="submit"
                color="primary"
                block
                size="large"
                :loading="loading"
              >
                {{ t('actions.signIn') }}
              </v-btn>
            </v-form>

            <div class="d-flex align-center my-4">
              <v-divider />
              <span class="px-3 text-caption text-medium-emphasis">or</span>
              <v-divider />
            </div>

            <v-btn
              variant="tonal"
              color="secondary"
              block
              size="large"
              prepend-icon="mdi-flash"
              :loading="loading"
              @click="onDemoLogin"
            >
              {{ t('actions.demoLogin') }}
            </v-btn>
            <p class="text-caption text-medium-emphasis text-center mt-3 mb-0">
              {{ t('login.demoHint') }}
            </p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <div class="corner-toolbar">
      <LanguageSwitcher />
      <v-btn
        :icon="isDark ? 'mdi-weather-sunny' : 'mdi-weather-night'"
        :aria-label="t('actions.toggleTheme')"
        variant="text"
        @click="toggle"
      />
    </div>
  </v-container>
</template>

<style scoped>
.corner-toolbar {
  position: fixed;
  top: 16px;
  right: 16px;
  display: flex;
  gap: 4px;
}
</style>
