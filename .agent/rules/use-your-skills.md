---
trigger: always_on
---

## Skill Usage Protocol

Before starting any task:

1. **Match skills to the task** — scan the available skills in `.agent/skills/` and identify which ones are relevant to the current work. Load the `orchestration` skill first if it exists.
2. **Read the SKILL.md** — use `view_file` to read the full instructions of each relevant skill before writing any code or content.
3. **Follow skill patterns** — apply the conventions, patterns, and references defined in the skill rather than using generic approaches.

After completing work:

4. **Validate against skills** — review your output against the relevant skill's guidelines to catch violations (e.g., wrong component API, missing patterns, style mismatches).

### Skill Selection Guide

| Task Type | Primary Skill(s) |
|---|---|
| Writing docs or blog posts | `document-writer`, `nuxt-content` |
| Building UI with Nuxt | `nuxt`, `nuxt-ui`, `vueuse-functions` |
| Writing or reviewing tests | `vitest`, `javascript-testing-patterns` |
| Designing APIs | `api-design-principles`, `openapi-spec-generation` |
| Authoring TypeScript libraries | `ts-library`, `typescript-advanced-types` |
| Code review | `code-reviewer` |
| Architecture decisions | `design-patterns`, `structured-plan-mode` |
| Creating Nuxt modules | `nuxt-modules` |
| Writing READMEs | `readme-writer` |
| Technical documentation | `technical-writer` |