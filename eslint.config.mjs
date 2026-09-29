// Root ESLint flat config for the workspace packages.
//
// Nuxt apps (storefront, docs, ...) own their own eslint.config.mjs so that
// @nuxt/eslint can supply the generated auto-import globals for them. This file
// covers the plain TypeScript packages under packages/.
//
// Style is intentionally NOT enforced here — packages are single-quoted and
// semicolon-free, apps are the opposite, and a shared stylistic preset would
// reformat the entire monorepo. Rules below are correctness-focused only.

import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import pluginVue from 'eslint-plugin-vue'
import vueParser from 'vue-eslint-parser'

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.nuxt/**',
      '**/.output/**',
      '**/.turbo/**',
      '**/coverage/**',
      '**/playground/**',
      // Apps configure themselves (or opt in later); see apps/*/eslint.config.mjs
      'apps/**',
      // Checked-in Prisma client output
      'packages/platform/src/database/prisma/generated/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  // Vue SFCs live in packages/ui; Nuxt apps are handled by @nuxt/eslint.
  // 'essential' (not 'recommended') is deliberate: the recommended tier adds
  // ~400 formatting findings (max-attributes-per-line, html-indent, ...) and
  // this repo has no formatter to own that style.
  ...pluginVue.configs['flat/essential'],
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tseslint.parser,
        extraFileExtensions: ['.vue'],
      },
    },
  },
  {
    rules: {
      // Undefined identifiers are already reported by tsc (TS2304) with full
      // type information, so no-undef is redundant here — and it false-positives
      // on Node/DOM/Vue globals because no `globals` package is configured.
      'no-undef': 'off',
      // Empty catch blocks are used deliberately in @commercejs/core to keep one
      // failing side effect (notification/analytics provider) from breaking a
      // commerce operation. The blocks are commented explaining why.
      'no-empty': ['error', { allowEmptyCatch: true }],
      // The codebase is not fully annotated; `any` is allowed but flagged as a
      // warning so it can be ratcheted down over time.
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrors: 'none',
        },
      ],
      // Prefer `x ?? y` over `x || y` only where a falsy value is impossible —
      // off by default because commerce totals legitimately treat 0 as absent.
      '@typescript-eslint/no-unnecessary-condition': 'off',
    },
  },
)
