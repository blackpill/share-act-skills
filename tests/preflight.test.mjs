import {test} from 'node:test';
import assert from 'node:assert/strict';
import {preflight} from '../skills/share-act-config/scripts/validate.mjs';
import {cases, context} from './corpus.mjs';
for (const c of cases) test(c.name, () => {
  const result = preflight(c.raw ?? JSON.stringify(c.value), context);
  assert.equal(result.ok, c.preflight, JSON.stringify(result));
});
