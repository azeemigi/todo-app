# Lessons Learned

This file is the live log of corrections, pitfalls, and verified facts for this repository. Agents must read this before non-trivial work.

## Format

Each entry follows this structure:

```
### [YYYY-MM-DD] Short title
- **Context**: What was being done
- **Issue**: What went wrong or was discovered
- **Resolution**: How it was fixed
- **Rule**: The lesson to remember going forward
```

## Entries

### [2026-06-07] Maven spring-boot prefix in multi-module reactor
- **Context**: Running the API from the root with `mvn spring-boot:run -pl todo-api -am`.
- **Issue**: Maven failed in reactor modules with `No plugin found for prefix 'spring-boot'` before reaching the API module.
- **Resolution**: Declared `spring-boot-maven-plugin` in root and UI POMs with `skip=true` and `inherited=false`; API module remains the runnable target.
- **Rule**: In this reactor, any root-invoked `spring-boot:*` goal requires plugin visibility in non-runnable POM modules to avoid prefix-resolution failures.

### [2026-06-07] Java runtime mismatch for Spring Boot tooling
- **Context**: Executing Maven goals in the dev container.
- **Issue**: Default Java 11 runtime caused plugin loading errors and class-version failures.
- **Resolution**: Ran Maven with Java 25 (`JAVA_HOME=/home/codespace/java/25.0.2-ms` and PATH override).
- **Rule**: Use Java 25 for all project Maven commands unless the environment default is explicitly upgraded.

### [2026-06-07] Angular NG0908 bootstrap failure
- **Context**: Loading the Angular SPA built by the UI module.
- **Issue**: Runtime error `NG0908` occurred during NgZone factory creation.
- **Resolution**: Added `import 'zone.js';` at the top of `src/main.ts` while using `provideZoneChangeDetection`.
- **Rule**: Zone-based change detection in Angular 22 requires `zone.js` to be loaded before `bootstrapApplication`.

### [2026-06-07] Missing static assets should not surface as 500
- **Context**: Browser requested `/favicon.ico` and received 500 from API host.
- **Issue**: Global catch-all exception mapping converted missing resource exceptions to internal server errors.
- **Resolution**: Added explicit handler for `NoResourceFoundException` returning 404.
- **Rule**: Keep generic exception handlers from masking missing-resource conditions; map them to 404 for correct client behavior.

### [2026-06-07] Keep interactive CLI side effects out of commits
- **Context**: Running Angular build in interactive mode.
- **Issue**: Angular CLI analytics prompt wrote an unrelated setting into `angular.json`.
- **Resolution**: Restored incidental config changes and committed only task-relevant files.
- **Rule**: After interactive commands, inspect diffs and exclude environment-specific or prompt-driven config drift.

<!-- Add new entries above this line, newest first -->
