---
name: share-act-config
description: Use when Grok Bot creates or repairs Share & Act Android rule JSON, configures service connections and reusable destinations, diagnoses rejected rule envelopes or file webhook requests, or checks compatibility with an App contract upgrade.
---

# Share & Act configuration

Generate a rule for the exact current user request and selected Bot. Deliver a configuration as validated only after the deterministic validator accepts the exact bytes under the matching contract. Structural acceptance is not proof of service readiness.

## 1. Establish the contract and selected Bot

Read `contracts/current.json` and [the envelope contract](references/envelope.md). Obtain the current selected `bot_id`, App language and contract identity from a trusted operator/deployment context. The ID must come from the current App prompt or selected Bot metadata, not an old conversation or an example. Use only `en` or `zh-CN` as an App language code; the skill documentation and fixture instructions are English.

Create a separate context file:

```json
{
  "contract_id": "THE_EXACT_ID_FROM_THE_VERIFIED_DEPLOYMENT_CONTRACT",
  "bot_id": "THE_CURRENT_SELECTED_BOT_ID",
  "language": "en"
}
```

A contract hash identifies source behavior, not an installed APK. A matching version name alone is insufficient. If the App/deployment contract cannot be established, request the current contract bundle or use the App to verify a clearly labeled draft. Do not pick the bundled hash solely to silence a mismatch.

A context can additionally contain a `connection` object with App-compatible, non-secret connection metadata. Without it, the oracle uses a synthetic connection: Bot binding is checked, but real connection availability and account authorization are not.

If an unknown envelope version, changed source fingerprint, stale validator or unapproved contract is detected, stop the validated-delivery path. Follow [the upgrade procedure](references/upgrades.md). Do not guess a migration or automatically approve a new contract.

## 2. Configure only the services the task needs

Read [service setup](references/services.md) for the relevant template. Before claiming a rule is ready:

1. Inspect actual tools and connection status in this Grok Bot environment.
2. If a required connection is missing, use an available supported connect/create flow and ask the user to complete authorization. Never invent a connector or ask for raw OAuth tokens, passwords or webhook secrets in chat.
3. Ask the user to select an existing destination or confirm creation of a new one. Inspect the chosen target and required permissions using real tools.
4. Persist verified stable IDs, URLs, names, account context, mappings and preferences in `template.instruction`. Do not add fields to the envelope. Do not rely on chat memory for future runs.
5. If setup tools, source access or authorization are unavailable, explain the blocker. A syntactically valid draft is not a ready rule. Do not claim a connection, remote write, schedule or target was created without evidence.

Future execution reuses the saved destination and connection. Ask again only when configuration is missing, authorization is revoked, the target is gone, or the user requests a change. Use append-only behavior unless the user explicitly requests and authorizes another operation. Preserve required approvals.

## 3. Generate one canonical envelope

Return exactly `envelope_version`, `rule`, `template`, and `test_input`. Use the full field recipe in `references/envelope.md`.

- Derive the name, conditions, instruction and sample from the current user's input, not a fixed PDF example.
- Bind the supplied Bot ID exactly. Use a Webhook action only.
- Generate fresh rule/template IDs, version `1`, position `0`, enabled `true`, execution mode `CONFIRM`, grant `null` and the requested output language. Match template references exactly.
- Select a realistic sample that matches at least one complete AND group. A file sample's normalized text is `attachment.<mime subtype>`, not its descriptive label or filename.
- Keep instruction destinations concrete and verified. Include source file links in records. Never embed credentials, fabricated IDs, access grants or unsupported variables.
- Do not copy fixture Bot IDs, destinations, monitoring IDs or fabricated test products from `examples/` into production rules.

Use examples only as offline structural fixtures. `examples/podcast-notion.json` includes the user-provided Spotify episode access test. Its page URL does not guarantee that audio or a transcript is accessible.

## 4. Validate the exact file

The runtime needs Node.js 20+ and Java 17+. It performs no remote writes or OAuth operations. Run from this skill directory, with paths safely quoted:

```bash
node scripts/validate.mjs "/absolute/path/rule.json" --context "/absolute/path/context.json"
```

If the Android source checkout is available, also check it:

```bash
node scripts/validate.mjs "/absolute/path/rule.json" --context "/absolute/path/context.json" --source "/absolute/path/ShareAct-Android"
```

The validator checks the approved contract and binary integrity, strict canonical generation policy, the actual compiled App envelope decoder, sample matching, template rendering and core request building. The source oracle uses the actual App sample catalog with compile-only resource stubs and ICU4J for supplementary matching; it is not an Android instrumentation test. Review Unicode case-folding edge cases on the target device when relevant.

Read the JSON report, not just the process exit code. Repair reported errors and rerun on the exact final bytes. Stop after three failed repair attempts and report the unresolved issue; do not hide errors by removing requested behavior. A successful report binds `configuration_sha256`, `context_sha256` and `contract_id`. Any edit invalidates that evidence.

If the environment cannot execute Node/Java or does not have the approved validator bundle, provide a clearly labeled unvalidated draft or transfer it to an environment that can validate. Do not claim "passed" based on mental review or JSON parsing alone. Do not call a draft "ready" while required services remain unconfigured.

## 5. Deliver and reuse

After setup and exact-file validation, the final configuration response is the JSON envelope only, without Markdown fences, comments or report fields. Keep the validation report separate if the user asks for it. If blocked, explain the blocker instead of emitting a fake ready configuration.

Tell the user during setup that importing/saving the returned JSON updates Share & Act; a Bot conversation cannot directly change an App rule. The App can additionally reject saving due to current plan capacity, deleted Bots, stale state or missing authorization. A webhook HTTP acceptance does not prove that the Bot completed its business action.

For runtime execution, read [runtime protocols](references/runtime.md). Runtime payloads and rule-configuration envelopes are different schemas.
