# Final verification: exact-file delivery

- 50 Node.js regression tests passed.
- 38 App-source consistency cases passed, including current import diagnostics and all five template fixtures.
- 34 actual-finalizer delivery cases passed: valid files are byte-identical to checked drafts; invalid inputs create no ready output or receipt.
- The oracle compiles the unmodified App diagnostics entrypoint, envelope decoder, Bot policy, actual sample catalog and core validators/request builder. Compile-only R/RawRes stubs replace resource IDs and annotations.
- Corruption coverage includes raw newlines and quotes, Markdown-wrapped URLs/trailing links, duplicate fields, UTF-8 BOMs, unknown contracts, bad Bot IDs, template/reference errors, sample mismatch and request-size limits.
- Finalization validates before and after writing and checks output identity/bytes again before returning a separate hash receipt. Existing output/receipt files are not overwritten.
- Independent read-only review rechecked output mutation and inode replacement regressions, BOM behavior, evidence bindings and App contract-pin agreement.
- Source checks, Skill frontmatter validation and English-only artifact checks passed before publishing.

The Skill build does not modify the Android project. The parent task separately updated the App's validation-profile pin and JSON-attachment instructions under user authorization. Live OAuth, plan capacity, service permissions, remote writes and edits made after finalization are not covered by offline evidence. Attach the finalized file unchanged, verify attachment bytes when supported and import the file into the App rather than pasting rendered chat JSON.
