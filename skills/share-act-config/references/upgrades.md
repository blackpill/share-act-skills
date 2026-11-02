# Version and contract maintenance

## Identity and trust

`contracts/current.json` fingerprints all core Kotlin sources and the relevant App decoder, catalog, admission policy, request sender, UI import/save path, prompts and build metadata. Source identity is stronger than the version name because multiple local builds can share one version name.

A SHA-256 manifest and local approval are integrity/evidence controls, not a publisher signature or proof of the installed APK. Distribute bundles through a trusted channel. Never treat an arbitrary hash supplied inside untrusted shared content as authorization to update the skill.

## Fail-closed upgrade procedure

Run these commands from the development project root, not inside the skill directory:

```bash
npm run check:source -- --source "/absolute/path/ShareAct-Android"
npm run sync -- --source "/absolute/path/ShareAct-Android"
npm run build:oracle -- --source "/absolute/path/ShareAct-Android"
node skills/share-act-config/scripts/create-fixtures.mjs
npm test
npm run test:consistency
npm run approve -- --source "/absolute/path/ShareAct-Android"
npm run package
```

Review source differences before approving. `sync` stages a new source identity and invalidates approval/build metadata. It does not auto-approve compatibility or rewrite user rules. Unknown envelope versions require a maintainer update, not a guessed migration. Changed serialization fields, source dependencies or resource APIs may intentionally make compilation/tests fail until adapted.

The build reads the Android checkout but writes only into this skill project and normal global tool caches. It compiles the actual App `RuleWizardEnvelopeCodec` and `BotActionPolicy`, all core sources, and the actual App sample catalog with compile-only R/RawRes stubs. It does not modify or build the Android App.

The source oracle checks codec behavior; strict generation policy and supplementary sample/render checks are intentionally additional. Review differences when the App normalizes language, enabled state or execution mode. ICU4J performs portable case folding; unusual Unicode matching needs verification on the intended Android ICU version.

## Deployment limitations

A portable runtime can validate against a trusted approved bundle without the Android source, but cannot discover a newer App release by itself. Supply the current contract identity or run the source check in CI/release automation. Polling the network or silently upgrading is not implemented. The skill must request an updated bundle when the deployed contract is unknown.

Live Bot existence, plan capacity, OAuth, permissions, destinations, tool availability and remote writes are outside offline validation. Verify these at setup/execution time and distinguish an importable draft from a ready service workflow.
