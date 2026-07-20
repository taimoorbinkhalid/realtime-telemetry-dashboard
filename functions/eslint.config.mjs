import tseslint from 'typescript-eslint'

// Minimal flat config for the functions package (TypeScript, Node).
export default tseslint.config(
  { ignores: ['lib/**', 'node_modules/**'] },
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
)
