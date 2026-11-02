# Share & Act skills

An English-only Grok Bot skill for generating Share & Act Android rule envelopes, configuring required services, and validating against a fingerprinted App-source contract.

## Install with the Skills CLI

```bash
npx skills add blackpill/share-act-skills --skill share-act-config
```

To inspect discovery without installing:

```bash
npx skills add blackpill/share-act-skills --list
```

Ask Grok Bot to execute the installation in its own environment, not on the user's local computer. Installing files is not proof that the current Bot has registered and enabled the skill: verify discovery by name and execute a safe offline fixture afterward. If this Grok Bot deployment requires private-skill registration, use its supported registration flow. Do not confuse the CLI's Grok Build agent target with Grok Bot.

The current Skills CLI requires Node.js 22.20+; the validator itself supports Node.js 20+ and requires Java 17+. No npm package publication is needed for Git-based installation.

## Runtime

Install/import the `share-act-config` directory from the generated ZIP using the deployment's supported skill mechanism. This project does not assume that every Grok Bot deployment can execute scripts. If script execution is unavailable, use the validator locally and do not claim a draft was validated inside Grok Bot.

Requirements: Node.js 20+ and Java 17+. No npm dependencies or API keys are required for runtime validation.

```bash
cd skills/share-act-config
node scripts/finalize.mjs "/absolute/path/draft.json" --context "/absolute/path/context.json" --out "/absolute/path/config.json"
```

Read `SKILL.md` for the context recipe. Example Bot IDs and service destinations are offline fixtures, never production settings. A passing report proves the exact file passed the bundled source codec and supplemental policy/matching checks, not live account access or on-device acceptance.

## Development and upgrades

See `skills/share-act-config/references/upgrades.md` for staging, source checks, oracle builds, consistency tests, explicit approval and packaging. Maintainer builds use the Android checkout's Gradle wrapper, JDK 17 and dependency repositories. The Android project is read-only.

```bash
# Maintainer checks require a matching Android source checkout.
SHAREACT_ANDROID_SOURCE="/absolute/path/ShareAct-Android" npm test
SHAREACT_ANDROID_SOURCE="/absolute/path/ShareAct-Android" npm run check:source
SHAREACT_ANDROID_SOURCE="/absolute/path/ShareAct-Android" npm run test:consistency
SHAREACT_ANDROID_SOURCE="/absolute/path/ShareAct-Android" npm run test:delivery
SHAREACT_ANDROID_SOURCE="/absolute/path/ShareAct-Android" npm run package
```

The project contains no real webhook secrets or destination IDs. No commits, pushes, live service changes or Android App modifications are performed by its tests.

## Licensing

Bundled dependency licenses are reproduced in `skills/share-act-config/references/third-party-licenses.md`. No separate open-source license for Share & Act application code is declared by this repository.

Ready configurations are delivered as finalized JSON file attachments, not pasted rich-text JSON. The finalizer revalidates the exact output bytes and writes a separate hash receipt.
