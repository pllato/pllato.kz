# Executive DWG engine 0.15 — corresponding source

GNU LibreDWG 0.14, GPL-3.0-or-later. No paid SDK. The source archive includes the already-patched library, `pllato_web.c` and `pllato_executive_engine.c`. Do not apply the reference patches a second time.

With Emscripten 6.0.10 activated and Python >=3.10:

```sh
mkdir build-executive
cd build-executive
emconfigure ../configure --disable-shared --disable-docs --disable-python --disable-bindings CFLAGS=-O0
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
