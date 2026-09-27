# Executive DWG engine 0.12.2 — corresponding source

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
