import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {trueType} from '../app/stroy/dwg/vector-pdf.mjs';
test('Embedded CAD font maps Cyrillic, dimensions and Latin to usable glyph metrics',()=>{
 const f=trueType(readFileSync(new URL('../app/stroy/dwg/vendor/osifont/osifont.ttf',import.meta.url)));
 for(const ch of 'ВВГнг(А)-LS 3×2,5 — 12 м № Ø')assert.ok(f.glyph(ch.codePointAt(0))>0,ch);
 assert.ok(f.width(f.glyph(65))>0);assert.ok(f.ascent>0);assert.ok(f.descent<=0);
});
