# AC1021 writer groundwork — NOT a supported export

This directory contains an isolated first component of the requested free,
same-version DWG2007 writer. The production version gate remains unchanged.
No generated DWG is offered as a customer deliverable.

## Implemented and tested

`r2007-pages.h` implements RS(255,239)/GF(0x169) system-page and
RS(255,251)/GF(0x11d) data-page encoding, column-first interleaving and
syndrome verification. It does not mutate inputs or allocate memory.
All syndromes must pass before any decoded output is written. This detects
corruption; it does not attempt error correction. Explicit buffer capacities
and overflow guards are tested. This is an experimental scalar implementation,
not a performance-optimized production module.

`r2007-pages-regression.c` covers both configurations, 1/2/4/8 blocks, every
single-symbol corruption in each fixture, truncated buffers and size overflow.
An optional private AC1021 input checks exact reproduction of its original
765-byte encoded header, including parity (not merely our own round-trip).

`r2007-container-regression.c` parses the original page/section maps read-only,
uses the existing LibreDWG decompressor, and verifies/re-encodes original
compressed interleaved data pages. On the private user fixture: 13 sections,
450 compressed data pages reproduce exactly; 5 uncompressed pages have only
extent checks, not parity verification. Customer bytes are not included here.
Both tests were compiled with AddressSanitizer/UndefinedBehaviorSanitizer.

References: ODA Open Design DWG Specification section 5.13; LibreDWG's
`decode_r2007.c`. GF/root conventions were checked against the original file,
not accepted merely because two new functions agreed with each other.

## Run

```sh
cc -std=c11 -Wall -Wextra -Werror -O2 -fsanitize=address,undefined \
  tests/native/r2007-pages-regression.c -o /tmp/r2007-pages-test
/tmp/r2007-pages-test
# Optional read-only private reference:
/tmp/r2007-pages-test /absolute/input.dwg

cc -std=c11 -Wall -Wextra -Werror -O2 -fsanitize=address,undefined \
  tests/native/r2007-container-regression.c /absolute/libredwg.a -lm \
  -o /tmp/r2007-container-test
/tmp/r2007-container-test /absolute/input.dwg
```

## Still required (do not remove the production guard)

1. Correct non-interleaved/uncompressed page output, CRC64, random seed/check
   sequences, section/page map serialization and redundant file headers.
2. Integrate container output with R2007 object/header/string/handle streams;
   never force `from_version` or reuse R2010 framing with AC1021 magic.
3. Preserve TABLE/TABLECONTENT and their owner/reference graphs. The current
   reader marks the four records in the private fixture UNKNOWN. Same-version
   byte retention alone does not establish safe cloning/remapping of these.
4. Validate every retained record, typed field, opaque payload and dependency
   after actual modification/save/read; add synthetic table and clone cases.
5. Independently open, AUDIT, edit and save/reopen in AutoCAD. No such acceptance
   test has been performed for this experimental writer.
6. Only then rebuild WASM and ship matching GPL source, enable the version gate
   for supported cases, and run browser executive creation/export regressions.

No paid/converter dependency added. The deployed writer and user originals are
unchanged. This work does not complete executive creation for AC1021.
