import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseStrict,preflight} from '../skills/share-act-config/scripts/validate.mjs';
import {envelope,context} from './corpus.mjs';

test('escaped duplicate keys and prototype keys are handled safely',()=>{
 assert.throws(()=>parseStrict('{"a":1,"\\u0061":2}'),/duplicate_json_key/);
 const parsed=parseStrict('{"__proto__":{"polluted":true}}');
 assert.equal(Object.getPrototypeOf(parsed),null);assert.equal({}.polluted,undefined);
});
test('nested duplicate keys, excessive nesting and trailing content fail',()=>{
 assert.throws(()=>parseStrict('{"a":{"x":1,"x":2}}'),/duplicate_json_key/);
 assert.throws(()=>parseStrict('['.repeat(130)+'0'+']'.repeat(130)),/json_too_deep/);
 assert.throws(()=>parseStrict('{} true'),/invalid_json/);
});
test('unicode scalar values, surrogate errors and numeric safety are explicit',()=>{
 assert.equal(parseStrict('"\\ud83d\\ude00"'),'\u{1f600}');
 assert.throws(()=>parseStrict('"\\ud800"'),/invalid_unicode/);
 assert.throws(()=>parseStrict('9007199254740993'),/unsafe_json_number/);
});
test('context and payload size are independently checked',()=>{
 assert.equal(preflight(JSON.stringify(envelope()),{...context,language:'de'}).ok,false);
 assert.equal(preflight(' '.repeat(1048577),context).error,'file_too_large');
});
