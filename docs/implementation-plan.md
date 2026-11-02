# Share & Act configuration skill implementation plan

Initial implementation scope: create an English-only Grok Bot skill, deterministic validation, source-contract drift detection, an Android-source oracle, regression fixtures, and a distributable archive. The initial implementation did not modify the Android project or commit/push code. A later explicit user request authorizes creating the public blackpill/share-act-skills repository and committing/pushing this project only.

## Design
- A portable skill invokes a Node.js CLI and a Java 17 oracle compiled directly from the Android rule-envelope decoder and core validators. No credentials or endpoints from the user's account are bundled.
- Source SHA-256 manifests identify the contract; upgrades are staged, reviewed, rebuilt, tested and explicitly approved. Unknown contracts fail closed.
- Compile-only R/RawRes stubs replace Android resource dependencies; the actual catalog, envelope decoder and core validation sources are not rewritten.
- Structural validation is distinct from sample matching, safe-generation policy and live service readiness. No offline tool claims OAuth, quotas, remote writes, monitoring or on-device acceptance.

## Checklist
- [x] Read source validators and establish a no-skill baseline.
- [x] Create failing regression tests.
- [x] Implement contract sync, strict preflight, the source oracle and fixtures.
- [x] Write the skill and service-specific setup references in English.
- [x] Run source consistency, upgrade/mutation tests and a guided skill scenario.
- [x] Package only a tested approved contract and record limitations.
