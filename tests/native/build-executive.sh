#!/bin/sh
# Emscripten 6.0.10; rebuild from the accompanying patched GPL source.
set -eu
src=${1:?Extracted corresponding source directory}
out=${2:?Output directory}
mkdir -p "$out/objects"
for unit in dwg common codepages bits logging decode decode2 decode_r11 decode_r2007 reedsolomon print free hash dynapi classes dwg_api objects geom out_dxf out_dxfb out_json out_geojson encode encode2 dxfclasses in_dxf in_json; do
 emcc "$src/src/$unit.c" -I"$src" -I"$src/include" -I"$src/src" -I"$src/pllato-build-config" -O1 -w -DDEBUG_CLASSES -c -o "$out/objects/$unit.o"
done
emcc "$src/pllato_executive_engine.c" "$out"/objects/*.o -I"$src" -I"$src/include" -I"$src/src" -I"$src/pllato-build-config" -O1 -w -DDEBUG_CLASSES -sMODULARIZE=1 -sEXPORT_ES6=1 -sENVIRONMENT=web,worker,node -sALLOW_MEMORY_GROWTH=1 -sINITIAL_MEMORY=67108864 -sMAXIMUM_MEMORY=4294967296 -sSTACK_SIZE=5242880 '-sEXPORTED_RUNTIME_METHODS=["ccall","FS"]' -o "$out/pllato-executive-engine.mjs"
