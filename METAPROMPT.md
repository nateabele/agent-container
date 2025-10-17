Use the attached prompt template to generate a prompt for the following project description. Details about how to generate the prompt are below the description.

### Project Description
[PROJECT DESCRIPTION]

### How to Generate the Prompt
1. Fill in the prompt template based on the project description, and modify as appropriate
2. Replace placeholders (`{{project_root}}`, `{{e2e_command}}`, etc.) with sensible values for the project, based on the project type
3. Keep the structure and numbering identical — only swap out the placeholders, and massage the wording as appropriate

---

### ⚙️ Recommended Default Values
| Placeholder | Default / Example |
|--------------|------------------|
| `{{project_name}}` | use the name of the project specified in the description, or make one up |
| `{{project_root}}` | main repo path (e.g. `./app` or `./src`) |
| `{{related_dir}}` | related dependencies |
| `{{platform_type}}` | “toolchain”, “visual programming platform”, or “compiler” |
| `{{output_target}}` | “firmware”, “CLI binary”, or “runtime code”, etc. |
| `{{max_parallel_subagents}}` | `500` |
| `{{e2e_framework}}` | `Playwright` or `Puppeteer` |
| `{{e2e_command}}` | `npm run test:e2e` |
| `{{unit_test_framework}}` | `Vitest`, `Jest`, or `Mocha` |
| `{{unit_test_command}}` | `npm run test` |
| `{{build_system}}` | `Vite`, `ESBuild`, or `Rollup` |
| `{{build_command}}` | `npm run build` |
| `{{library_name}}` | “component library” or “module library” |
| `{{language_stack}}` | `TypeScript/React` |
| `{{legacy_language}}` | `Elm`, `Python`, or similar deprecated implementation |
| `{{migration_name}}` | e.g. “Expression Editor Migration” |
| `{{target_system}}` | e.g. `tree-sitter-a` |
| `{{estimated_hours}}` | `6–7` |

---

### 💡 Notes
- Replace "browser runtime errors" with "runtime execution errors" for CLI or desktop apps.
- Replace "Playwright E2E tests" with "integration tests" if there's no UI.
- Maintain **FIX_PLAN.md** as the single source of truth for work in progress.
- Keep **AGENT.md** focused on setup, learning, and build/test optimization — *never* for status updates.
- **ALL documentation files** (SPEC.md, ARCHITECTURE_NOTES.md, FIX_PLAN.md, etc.) should be created in the `docs/` folder of the project root — never in the root directory itself.
