// Native file drops use the same opener and unsaved-work confirmation as Browse.
export function mountFileDrop(target,{open,busy,status,highlight=()=>{}}){
 let depth=0;
 const files=e=>Array.from(e.dataTransfer?.types||[]).includes('Files');
 const reset=()=>{depth=0;highlight(false);};
 target.addEventListener('dragenter',e=>{if(!files(e))return;e.preventDefault();depth++;highlight(true);});
 target.addEventListener('dragover',e=>{if(!files(e))return;e.preventDefault();e.dataTransfer.dropEffect=busy()?'none':'copy';});
 target.addEventListener('dragleave',e=>{if(!files(e))return;if(--depth<=0)reset();});
 target.addEventListener('drop',e=>{
  if(!files(e))return;e.preventDefault();reset();
  if(busy())return status('Дождитесь завершения текущей операции перед открытием файла.');
  const selected=Array.from(e.dataTransfer.files||[]);
  if(selected.length!==1)return status('Перетащите один файл DWG или DXF.');
  const file=selected[0];
  if(!/\.(dwg|dxf)$/i.test(file.name))return status('Поддерживаются файлы DWG и DXF.');
  return open(file);
 });
 target.addEventListener('dragend',reset);
}
