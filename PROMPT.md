0a. Study @{{project_root}}/docs/SPEC.md to learn about the {{project_name}} platform specifications, or @{{project_root}}/docs/ARCHITECTURE_NOTES.md for the long-form chain-of-thought

0b. The source code of the platform is in {{project_root}}/app/, {{project_root}}/components/, {{project_root}}/lib/, and {{project_root}}/config/

0c. Study {{project_root}}/docs/FIX_PLAN.md for current issues and priorities

0d. The main working directory is `{{project_root}}/`, but work in other directories may be needed as well, especially `{{related_dir}}`.

**IMPORTANT: ALL documentation files (SPEC.md, ARCHITECTURE_NOTES.md, FIX_PLAN.md, etc.) must be created in the `{{project_root}}/docs/` folder. Never create documentation files in the root directory.**

1. Your task is to implement missing {{platform_type}} functionality and produce compiled {{output_target}} code for that functionality using parallel subagents. Follow the docs/FIX_PLAN.md and choose the most important 10 things. Before making changes search codebase (don't assume not implemented) using subagents. You may use up to {{max_parallel_subagents}} parallel subagents for all operations but only 1 subagent for build/tests.

**CRITICAL TESTING REQUIREMENT:** ALWAYS test the app in a headless browser using {{e2e_command}} to catch {{runtime_type}} runtime errors that do not appear in unit tests. Runtime errors in the {{runtime_type}} are the PRIMARY concern. Unit tests alone are NOT sufficient - they miss critical runtime-only issues like:

- {{runtime_issue_1}}
- {{runtime_issue_2}}
- {{runtime_issue_3}}
- {{runtime_issue_4}}
- {{runtime_issue_5}}

Set up a SIMPLE mock system for stubbing out connections to actual external systems (e.g., hardware, network, APIs, compilers) as appropriate.

2. After implementing functionality or resolving problems, FIRST run {{e2e_command}} to verify no runtime errors, THEN run {{unit_test_command}} for that unit of code. If functionality is missing then it's your job to add it as per the application specifications. Think hard.

3. When you discover a {{critical_component}} or {{core_module}} issue, immediately update @{{project_root}}/docs/FIX_PLAN.md with your findings using a subagent. When the issue is resolved, update @{{project_root}}/docs/FIX_PLAN.md and remove the item using a subagent.

4. When BOTH {{e2e_command}} AND {{unit_test_command}} pass, update the @{{project_root}}/docs/FIX_PLAN.md, then add changed code and @{{project_root}}/docs/FIX_PLAN.md with "git add -A" via bash then do a "git commit" with a message that describes the changes you made to the code. After the commit do a "git push" to push the changes to the remote repository. Make sure all `npm` commands in the `scripts` block in `package.json` run correctly.

**Test Execution Order (MANDATORY):**

1. Run `{{e2e_command}}` ({{e2e_framework}} - catches {{runtime_type}} runtime errors)
2. Run `{{unit_test_command}}` ({{unit_test_framework}} - unit tests)
3. Run `{{build_command}}` ({{build_system}} production build)
4. Only commit if ALL three pass

5. Important: When authoring documentation (ie. component docs or library documentation) capture the why tests and the backing implementation is important.

6. Important: We want single sources of truth, no migrations/adapters. If tests unrelated to your work fail then it's your job to resolve these tests as part of the increment of change.

7. As soon as there are no build errors, E2E test errors ({{e2e_framework}}), OR unit test errors, create a git tag. If there are no git tags start at 0.0.0 and increment patch by 1 for example 0.0.1 if 0.0.0 does not exist. **NEVER create a git tag if {{e2e_framework}} tests are failing - {{runtime_type}} runtime errors are blockers.**

8. You may add extra logging if required to be able to debug the issues.

9. ALWAYS KEEP @docs/FIX_PLAN.md up to date with your learnings using a subagent. Especially after wrapping up/finishing your turn.

10. When you learn something new about how to run the platform or examples make sure you update @AGENT.md using a subagent but keep it brief. For example if you run commands multiple times before learning the correct command then that file should be updated.

11. IMPORTANT DO NOT IGNORE: The {{library_name}} should be authored in {{language_stack}} itself and tests authored. If you find {{legacy_language}} implementation then delete it/migrate to implementation in {{language_stack}}.

12. IMPORTANT when you discover a bug resolve it using subagents even if it is unrelated to the current piece of work after documenting it in @docs/FIX_PLAN.md

13. When you start implementing the {{library_name}} in {{language_stack}}, start with the testing primitives so that future {{library_name}} can be tested.

14. The tests for the {{library_name}} should be located in the folder of the {{library_name}} next to the source code. Ensure you document the {{library_name}} with a README.md in the same folder as the source code.

15. Keep AGENT.md up to date with information on how to build the platform and your learnings to optimize the build/test loop using a subagent.

16. For any bugs you notice, it's important to resolve them or document them in @docs/FIX_PLAN.md to be resolved using a subagent.

17. When authoring the {{library_name}} in {{language_stack}} you may author multiple libraries at once using up to {{library_parallel_limit}} parallel subagents.

18. When @docs/FIX_PLAN.md becomes large periodically clean out the items that are completed from the file using a subagent.

19. If you find inconsistencies in the @docs/SPEC.md then use the oracle and then update the specs. Specifically around types and constructs.

20. DO NOT IMPLEMENT PLACEHOLDER OR SIMPLE IMPLEMENTATIONS. WE WANT FULL IMPLEMENTATIONS. DO IT OR I WILL YELL AT YOU

21. SUPER IMPORTANT DO NOT IGNORE. DO NOT PLACE STATUS REPORT UPDATES INTO @AGENT.md

22. 🚨 CRITICAL - {{migration_name}} (HIGHEST PRIORITY):

**ALL {{migration_scope}}-related components MUST be replaced with {{target_system}}. This is the #1 priority before any other work.**

**Requirements:**

- Package {{target_system}} as single, self-contained component
- Hide any legacy UI or code that is no longer needed
- Replace ALL `{{old_type}}` usage with `{{new_type}}` type
- Replace ALL `{{old_component}}` instances with `{{new_component}}`

**Type Migration:**
Update {{type_file}} to use `{{new_type}}` from {{target_system}}:

- `{{old_field_1}}: {{old_type}}` → `{{old_field_1}}: {{new_type}}`
- `{{old_field_2}}: {{old_type}}` → `{{old_field_2}}: {{new_type}}`
- Remove old type definitions

**Component Replacement:**
Embed the {{target_system}} component in ALL these locations:

- {{target_context_1}}
- {{target_context_2}}
- {{target_context_3}}
- {{target_context_4}}
- {{target_context_5}}

**Cleanup:**

- Delete {{old_files}}
- Delete old type definitions
- Update all tests

**See docs/FIX_PLAN.md for complete multi-phase migration plan ({{estimated_hours}} hours estimated)**

**Action Required:** Complete this migration BEFORE implementing new features or major framework changes.
