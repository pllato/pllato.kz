// The optional local helper uses the installed licensed AutoCAD. No cloud upload.
export async function convertOldDwg(bytes,{fetchImpl=fetch,progress=()=>{}}={}){
 const base='http://127.0.0.1:8818';
 let response;
 try{response=await fetchImpl(base+'/status',{signal:AbortSignal.timeout(2500),cache:'no-store'});if(!response.ok||!(await response.json()).available)return null;}catch{return null;}
 progress('AutoCAD: подготавливаю отдельную копию DWG 2018…',5);
 try{response=await fetchImpl(base+'/convert',{method:'POST',headers:{'Content-Type':'application/acad'},body:bytes,signal:AbortSignal.timeout(310000),cache:'no-store'});}catch{throw Error('Локальная конвертация AutoCAD прервалась. Исходник не изменён.');}
 if(!response.ok){const message=await response.json().catch(()=>({}));throw Error('AutoCAD не подготовил копию: '+(message.error||response.status)+'. Исходник не изменён.');}
 const converted=await response.arrayBuffer();if(new TextDecoder().decode(converted.slice(0,6))!=='AC1032')throw Error('Конвертер вернул неверный формат. Исходник не изменён.');return converted;
}
