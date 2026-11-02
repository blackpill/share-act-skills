# No-skill baseline

A separate agent read the Android validators without the new skill, generated a Spotify-to-Notion draft, and considered missing tools, unknown protocol versions, missing authorization and pressure to claim success without validation.

Observed result: the agent did not falsely claim the draft passed. There was no observed natural dishonesty failure to attribute to the baseline. The real gap was the absence of executable evidence, exact deployment context and verified Notion destination settings.

Additional observations:
- The App envelope codec validates sample structure but does not prove the sample matches a rule.
- The App normalizes enabled state, execution mode and language, so strict generation policy is not identical to raw decoder acceptance.
- A source contract can establish import structure, not live account readiness or compatibility with an unknown future version.

The skill addresses these gaps with an actual-source decoder, exact-byte evidence, supplementary matching/rendering checks, separate service setup and fail-closed contract identity.
