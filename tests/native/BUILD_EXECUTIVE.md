# 0.17.100 — owned MTEXT annotation contexts

Fixes CLONE_REJECT_TYPE MTEXTOBJECTCONTEXTDATA for complete annotation data.
Each context must have a bounded owned dictionary chain to its MTEXT and a
version 3/4 typed payload. Annotation SCALE is shared only when its canonical
ACAD_SCALELIST membership and both owners are verified. No source objects or
unsupported payloads are silently removed. Direct MTEXT separation transforms
its annotation geometry too; opaque contexts and depth exhaustion fail closed.

Verified: 246 unit tests; 11 real contexts with negative version, column, scale,
membership and owner tests, transform dry-run/application, opaque and depth
refusal tests. Exact failing private root now creates an executive, saves whole
DWG, reopens and separately edits a planar LINE, then saves/reopens again.
The test avoids OCS-incompatible lines rather than weakening the move guard.
AutoCAD 2027 Core Console independently opens and saves the candidate; all
22 annotation contexts retain owner, scale and geometry after AutoCAD save.
AUDIT No reports the same 300 source XData errors before and after export;
this fixture is not claimed error-free. Original SHA256 is unchanged.
WASM and matching GPL source archive must ship together. Physical tablet RAM
limits and untested CAD classes remain outside this verified result.

## 0.17.99 source-body and container fidelity

Rebuild with build-executive.sh and accompanying source archive. The grouped EED
encoder patch is already applied; do not apply it a second time. Raw LEADER and
block move/scale dispatch uses independent scratch string/handle buffers: retaining
source bitsize must never let obj_string_stream reposition the output buffer.
source-body-backup-regression checks source frame bounds and rejects CRC corruption.
source-container-layout-regression checks sparse AcDs pages, Handles active
terminator/tail, negative corruption, source SORT guards and exact auxiliary bytes.
aligned-transform-regression checks real dimensions; model-owned-handles-regression
and relative-clone-ref-regression check reference kinds; eed-mixed-sections-regression
checks three APPID groups over repeated encodes. An old native library is insufficient
for current full-class integration: use the complete accompanying DEBUG_CLASSES build.
Independent AutoCAD testing remains necessary in addition to round-trip validation.

## 0.17.95 bounded association envelopes

Admit exact class/owner/reference envelopes for rotated-dimension action bodies,
osnap/edge params and centerline bodies. Preserve raw non-handle payload and padding,
relocate the complete bounded handle stream, then validate all references.
Global registries require exact bounded dictionary membership to NOD or canonical
Model extension dictionary; copied local actions/networks register independently.
SORTENTSTABLE sort_ents are arbitrary ordering keys, not object dependencies:
https://help.autodesk.com/cloudhelp/2018/ENU/AutoCAD-DXF/files/GUID-462F4378-F850-4E89-90F2-3C1880F55779.htm
Paired ents still follow every reference/owner validation.

assoc-envelope-regression.c takes input.dwg selected-root-handles new-output.dwg.
It checks negative boundary/owner cases, exact payload/padding and sort keys,
resolvable remapped references, duplicate registration refusal, save/reopen.
dwg-large-workers.mjs accepts an optional additional-root CSV for private fixtures.
Rebuild writer WASM and matching GPL source archive together.

## 0.17.94 typed-record source preservation

Restore size/bitsize/handlestream_size for all records after full encoding and
before pp_merge_save. Typed records can also have encoder scratch boundaries;
otherwise unchanged incomplete typed decoding can be rewritten unnecessarily.
All fidelity/owner guards remain. source-preservation-regression.c takes an
optional fourth argument: an unchanged handle required to remain byte-exact.
DWG_PRESERVE_SOURCE=1 enables the matching full-file path in the customer probe.
dwg-varied-workers.mjs selects different real areas through selectExecutiveRoots,
creates each consecutively and checks full export/reopen/root inventory/hash.
Rebuild the generated writer and its corresponding source archive together.

## 0.17.93 opaque handle-width growth

Opaque table/ASSOCARRAYACTIONBODY cloning supports larger object IDs. Update
common-header boundaries for the new own-handle width; rebuild only the separately
bounded handle stream when referenced IDs require additional bytes. Verify every
remapped reference, exact non-handle prefix and trailing padding; never discard
opaque payload or weaken dependency/owner guards. lookup owner payload stays fixed.

Private regression: `node --expose-gc tests/dwg-repeat-workers.mjs input.dwg
output-directory associated-dimension-handle additional-root-handles cycles`.
The native opaque-handle-growth-regression.c takes input, selected root, new output;
checks a 3-to-4-byte opaque body handle boundary, references and save/reopen.
Generated writer WASM and corresponding source archive must be shipped together.

## 0.17.92 DIMASSOC referenced-object paths

DIMASSOC subentity/path fields are present when num_xrefs is nonzero, including
osnap_type=0. Conditioning these fields on the snap type misaligned the record
and produced CLONE_REJECT_CLASS DIMASSOC. The decoder and typed encoder now use
the same path-count condition. No opaque coverage, ownership or fidelity guard
was removed. dimassoc-paths.patch is already applied to the corresponding source.
Rebuild with `sh build-executive.sh extracted-source output-directory` using
Emscripten 6.0.10 on PATH; bundled pllato-build-config/config.h matches the build.

Private regression: `node --expose-gc tests/dwg-dimassoc-workers.mjs input.dwg
output-directory dimension-handle`. It includes the associated dimension in five
consecutive creates, reads each result, and exports/reopens the complete DWG.
The native dimassoc-paths-regression.c checks exact typed payload coverage of all
DIMASSOC records. Ship generated JS/WASM with the corresponding source archive.

## 0.17.85 mirrored INSERT and SPLINE separation

Negative-Z planar INSERTs retain OCS normal and scale; translation and sheet
rotation are converted to their mirrored OCS, including attached attributes.
Angles are normalized into [0, 2π). SPLINE transforms control and fit points and
tangent vectors while retaining knots, weights, degree and flags. Tilted planes
remain guarded. `pllato_check_separate_sheet` performs the same non-mutating
preflight before accepting executive creation, so unsupported roots do not
first fail only when downloading. Existing opaque/owner/fidelity guards remain.

Private fixtures stay outside Git. Run `node tests/dwg-mirrored-insert-native.mjs
input.dwg mirrored-handle` and `node tests/dwg-separated-spline-native.mjs
input.dwg`. Both exercise translated and 90-degree rotated copies and SDK reread.
Ship generated JS/WASM and matching source tar together.

## 0.17.81 separate executive roots

`pllato_separate_sheet.h` is included after removal support and before save
validation. Export unwraps only PLL_SHEET blocks; import temporarily regroups
verified Model roots. Rebuild JS/WASM and the corresponding source tar together.
`node tests/dwg-separated-workers.mjs private-input.dwg private-output.dwg`
exercises actual worker save/read/import/re-export without browser UI. Input
must contain an executive; it and outputs stay private. The existing source
preservation, opaque coverage, owner, field and inventory guards remain active.

## 0.17.78 reader and large-page repair

Data-page decompressed size excludes the physical 32-byte header. Verify with
`node tests/dwg-section-size-regression.mjs /local/native-saved.dwg`. A private
102071-record round trip passed, including 951 physical pages and AutoCAD AUDIT No.
The separately rebuilt reader now uses BD for MTEXT background fill scale in
dwg.spec, dwg.h and dynapi.c, matching the writer. This prevents column-array
misalignment and a WASM bounds failure on AutoCAD-saved DWG2018. Both generated
JS/WASM and both corresponding GPL source archives must be shipped together.

# Executive DWG engine 0.17.25 — corresponding source

## 0.17.77 — DWG container and anonymous-block export repair

Fixed nonminimal UMC handle-map offsets, R2004+ Classes trailer, mandatory
empty INFO descriptor, and plaintext AppInfo encryption flag in LibreDWG.
The exporter now raises HANDSEED above every allocated handle and writes the
anonymous BLOCK_HEADER prefix separately from the full BLOCK entity name.
Malformed or inconsistent names are rejected; ownership, dependency, text-width,
same-version and retained-record fidelity checks remain enabled.
Writer JS/WASM and corresponding GPL source were rebuilt together (Emscripten
6.0.10). The source contains the patched library, not only wrapper changes.

Additional repair: cloned relative soft references retain code 4 instead of
being converted to hard-pointer code 5. The latter caused AutoCAD
`eWrongObjectType` on cloned block table records. Selected exports retain the
mandatory ACAD APPID, scale dictionary and persisted variable dictionary.
ATTRIB/ATTDEF constructors initialize width_factor=1; invalid imported widths
are rejected, never silently repaired.

The current browser workers (create, export, re-export, add TEXT, save again)
produced a nested-block DWG that independently passed ordinary AutoCAD 2027
opening and AUDIT / No (0 found/fixed/erased). A nested LINE, TEXT and top-level
INSERT were individually edited, a separate DWG2018 copy saved, closed and
reopened; the second AUDIT / No also reported 0/0/0. This is a synthetic fixture
seeded from an AutoCAD reference, not a claim of universal lossless export.
Native regressions cover cloned owner reference semantics, system dictionaries,
attribute widths and export identifiers. Current unit tests: 192 passed.

Verified locally: 192 unit tests; native identifier regression (low/high seed,
anonymous prefix/full name, inconsistent-definition refusal); WASM executive
clone/rotation/ownership regression; browser workers create/export/re-export,
add TEXT and save again on a synthetic nested-block fixture. A direct WASM
write of a private large candidate was independently opened in AutoCAD 2027:
AUDIT / No: 16100 active objects, 395 blocks, 0 errors, 0 fixed, 0 erased.
The direct WASM large output also passed LINE editing, separate DWG2018
save/reopen and a second AUDIT / No with 0 errors.
The previously isolated corrected large candidate additionally passed individual
LINE, TEXT, DIMENSION and device-block editing plus save/reopen/AUDIT / No.
These checks do not establish byte identity or full fidelity to the initial
browser project. Fonts absent on the test Mac were substituted. DWG2007 writing
still requires a separate CAD conversion; arbitrary dynamic/proxy graphs are
not universally supported. Customer files and private logs are not distributed.


## 0.17.76 empty draw-order owner repair

The wrapper validates SORTENTSTABLE ownership before writing. Only an empty,
fully decoded table with a null block reference can be repaired, and only when
dictionary membership, dictionary owner and block extension dictionary agree.
Nonempty/mismatched cases fail closed. sort-owner-regression.c covers repair,
idempotence, invalid membership, nonempty tables, wrong references and round-trip.
Only rebuild the wrapper; no new library changes. Ship matching source archive.

## 0.17.75 TEXT width

`src/dwg_api.c`: dwg_add_TEXT initializes width_factor to 1.0, not calloc's zero.
Actual AutoCAD AUDIT of a customer copy reported 22 generated TEXT handles twice
(44 errors). Local inspection confirmed width_factor=0 at every listed handle.
The wrapper rejects nonfinite/nonpositive TEXT widths before writing, without
silently changing imported text. text-width-regression.c tests creation, invalid
width rejection and preservation of a custom 0.75 width through save/read.
Rebuild both host and WASM libraries and wrapper; matching source is included.
This fixes the observed width defect, NOT all AutoCAD compatibility issues.

## 0.17.74 proxy references and MTEXT backgrounds

Decoded PROXY_OBJECT dependencies preserve their opaque payload bit-for-bit.
Their explicit object-ID references are allocated independently (the library
decoder interns them), then remapped with the normal dependency graph. Unknown
tails and DXF-only envelopes remain rejected. Partial payload bytes use the
least-significant-bit layout of bit_read_bits, not the stream bit order.
proxy-clone-regression.c checks independent references, payloads, round-trip and
rejection of incomplete envelopes/corrupted payload bits.

MTEXT bg_fill_scale is BD, not BL: fractional background margins previously
misaligned the following color/transparency data. include/dwg.h, src/dwg.spec
and src/dynapi.c in the matching source archive contain the correction; the
reference patch is explanatory (already applied). Rebuild the entire library
after this structure change, not only the wrapper. mtext-background-regression.c
checks a 1.5 margin and background color through write/read.

Customer DWG converted locally with ODA to DWG2013: browser create/export and
independent ODA read/write passed with Audit disabled and Recover NONE. This
does not implement browser conversion of DWG2007 or universal proxy compatibility.

## 0.17.70 dimension removal

pllato_dimension_hide removes a linear dimension from display through the native
invisible bit, retaining its association graph and private graphics. Both writer
paths support dimensionHidden. Rebuild wrapper and matching source archive.

## 0.17.66 dependency visibility

The wrapper retains semantic dependency roots but marks those outside the explicit
selection prefix invisible (including owned INSERT attributes). Rebuild the wrapper
and replace its matching archived source. Compile clone-dependency-visibility.c
against the same host library; pass the synthetic clone fixture and a NEW output
path. It checks retained references, visibility and source independence through
write/read. This does not repair pre-existing malformed MTEXT payloads.

## 0.17.65 attribute and field correction

The archive includes the corrected embedded MTEXT handle order and annotative
payload, ATTRIB binary tail (no DXF duplicate byte), and FIELD value flags/inline
Unicode bytes. Both the full customer source and executive pass ODA 27.9 read/write
with AUDIT disabled and Recover NONE. This supersedes the full-source limitation
below, not the requirement for independent checks on other drawings.

Build `attribute-field-regression.c` against the patched library like the other
native regressions; pass a synthetic `dwg-clone-fixture.c` DWG and a NEW output
path. It checks multiline ATTDEF and FIELD numeric flags/string preservation.
The test contains no customer content. The source archive and WASM must stay paired.

## 0.17.64 section framing correction

`src/encode.c`: the extended Header/Classes byte-length prefix has two DWORDs.
Neither belongs to the declared payload length; both belong to CRC16 coverage.
The Classes high DWORD is zero, not `bitsize / 8`. The corresponding archive
contains this fix. Test the emitted DWG2018 with
`node tests/dwg-section-size-regression.mjs /absolute/local-output.dwg` and an
independent reader. ODA 27.9 verified the customer executive and browser-edited
executive without recovery. Full-source multiline ATTDEF compatibility remains
an independent known issue; same-engine read-back alone is insufficient.

GNU LibreDWG 0.14, GPL-3.0-or-later. No paid SDK. The source archive includes the already-patched library, `pllato_web.c`, `pllato_executive_engine.c`, `pllato_dimension_edit.h` and `pllato_selected_export.h`. Do not apply the reference patches a second time.

With Emscripten 6.0.10 activated and Python >=3.10:

```sh
mkdir build-executive
cd build-executive
emconfigure ../configure --disable-shared --disable-docs --disable-python --disable-bindings CFLAGS=-O1
make -C src -j1 libredwg.la
emcc ../pllato_executive_engine.c src/.libs/libredwg.a -I.. -I../include -I../src -Isrc -O1 -sMODULARIZE=1 -sEXPORT_ES6=1 -sENVIRONMENT=web,worker,node -sALLOW_MEMORY_GROWTH=1 -sINITIAL_MEMORY=67108864 -sMAXIMUM_MEMORY=4294967296 -sSTACK_SIZE=5242880 '-sEXPORTED_RUNTIME_METHODS=["ccall","FS"]' -o pllato-executive-engine.mjs
```

Serve both generated files together. The worker always writes a new copy and validates a re-read before returning it. A failed copy discards the worker, not part of the source graph. The same-version gate rejects R2007, undecoded dependencies and unsupported ownership patterns. It must not be disabled to force success.

Known limitations: no independent AutoCAD audit, no universal dynamic/proxy-object compatibility, only model space, substituted CAD fonts, bounded metadata (4 MiB). Read warnings remain visible. Native regression tests and the browser workflow are included in the editor repository under `tests/`; the customer drawing is not distributed.

## Current Mac toolchain (verified for 0.15)

Run from the repository root. The Homebrew `bin/emcc` wrapper in this local
toolchain contains an unresolved placeholder; call `emcc.py` with Python 3.14.
The default system Python 3.9 is too old. These absolute paths are local setup,
not portable prerequisites; use the recipe above on another machine.

```sh
EM_CONFIG=/Users/platontsay/Projects/pllato-dwg-toolchain/emscripten-config.py \
/opt/homebrew/bin/python3.14 \
/Users/platontsay/Projects/pllato-dwg-toolchain/emscripten/6.0.10/libexec/emcc.py \
tests/native/pllato_executive_engine.c \
/Users/platontsay/Projects/libredwg-0.14/.build-pllato-wasm/src/.libs/libredwg.a \
-I/Users/platontsay/Projects/libredwg-0.14 \
-I/Users/platontsay/Projects/libredwg-0.14/include \
-I/Users/platontsay/Projects/libredwg-0.14/src \
-I/Users/platontsay/Projects/libredwg-0.14/.build-pllato-wasm/src \
-O1 -sMODULARIZE=1 -sEXPORT_ES6=1 -sENVIRONMENT=web,worker,node \
-sALLOW_MEMORY_GROWTH=1 -sINITIAL_MEMORY=67108864 \
-sMAXIMUM_MEMORY=4294967296 -sSTACK_SIZE=5242880 \
'-sEXPORTED_RUNTIME_METHODS=["ccall","FS"]' \
-o app/stroy/dwg/vendor/pllato-executive-engine.mjs
```

## Corresponding-source release checklist

0.17.25 supersedes the incorrect blanket C0 exclusion from 0.17.24.
The color-book handle is read/written AFTER owner/reactors/extension dictionary
and BEFORE layer, per ODA section 20.4.2. It is handled in
`src/common_entity_handle_data.spec`, not before that spec in decode/encode.c.
Genuine C0 DBCOLOR references are retained. Save/read-back also verifies common
owner, layer, color and extension-dictionary handles. The owned-dictionary
removal experiment is not used; ownership guards remain enabled.

Selected export uses `pllato_selected_export.h` to extract a closed native graph
while preserving record handles, nested blocks and opaque payloads. It does not
delete all original roots one by one. `dwg_dynapi_header_fields()` is added in
`src/dynapi.c`, its generator `src/gen-dynapi.pl` and `src/dynapi.h` so header
dependencies are included. Registry memberships are filtered, semantic links
to excluded roots are rejected. TABLESTYLE common reactor memberships have a
bounded bit-preserving rewrite; its undecoded cell-style payload is retained.
Every retained typed record is re-encoded and compared after save/read, raw
records are compared bitwise, and common reactor arrays are checked separately.
Run `selected-export-regression.c` with the color fixture and a new output path;
run `selected-export-reactors.c` without arguments for bit-boundary tests.

The reader uses the separately archived libredwg-web commit
`1dd682f46339f37b67c5ff1085d10d04a8c16d7e` with the same handle-order correction.
`build-reader.sh` and the exact Emscripten `pllato-build-config/config.h` accompany
its archive. Run `tests/native/build-reader.sh EXTRACTED_SOURCE OUTPUT_DIR`.
The SDK maps variable-class numbers by decoded class name, since those enum
numbers differ between reader versions. Do not swap only one of the JS/WASM pair.

Synthetic regression: build `color-handle-regression.c` like the other native
tests, then run with the nested-block fixture and a NEW output path. It creates
a DBCOLOR and tests model-space and block-owned INSERT color/owner/layer/block
references through save/read. Use that output with `dwg-executive-native.mjs`
and `dwg-executive-export-browser.cjs` for clone/export regressions.

- `app/stroy/dwg/vendor/pllato-executive-source.tar.gz` contains the patched
  LibreDWG tree and wrapper. Extract into a fresh temporary directory, never over
  another worktree. Reference patches here describe changes already present.
- When only the wrapper changes, replace the archived wrapper with
  `tests/native/pllato_executive_engine.c` and verify identical SHA-256 hashes.
  When the library changes, include the actual patched library sources too.
- Preserve the large BLOCK_HEADER owner-list and encoder MS-growth fixes from
  0.14.3. Building against unpatched upstream is not equivalent.
- Ship generated `.mjs`, `.wasm` and corresponding source together. Never hand-edit
  generated engine logic. Run native write/re-read and browser export regressions.
- See [DWG handoff](../../app/stroy/dwg/HANDOFF.md) for test commands and release state.

## 0.17.80: original record layout for full DWG 2018 saves

The corresponding-source archive also contains `pllato_source_preserve.h`.
Call `pllato_preserve_source(inputPath)` immediately after `pllato_open`, before
editing, for full-document AC1032 operations. Cache failures abort the operation.
Selected-object export keeps its separate validator and does not enable this mode.
Unchanged records retain their original bytes and logical addresses; changed
records replace their bounded slot or append when they grow. The Handles map is
rebuilt in handle order only when needed. All source auxiliary sections, including
AcDs and inactive object-section bytes, are retained. Header is regenerated;
Classes is regenerated when new classes appear. Final retained record bytes and
changed/new typed fields are checked independently on readback.

A narrowly bounded empty SORTENTSTABLE exception requires unchanged source bytes
and either a verified registered owner chain or an unreachable missing owner.
Populated, changed, new, conflicting, or incompletely decoded tables keep the
existing rejection/repair checks. Encrypted sections are rejected except the
upstream writer's byte-exact eight-zero empty FileDepList stub. Data pages use
verified uncompressed encoding; saves can grow and need memory. This is not a
universal repair operation and does not fix pre-existing AutoCAD AUDIT errors.

Regression: `tests/native/source-preservation-regression.c` exercises changed
record growth, retention, readback, source immutability and CRC rejection.

## 0.17.96 regression additions

Build the executive source with the same DEBUG_CLASSES configuration and patched
library objects. OSNAP sibling envelopes preserve bounded raw payload and remap
all references; no generic class/owner/stream guard is bypassed. The standalone
ellipse-transform-regression.c checks exact WCS rotation/translation, unchanged
Z, ratio and arc parameters, and invalid ratio rejection on a supplied fixture.
Browser pending-plan tests use generated training data, never customer drawings.
