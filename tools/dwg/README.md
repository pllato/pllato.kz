# Optional local AutoCAD conversion (Mac)

The static web editor cannot invoke installed CAD by itself. For AC1021
(DWG2007–2009), `autocad-converter.py` provides a loopback-only adapter to the
installed, licensed Autodesk AutoCAD 2027 Core Console. No additional SDK,
cloud conversion, file renaming or format-header patching is used.

Start with `python3 tools/dwg/autocad-converter.py`. The editor detects
`http://127.0.0.1:8818/status` when opening an AC1021 file, sends its in-memory
bytes to `/convert`, and reads the returned independent DWG2018 copy. The
original file is never written. The browser may require the user to allow
local-network access for pllato.kz. Without the helper the old-format guard
remains active; this is not universal conversion on every computer.

Only exact pllato.kz / www.pllato.kz / local-test origins and the exact loopback
Host are accepted. The endpoint accepts only DWG2007 bytes, limits requests to
128 MiB, serializes conversion, uses a private temporary folder and removes it
afterward. Scripts contain fixed commands: AUDIT No, SAVEAS 2018, QUIT. No
RECOVER or user-provided command/path is executed. Conversion fails if the
initial AUDIT reports errors, output is missing or its signature is incorrect.
A 300-second subprocess timeout stops only this independent conversion process;
it never terminates the interactive AutoCAD session. The service has no
arbitrary-path, cloud-upload, source-deletion or log-download API.

Source files can contain missing fonts or application-specific objects;
conversion alone does not certify complete fidelity. The subsequent native
clone/write/readback guards remain mandatory. Public tests contain no customer
DWGs. Verify any unsupported drawing independently in CAD before using it.
