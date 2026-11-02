# Configuration compliance and copy delivery

The current release is task-neutral. Business workflows, service setup and destination selection are caller responsibilities and are not part of this skill.

## Architecture
- Node.js performs strict canonical preflight and approved-artifact checks.
- A Java 17 oracle compiles the actual App diagnostics, decoder, task-neutral test-file catalog and required core validation/request construction logic. Business-example classes and generation prompts are excluded.
- Instruction content and caller-selected output format are preserved; only their structural encoding and App constraints are checked.
- Finalization creates an unchanged JSON file, separate hash receipt and offline HTML copy-content helper. The helper has a real clipboard button, data-only rendering, integrity checks and explicit failure states.
- Unknown source/contracts fail closed. The user authorized repository publication and installation of the matching App.

## Verification checklist
- [x] Failing scope, neutral-catalog, copy-helper and cleanup regressions reproduced.
- [x] Business playbooks and fixtures removed from the current Skill.
- [x] Generic protocol fixtures and task-neutral App catalog implemented.
- [x] Browser rendering and helper integrity initialization checked.
- [x] Final source consistency, delivery tests, approval and package checks.

Release sequence: push the verified repository update, then install the matching signed App under the user's explicit approval.
