const names={AC1009:'R12',AC1012:'R13',AC1014:'R14',AC1015:'2000–2002',AC1018:'2004–2006',AC1021:'2007–2009',AC1024:'2010–2012',AC1027:'2013–2017',AC1032:'2018+'};
export function dwgVersion(bytes){const signature=new TextDecoder().decode(new Uint8Array(bytes,0,Math.min(6,bytes.byteLength)));return {signature,name:names[signature]||signature,needsConversion:signature==='AC1021'};}
export const conversionMessage='Пересохраните файл в более новой версии — DWG 2018. Откройте его в AutoCAD, сохраните отдельную копию и загрузите её сюда.';
export function requireSupportedVersion(bytes){if(dwgVersion(bytes).needsConversion)throw Error(conversionMessage);}
export const requireWritableVersion=requireSupportedVersion;
export async function checkOpeningVersion(file){if(/\.dwg$/i.test(file.name))requireSupportedVersion(await file.slice(0,6).arrayBuffer());}
