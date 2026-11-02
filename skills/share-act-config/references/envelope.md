# Rule-envelope format contract

The supported profile is identified by `contracts/current.json`. The actual compiled App import entrypoint and decoder are authoritative, not an inferred schema or a business example.

## Canonical fields

| Object | Fields |
| --- | --- |
| Root | `envelope_version: 1`, `rule`, `template`, `test_input` |
| Rule | Nonempty `id`, `name`; `version: 1`, `position: 0`, `groups`, `templateRef`, `action`, `enabled: true`, `executionMode: "CONFIRM"`, `grant: null` |
| Template reference | ID equals template ID; `version: 1` |
| Action | `type: "shareact.core.model.Action.Webhook"`, `connectionId` equals the trusted selected Bot ID |
| Template | Nonempty `id`, `version: 1`, caller-provided `instruction`, `outputPreferences` |
| Output preferences | `language` matches context (`en` or `zh-CN`), caller-provided string `format` (preserved unchanged) |
| Test input | All six fields: `type`, `text`, `subject`, `url`, `mime_type`, `file_name` |

Unknown fields and duplicate keys are rejected. A full configuration document (`schema_version: 2`, `rules`, `connections`) and runtime request are different formats and are not accepted here. The App normalizes some default fields; this skill deliberately requires explicit safe canonical values instead.

## Conditions

`groups` has 1-5 OR groups; each group has 1-5 AND conditions. Supported discriminators:

- `shareact.core.model.Condition.Type`: `value` is `TEXT`, `LINK` or `FILE`.
- `shareact.core.model.Condition.MimeType`: lowercase MIME; supported wildcard syntax is enforced by the App.
- `shareact.core.model.Condition.Domain`: hostname only; optional `includeSubdomains` defaults to false.
- `shareact.core.model.Condition.PathPrefix`: starts with `/`; no query, fragment or whitespace.
- `shareact.core.model.Condition.TextContains`: nonempty value; optional `ignoreCase` defaults to false.

These are structural matching predicates, not business-routing recommendations. Do not change caller-supplied conditions merely to make an unrelated sample match.

## Test-input representation

- TEXT: nonempty text without an HTTP(S) URL, null URL/filename, `text/plain` MIME.
- LINK: valid plain HTTPS URL, nonempty text, `text/plain` MIME, null filename.
- FILE: blank subject, null URL, exact filename/MIME pair from `contracts/current.json`.

Allowed FILE identifiers come from the App's task-neutral `RuleWizardTestFileCatalog`. They are protocol metadata only. No content interpretation or task instruction is attached to them by this skill. Normalized FILE text is `attachment.<MIME subtype>`; its URL/domain/path are absent.

## Instruction and encoding checks

Treat the instruction as an opaque string. The current limit is 8192 UTF-8 bytes. Allowed variables are `{{text}}`, `{{url}}`, `{{domain}}`, `{{path}}`, `{{subject}}`, `{{received_at}}`, `{{task_id}}`. Unknown/unbalanced variables fail; supported variables may also fail rendering when the chosen input lacks their value.

Use JSON serialization: embedded newlines are `\n`, embedded quotes are `\"`, and URL fields are not `[label](url)`. No code fences, Markdown wrappers or trailing text may surround the root object. Import limit is 1 MiB; subject limit is 512 Unicode code points. The oracle enforces the remaining actual App constraints.

## Exact-file delivery

`finalize.mjs` preserves the validated bytes and creates an offline copy helper plus a separate receipt. The helper's button copies decoded original text, not a reserialized object. An instruction can contain arbitrary text, including HTML-like data: it is encoded as data and displayed with textContent, never executed as markup. Clipboard permission failures do not count as successful copying.

Neither syntax validation nor file hashes establish real service permissions, factual correctness or successful business execution.
