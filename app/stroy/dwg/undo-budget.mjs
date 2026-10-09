// Count shared File/Blob snapshots once; patch-only undo entries share their file.
// Always retain the latest operation, even when that single file exceeds budget.
export function boundedUndo(entries,{bytes=96*1024*1024,count=15}={}){
 const kept=[],files=new Set();let used=0;
 for(let i=entries.length-1;i>=0;i--){
  const entry=entries[i],file=entry?.file||entry?.sourceFile;
  const extra=file&&!files.has(file)?Math.max(0,Number(file.size)||0):0;
  if(kept.length&&(kept.length>=count||(extra>0&&used+extra>bytes)))break;
  kept.push(entry);used+=extra;if(file)files.add(file);
 }
 return kept.reverse();
}
