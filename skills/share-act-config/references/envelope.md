# Envelope contract

The supported snapshot is identified by `contracts/current.json`. The compiled App codec, not this prose or a hand-written JSON Schema, is authoritative for structural decoding.

## Required canonical recipe

| Object | Fields |
| --- | --- |
| Root | `envelope_version: 1`, `rule`, `template`, `test_input` |
| Rule | Nonempty `id`, `name`; `version: 1`, `position: 0`, `groups`, `templateRef`, `action`, `enabled: true`, `executionMode: "CONFIRM"`, `grant: null` |
| Template reference | `id` equals template ID; `version: 1` |
| Action | `type: "shareact.core.model.Action.Webhook"`, `connectionId` equals selected Bot ID |
| Template | Nonempty `id`, `version: 1`, `instruction`, `outputPreferences` |
| Output preferences | `language` equals App context (`en` or `zh-CN`), `format: "markdown"` |
| Test input | All six fields: `type`, `text`, `subject`, `url`, `mime_type`, `file_name` |

Unknown fields are rejected. Do not return the full configuration document (`schema_version: 2`, `rules`, `connections`) or a webhook runtime request.

The skill's canonical policy is deliberately stricter than the App codec: the App can accept missing default fields and normalize `enabled`, execution mode and output language. The skill requires explicit safe values and rejects duplicate keys rather than relying on normalization. These differences are recorded in the consistency report and are not decoder drift.

## Conditions and matching

`groups` is 1-5 OR groups. Each group has 1-5 AND conditions. Use full discriminators:

- `shareact.core.model.Condition.Type`: `value` is `TEXT`, `LINK` or `FILE`.
- `shareact.core.model.Condition.MimeType`: lowercase MIME type, including a supported top-level wildcard such as `image/*`.
- `shareact.core.model.Condition.Domain`: hostname only; optional `includeSubdomains` defaults to false.
- `shareact.core.model.Condition.PathPrefix`: starts with `/`; no query, fragment or whitespace.
- `shareact.core.model.Condition.TextContains`: nonempty `value`; optional `ignoreCase` defaults to false.

Do not invent discriminator names such as `type_equals` or use `field/operator` objects. Avoid filename matching through `TextContains`: for FILE samples the actual normalized text is `attachment.pdf`, `attachment.jpeg` or the equivalent MIME subtype, and the URL/domain/path are absent.

## Test input

- TEXT: nonempty text without an HTTP(S) URL, `url: null`, `mime_type: "text/plain"`, `file_name: null`.
- LINK: a valid HTTPS URL, nonempty text, `mime_type: "text/plain"`, `file_name: null`. Domain and path conditions must match the canonicalized URL.
- FILE: blank subject, null URL, exact filename and MIME pair from `contracts/current.json`.

Current FILE fixtures:

| Filename | MIME | Content |
| --- | --- | --- |
| `Quarterly-report.pdf` | `application/pdf` | Report sample |
| `Invoice-2048.pdf` | `application/pdf` | Invoice sample |
| `Studio-photo.jpg` | `image/jpeg` | Synthetic French fries photo |
| `App-screenshot.png` | `image/png` | App screenshot |

For podcast testing use `https://open.spotify.com/episode/1TlNXfKkC732xX1AuCMeXp` when it matches the rule. Do not claim source or transcript access until tools verify it.

## Template constraints

The current instruction limit is 8192 UTF-8 bytes. Supported variables are `{{text}}`, `{{url}}`, `{{domain}}`, `{{path}}`, `{{subject}}`, `{{received_at}}`, `{{task_id}}`. Braces must balance; unknown variables fail. A supported variable can still fail rendering when the chosen sample lacks its value. Use `{{text}}` for file metadata, not `{{url}}` for an absent file-input URL; runtime file URLs arrive through the attachment payload instead.

Import limit: 1 MiB. Subject limit: 512 Unicode code points. Detailed constraints, URL normalization and template parsing are enforced by the source oracle. New contracts must be reviewed rather than inferred from these remembered limits.

## Connection context

The offline fallback supplies synthetic Grok connection metadata solely to exercise the actual decoder. It does not prove a real Bot exists. If an actual `connection` object is supplied in the separate context, only non-secret App metadata is allowed: Grok adapter, POST, one Authorization secret reference, empty query, null custom body and no retries. The validator does not resolve secret references or call that endpoint.
