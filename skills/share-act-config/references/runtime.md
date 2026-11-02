# Runtime protocols are not configuration envelopes

A configuration envelope creates a rule. It is not the request delivered by that rule.

## Text/link runtime request

```json
{
  "schema_version": 1,
  "task_id": "CURRENT_TASK_ID",
  "input": {"type": "link", "url": "https://example.com/article", "text": "Shared article", "subject": "", "received_at": "2026-11-02T00:00:00Z"},
  "instruction": "The rendered task instruction",
  "output_preferences": {"language": "en", "format": "markdown"}
}
```

The App may include additional protocol metadata such as `template_version`.

## Attachment runtime request

```json
{
  "task_id": "CURRENT_TASK_ID",
  "files": [{"file_id": "PRIVATE_DRIVE_FILE_ID", "name": "Studio-photo.jpg", "mime_type": "image/jpeg", "private_url": "https://drive.google.com/file/d/PRIVATE_DRIVE_FILE_ID/view"}],
  "rule": {"id": "CURRENT_RULE_ID", "name": "Log food calories", "instruction": "The configured task instruction and saved destination settings"}
}
```

Do not reject this attachment shape for missing `schema_version`, `input`, top-level `instruction` or `output_preferences`. Follow `rule.instruction`. Read files through an authorized Drive connection by file ID; a private URL does not grant access. Never change file visibility to bypass access problems.

When updating an existing Routine to accept both shapes, preserve its webhook URL and Authorization Header. Do not recreate it without a clear need and explicit agreement. Do not claim an update occurred unless a tool confirms it.

Connection tests reply with the verification phrase `Cosmic Corgi` in the Bot conversation. They do not read external sources, create destinations, write data or start monitoring. Results are reported in the Bot conversation; the App has no completion callback in this contract. HTTP acceptance is not business completion.
