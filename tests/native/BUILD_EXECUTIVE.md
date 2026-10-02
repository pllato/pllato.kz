# Executive DWG engine 0.17.25 — corresponding source

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
