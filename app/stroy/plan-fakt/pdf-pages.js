/* Keep floor plans visible; other PDF sheets remain available and export unchanged. */
(function(){
'use strict';
const original=buildStrip,jobs=new WeakSet(),states=new WeakMap();
function group(pg){return pg.pageGroup||pg.pageGroupAuto||'drawing';}
function state(){let s=states.get(S.data);if(!s)states.set(S.data,s={open:false});return s;}
function classify(items,page){
  const [x0,y0,x1,y1]=page.view,w=x1-x0,h=y1-y0;
  // Read the title block, not the sheet index (which mentions every plan).
  const titles=items.filter(i=>i.str&&i.transform&&i.transform[4]>x0+w*.55&&i.transform[5]<y0+h*.14).map(i=>i.str.trim());
  const title=titles.find(t=>/(?:^|[.!?]\s*)(?:план(?:\s|$)|планы(?:\s|$)|фрагмент\s+плана|floor\s+plan)/i.test(t));
  return {group:title?'drawing':'other',title:title||''};
}
async function scan(src){if(!src||jobs.has(src))return;jobs.add(src);let failed=false;
  for(const pn of Object.keys(src.data.pages).map(Number)){
    if(S.standalonePdf!==src)return;const pg=src.data.pages[pn];if(pg.pageGroupAuto)continue;
    try{const page=await src.pdf.getPage(pn),text=await page.getTextContent();if(S.standalonePdf!==src)return;const r=classify(text.items,page);pg.pageGroupAuto=r.group;if(r.title)pg.pageGroupTitle=r.title;}catch(e){failed=true;console.warn('Page grouping',pn,e);}
  }
  if(S.standalonePdf===src){buildStrip();if(failed)toast('Часть листов не распознана: их можно перенести вручную');}
}
buildStrip=function(){const previousScroll=$('strip').scrollTop;original();if(!S.standalonePdf||S.linkedLkDocId)return;const strip=$('strip'),top=previousScroll,st=state(),thumbs=[...strip.querySelectorAll('.thumb')];strip.replaceChildren();
  const heading=document.createElement('h4'),other=document.createElement('details'),summary=document.createElement('summary'),pending=S.pageList.some(pn=>!S.data.pages[pn].pageGroupAuto);other.id='otherPdfPages';other.open=st.open;other.append(summary);other.addEventListener('toggle',()=>{st.open=other.open;});let drawings=0,others=0;
  strip.append(heading);for(const thumb of thumbs){const pn=+thumb.dataset.pg,pg=S.data.pages[pn],isDrawing=group(pg)==='drawing',wrap=document.createElement('div');wrap.className='pdf-page-entry';thumb.classList.toggle('active',pn===S.pageNum);if(pg.pageGroupTitle)thumb.title=pg.pageGroupTitle;thumb.tabIndex=0;thumb.setAttribute('role','button');thumb.setAttribute('aria-label','Открыть лист '+pn);thumb.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();thumb.click();}};
    const button=document.createElement('button');button.type='button';button.className='pdf-page-move';button.textContent=isDrawing?'В остальные':'В чертежи';button.title=isDrawing?'Убрать лист '+pn+' в остальные страницы':'Показывать лист '+pn+' среди чертежей';button.onclick=()=>{pg.pageGroup=isDrawing?'other':'drawing';buildStrip();lkQueueDrawingSave();};wrap.append(thumb,button);if(isDrawing){drawings++;strip.append(wrap);}else{others++;other.append(wrap);}}
  heading.textContent='Чертежи · '+drawings;if(pending){const note=document.createElement('p');note.className='pdf-page-note';note.textContent='Определяю планы…';strip.prepend(note);}if(!drawings){const note=document.createElement('p');note.className='pdf-page-note';note.textContent='Раскройте остальные страницы и выберите «В чертежи».';strip.append(note);}
  summary.textContent='Остальные страницы · '+others;strip.append(other);strip.scrollTop=top;observeThumbs();scan(S.standalonePdf);
};
const style=document.createElement('style');style.textContent=`
.pdf-page-entry{margin-bottom:12px}.pdf-page-entry .thumb{margin-bottom:2px}.pdf-page-move{display:block;width:100%;min-height:28px;padding:4px 2px;border:1px solid var(--line);border-radius:4px;background:var(--panel);color:var(--steel);font:10px var(--sans);cursor:pointer}
#otherPdfPages{border-top:1px solid var(--line);padding-top:8px}#otherPdfPages summary{cursor:pointer;font:600 11px var(--sans);line-height:1.5;padding:6px 0 12px;overflow-wrap:anywhere}.pdf-page-note{font:10px var(--sans);line-height:1.4;color:var(--gray);margin:4px 0 10px}
`;document.head.append(style);
})();
