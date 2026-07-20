import pluginVue from 'eslint-plugin-vue'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'

// Flat config (ESLint 9+/10). Lints Vue SFCs and TypeScript across the app and
// the seeder. Formatting-only Vue rules are disabled — that's the editor's job.
export default defineConfigWithVueTs(
  {
    name: 'app/files-to-lint',
    files: ['**/*.{ts,mts,tsx,vue}'],
  },
  {
    name: 'app/files-to-ignore',
    ignores: ['dist/**', 'node_modules/**'],
  },
  pluginVue.configs['flat/recommended'],
  vueTsConfigs.recommended,
  {
    name: 'app/rules',
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
    rules: {
      // Ship no stray console/debugger in committed code.
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'warn',
      'vue/multi-word-component-names': 'off',
      // Pure whitespace/layout rules — leave formatting to the editor, not lint.
      'vue/max-attributes-per-line': 'off',
      'vue/singleline-html-element-content-newline': 'off',
      'vue/html-self-closing': 'off',
      'vue/first-attribute-linebreak': 'off',
    },
  },
)
