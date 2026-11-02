# Share & Act configuration compliance skill

A task-neutral English skill for encoding, structurally validating and delivering Share & Act configuration JSON. It does not define business workflows, configure services, select destinations or execute instructions.

## Install

```bash
npx skills add blackpill/share-act-skills --skill share-act-config
```

Run installation in the Bot's own environment. Native registration is optional when the Bot can read installed skill files directly and execute their helpers. The Skills CLI currently needs Node.js 22.20+; this validator needs Node.js 20+ and Java 17+.

## Validate and deliver

```bash
cd skills/share-act-config
node scripts/finalize.mjs "/absolute/path/draft.json" --context "/absolute/path/context.json" --out "/absolute/path/config.json"
```

Read `SKILL.md` for the trusted context recipe. The gate produces the exact checked JSON, a separate receipt and native `grok/canvas` Page source with a copy-content button. Attach the JSON unchanged and have Grok Bot create a real private native Page from the generated TSX. A source-file download alone is not a rendered Page. Ordinary HTML downloads are no longer the copy UI.

Examples are generic protocol fixtures only. A passing result certifies structural compliance under the approved profile, not live account state or business correctness.

## Maintenance

See `skills/share-act-config/references/upgrades.md`. Maintainer checks require a matching App source checkout. Runtime use does not require that checkout or npm dependencies. Maintainer tests require `npm ci --ignore-scripts` for the pinned TypeScript compiler; the Page API shim is based on the user-supplied reference, not a hosted Grok integration test.

The Skill build does not modify the App project. Bundled dependency licenses are reproduced in `skills/share-act-config/references/third-party-licenses.md`; no separate open-source license for Share & Act application code is declared.
