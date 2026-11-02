# Service setup playbooks

Apply only the playbook needed for the current user's request. Tools and connector creation mechanisms vary by Grok Bot deployment; discover actual capabilities rather than assuming a named API exists.

## Common setup and persistence

Inspect connection status and real read/create/write capabilities. If disconnected, invoke the supported connect flow and let the user authorize. If the environment cannot create/connect a service, explain the limitation and ask the user to enable the relevant connector. Do not invent a connector or claim OAuth succeeded without evidence.

Offer existing targets and user-confirmed creation. Verify the selected target and required permission, then write stable IDs, URLs, names, account context and mappings into `template.instruction` as literal settings. Do not add fields to the JSON envelope or save credentials. A destination from a previous conversation is not automatically the current user's choice.

Reuse verified stored settings in future requests. Missing/revoked access, deleted targets and explicit change requests trigger setup again. For an existing rule, return an updated valid rule envelope for the user to import/save; do not claim a chat response altered the App.

## Food calories to Google Sheets

- Check both authorized Drive/image-reading capability and the Sheets connector's read/create/append tools.
- Let the user select a spreadsheet and tab, or confirm creating a new food log. Verify append permission.
- Persist `spreadsheet_id`, `spreadsheet_url`, `sheet_id`, `sheet_name` and column mapping.
- Suggested columns: date, food, estimated portion, estimated calories, uncertainty/notes, source private URL and task ID. Create columns only after confirmation.
- Read the actual image. `Studio-photo.jpg` is French fries, not a measured serving. Label estimates and uncertainty; never invent exact weight/calories.
- Append only after authorization; do not delete or overwrite existing records. Include the source `private_url` and report success only after the write result confirms it.

## PDFs to Google Drive

- Check authorized Drive read/organize capabilities. Select an existing folder or confirm creating one.
- Persist `folder_id`, `folder_url`, naming policy and account context.
- Reuse `files[].file_id`: Share & Act already uploaded that file. Do not re-upload duplicates or make it public.
- Verify move/copy permission before claiming filing succeeded. Do not silently relocate files to an arbitrary folder.

## Podcast transcripts to Notion

- Check source retrieval, legal audio access, actual transcription tools, and the Notion connector separately.
- Let the user choose an accessible page/database or confirm creation under a selected parent.
- Persist `page_id` or `database_id`, `data_source_id` when required by the available tool, destination URL and property/content mapping.
- Prefer a legitimate available transcript; otherwise transcribe legally accessible audio using an actual tool. An open Spotify page does not establish full audio/transcript access. Never bypass DRM/login or fabricate transcript content.
- The provided access-test URL is `https://open.spotify.com/episode/1TlNXfKkC732xX1AuCMeXp`. If access fails, ask for accessible audio/transcript or a supported connector. Do not substitute a fabricated episode URL or invented transcript.
- Save the real episode title, source link and transcript only after access and authorization. Verify the Notion write before reporting success.

## Text to Google Calendar

- Check calendar read/create-event tools. Select a writable calendar or confirm creating one if supported.
- Persist `calendar_id`, calendar URL if available, `time_zone`, defaults and confirmation policy.
- Confirm missing or ambiguous dates, time zones and locations before creating an event. Reuse the configured calendar next time.
- Deduplicate with task IDs only if persistent state or reliable event lookup exists; otherwise state the limitation. Do not claim duplicate prevention based on chat memory.

## Amazon price/restock/coupon monitoring

- Check product access, a real recurring scheduler/monitoring tool, and a notification connection/channel.
- Confirm product, marketplace, region/currency, thresholds, frequency, duration and notification destination before enabling a monitor.
- Persist the verified monitoring job ID, conditions, notification target and settings scoped to this rule.
- A one-off lookup is not continuous monitoring. If recurring tools are absent, offer a one-off check and obtain agreement before changing the requested task.
- Never claim a monitor exists without a scheduling result. Do not purchase, place orders or send notifications without appropriate authorization.

## Article summaries and action-item extraction

Check source access and any required extraction connection. Do not create accounts or destinations when the task does not need an external service. Report unavailable/private sources rather than inventing article content.
