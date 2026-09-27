# Native table copying — 0.12.3

Status: release candidate passed local clone/save/reopen and second-save tests.

The candidate in `tests/native/pllato_executive_engine.c` retains a nested
ACAD_TABLE's opaque data and parses its separately delimited handle stream.
It requires the same DWG version, unchanged handle widths, fully resolvable
references and a successful post-relocation reference comparison. It does not
claim support for model-space tables or arbitrary opaque classes.

The synthetic `table-relocation-test.c` / `dwg-table-relocation-native.mjs`
exercise data preservation, remapping, invalid streams and width overflow.
The existing 58 JavaScript tests pass; these do not establish real-file copy
or AutoCAD compatibility.

## Graph boundary fix and verification

A local broad selection of 2032 roots passes two save/read cycles (567209
objects). An expanded selection of 4345 roots also passes both cycles (574073
objects). Neither is the exact UI rectangle. Read warning 68 remains visible.
Tables are real children of selected blocks, not dispensable annotations.
Associative dependencies previously led through the global ASSOCNETWORK to
the drawing's named-object dictionary and unrelated global resources.

The global network is now a shared registry. Cloned local networks are appended
with independent action indices while preserving original registry entries.
The global named-object dictionary is not traversed. ASSOCARRAYACTIONBODY uses
the same bounded raw relocation as tables, not its incomplete typed codec.
Opaque data and remapped handles must survive readback; all object handles are
checked. Pre-existing dangling references in untouched byte-identical records
are preserved, not silently repaired or treated as newly introduced damage.

Native fixtures cover independent block editing, rotation, deletion, metadata,
all seven partial-byte bit alignments and registry independence. Browser tests
cover retry/cancellation, creation, cable quantities, leaders, save/reopen and
mobile selection. Universal compatibility and external AutoCAD validation are
not claimed. Width/version/unsupported-class limits still fail closed.

Customer DWGs, root caches and diagnostic logs remain outside the repository.
