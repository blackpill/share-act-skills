# Compliance-only configuration and copy delivery

- 58 Node.js regression tests passed.
- 38 App-source consistency cases passed; caller-provided instruction content and output format are preserved.
- 32 actual-finalizer delivery cases passed using three generic TEXT/LINK/FILE fixtures.
- Current Skill guidance contains no business playbooks or business-template fixtures. It does not configure services, choose destinations or execute instructions.
- The oracle compiles the actual task-neutral App catalog, diagnostics and decoder. Business-example and configuration-generation classes are not included in the validator JAR.
- Finalization produces unchanged JSON, a separate receipt and a real offline HTML copy button. Payloads are base64 data rendered with textContent under a hash-pinned CSP; clipboard denial is reported honestly.
- Browser checks confirmed successful integrity initialization, an enabled 48px copy button, selectable raw JSON and no rendered HTML children inside the JSON view. Automated tests verified exact clipboard text and inert HTML-like payloads.
- Independent review rechecked scope isolation, output-format preservation, copy-helper CSP/data isolation and independent cleanup of failed delivery artifacts.

Offline evidence certifies structural compliance for the approved profile, not live account state or business correctness. The HTML helper is not a claimed native Bot control: unsupported platforms receive a file to open in a browser. App runtime setup and business examples are maintained outside this Skill.
