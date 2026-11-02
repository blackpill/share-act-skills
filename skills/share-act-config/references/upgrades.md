# Contract and artifact maintenance

The contract fingerprints actual import/validation sources, dependencies and the task-neutral test-file catalog. `source_snapshot_id` additionally audits generation wording. Wording is excluded from `contract_id` to avoid self-reference when the App embeds the profile ID. Source drift still checks the complete recorded snapshot.

A hash identifies a reviewed source profile, not an installed APK or a publisher signature. Distribute artifacts through a trusted repository. Unknown versions require explicit maintenance rather than guessed migration.

From the development project root:

```bash
npm run check:source -- --source "/absolute/path/ShareAct-Android"
npm run sync -- --source "/absolute/path/ShareAct-Android"
npm run build:oracle -- --source "/absolute/path/ShareAct-Android"
node skills/share-act-config/scripts/create-fixtures.mjs
npm test
npm run test:consistency
npm run test:delivery
npm run approve -- --source "/absolute/path/ShareAct-Android"
npm run package
```

Review source differences before approval. Synchronization invalidates old approval/build metadata. The build reads the App checkout but writes only to this project and normal tool caches. It compiles the actual diagnostics, decoder, admission policy, task-neutral resource catalog and required core logic. Business-example classes and configuration-generation prompts are not included in the oracle.

Tests and generated generic fixtures are bound to approval/package evidence. Finalization tests additionally cover exact copying, corruption rejection, receipt separation, HTML data encoding and clipboard failure reporting. Only tested approved artifacts can be packaged.

A portable runtime cannot discover a newer App release by itself. Provide the trusted current profile or run source checks in release automation. A source identity mismatch, missing execution tools or failed integrity check blocks a validated-delivery claim.
