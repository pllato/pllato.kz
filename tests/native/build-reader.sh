#!/bin/sh
# Rebuild the reader from its corresponding GPL source archive.
# Requires Emscripten 6.0.10 (emcc/em++ on PATH) and Python >=3.10.
set -eu
reader_source=${1:?Path to extracted libredwg-web source}
reader_output=${2:?Output directory}
mkdir -p "$reader_output/objects"
for unit in dwg common codepages bits logging decode decode2 decode_r11 decode_r2007 reedsolomon print free hash dynapi classes dwg_api objects geom out_dxf out_dxfb out_json out_geojson encode encode2 dxfclasses in_dxf in_json; do
  emcc "$reader_source/src/$unit.c" -I"$reader_source/include" -I"$reader_source/src" -I"$reader_source/pllato-build-config" -O1 -w -DDEBUG_CLASSES -c -o "$reader_output/objects/$unit.o"
done
em++ "$reader_source"/bindings/javascript/embind/*.cpp "$reader_output"/objects/*.o -I"$reader_source/include" -I"$reader_source/src" -I"$reader_source/pllato-build-config" -O1 -w -DDEBUG_CLASSES -lembind -std=c++17 -sALLOW_MEMORY_GROWTH=1 -sINITIAL_MEMORY=67108864 -sMAXIMUM_MEMORY=4294967296 -sSTACK_SIZE=5242880 -sEXPORT_ES6=1 -sMODULARIZE=1 -sEXPORT_NAME=createModule -sEXPORTED_RUNTIME_METHODS=FS,ENV,ccall,cwrap,UTF8ToString,stringToNewUTF8,setValue -o "$reader_output/libredwg-web.js"
