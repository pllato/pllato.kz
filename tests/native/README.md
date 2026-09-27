# Experimental executive DWG gate — 0.12

`pllato_clone_probe.c` includes the existing GNU bridge `pllato_web.c` and is linked against the same patched GNU LibreDWG 0.14 archive. The include path must contain that bridge, `include/`, `src/`, and the configured build's `src/`. Emscripten flags match the production bridge; expose `ccall` and `FS`. Do not replace the released engine with this probe.

Generate a new synthetic input with `tests/dwg-clone-fixture.c`, linked against the native LibreDWG archive. Its output must not exist already. It contains a nested block, ATTDEF/ATTRIB and an associative solid HATCH. The fixture compensates for the upstream ATTRIB constructor replacing INSERT.block_header; this workaround is not a production engine patch.

Run `tests/dwg-clone-probe.mjs` with `DWG_CLONE_MODULE` set to the experimental Emscripten module and `DWG_CLONE_FIXTURE` set to the synthetic DWG. No customer file or network endpoint is needed.

Checks: unique definitions, retained native entity types, independent geometry, attribute text/ownership, hatch geometry, metadata UTF-8 round trip, editing the copied LINE without modifying its source.

## Integrated engine (2026-09-28)

`pllato_executive_engine.c` is the active engine, distinct from the old single-root probe. Link against the patched archive and `pllato_web.c`, with Emscripten MODULARIZE, EXPORT_ES6, ENVIRONMENT=web,worker,node, ALLOW_MEMORY_GROWTH, INITIAL_MEMORY=67108864, MAXIMUM_MEMORY=4294967296, STACK_SIZE=5242880, and EXPORTED_RUNTIME_METHODS=["ccall","FS"]. Matching base-engine sources and the complete build recipe accompany 0.12 in `pllato-executive-source.tar.gz`; see `BUILD_EXECUTIVE.md`.

Additional library patches: `encode-payload-end.patch` exposes the exact bit position before padding/CRC (defined by the library); `block-element-version.patch` preserves decoded BlockElement versions; `stretch-selector.patch` writes the stretch selector as a byte; `tu-length.patch` excludes the in-memory terminator from counted UTF-16 strings. `raw-handle-boundary.patch` retains the original handle-stream boundary only for same-version raw BLOCKLOOKUPACTION. Set EMSDK_PYTHON to Python >=3.10 when rebuilding the archive. Opaque-backup types are admitted only after bit-exact comparison through the measured semantic endpoint. A different payload length or differing semantic bit rejects the copy. This gate does not claim an independent CAD audit.

`tests/dwg-executive-native.mjs` uses DWG_EXECUTIVE_MODULE and DWG_CLONE_FIXTURE. It verifies grouped copies, rotation, source independence, attribute movement, deleting a copied INSERT, repeated metadata updates and save/read checks. `tests/dwg-executive-browser.cjs` exercises the local UI on port 8816: rectangle selection, create, rotate, cable, leader, DWG download, reopen and second save. It disables the access gate only in that local test browser.

The customer probe accepts DWG_TEST_FILE and a verified DWG_ROOT_HANDLE to avoid loading a second decoder for large files. Root F3E6F passes cloning and save/read-back (522174 objects, warning 68). EVALUATION_GRAPH, BLOCKSTRETCHACTION and BLOCKARRAYACTION pass typed bit coverage. BLOCKLOOKUPACTION is preserved as raw bytes only with a verified sole 16-bit relative owner stream, same handle width and no EED/reactors/extension dictionary. Only that owner is remapped; raw bytes and ownership are checked after save. General lookup tables are not claimed supported. DWG_PROBE_HANDLE and DWG_PROBE_ONLY allow a bounded single-object check; prefix the handle with `trace:` and set DWG_TRACE for local diagnostics. No customer input or trace belongs in the repository.

Not yet verified: general dynamic blocks, all HATCH reactor links, arbitrary customer drawing fidelity, and independent AutoCAD audit. WIPEOUT and BLOCKREPRESENTATION typed-backup encoding remains experimental. Error recovery discards the whole worker; the prototype does not roll back a partially cloned graph. Passing synthetic tests is not permission to publish this as fully compatible.
