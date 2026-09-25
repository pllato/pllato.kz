/* Group only repeated, collinear strokes. Native PDF dash paths already select whole. */
(function(){
'use strict';
function chain(seed,scene,taken){
 const straight=o=>!o.style.fill&&o.style.stroke&&o.p.length===2&&o.paths.length===1&&!o.style.dash.length;
 if(!straight(seed))return[];const a=seed.p[0],b=seed.p[1],len=Math.hypot(b[0]-a[0],b[1]-a[1]);if(len<.2||len>30)return[];const ux=(b[0]-a[0])/len,uy=(b[1]-a[1])/len,tol=Math.max(.15,seed.style.width*.5),key=o=>JSON.stringify([o.layer,o.style.stroke,o.style.width,o.style.cap,o.style.alpha]);const style=key(seed),candidates=[];
 for(const o of scene.objects){if(taken.has(o.id)||!straight(o)||key(o)!==style)continue;const q=o.p,l=Math.hypot(q[1][0]-q[0][0],q[1][1]-q[0][1]);if(l<len*.7||l>len*1.3)continue;if(q.some(p=>Math.abs((p[0]-a[0])*uy-(p[1]-a[1])*ux)>tol))continue;const ts=q.map(p=>(p[0]-a[0])*ux+(p[1]-a[1])*uy);candidates.push({o,start:Math.min(...ts),end:Math.max(...ts)});}
 candidates.sort((a,b)=>a.start-b.start);const index=candidates.findIndex(v=>v.o===seed);if(index<0)return[];let lo=index,hi=index;const validGap=g=>g>Math.max(.1,seed.style.width)&&g<len*2;
 while(lo>0&&validGap(candidates[lo].start-candidates[lo-1].end))lo--;while(hi<candidates.length-1&&validGap(candidates[hi+1].start-candidates[hi].end))hi++;
 const group=candidates.slice(lo,hi+1);if(group.length<3)return[];const gaps=group.slice(1).map((v,i)=>v.start-group[i].end),median=gaps.slice().sort((a,b)=>a-b)[Math.floor(gaps.length/2)];if(gaps.some(g=>Math.abs(g-median)>Math.max(.3,median*.25)))return[];return group.map(v=>v.o);
}
function promote(seed,scene,taken){const group=chain(seed,scene,taken);if(!group.length)return false;pushHistory();const sx=S.W/scene.width,sy=S.H/scene.height,grp='dash-'+Date.now()+'-'+S.seq,ids=[];for(const raw of group){const pts=raw.p.map(p=>({x:p[0]*sx,y:p[1]*sy})),o=addObj({type:'line',src:'pdf',color:raw.style.stroke,width:raw.style.width*sx,pts,cat:standaloneVectorCat(raw.style.stroke)||'other',nocalc:true,grp,_pdfDashGroup:true,_lkSource:true,_pdfIds:[raw.id],_pdfD:raw.d,_pdfStyle:raw.style,_pdfSx:sx,_pdfSy:sy,_pdfOriginalPts:pts.map(p=>({...p})),ea:{kind:'free',h:0},eb:{kind:'free',h:0}});ids.push(o.id);}redrawAll();setTool('select');selectObj(ids[0]);lkQueueDrawingSave();toast('Пунктирная линия выбрана целиком');return true;}
const members=o=>cur().filter(v=>v.grp===o.grp&&!v._lkDeleted).map(v=>v.id);
for(const name of ['selCluster','moveCluster']){const old=window[name];window[name]=function(o){return o?._pdfDashGroup?members(o):old(o);};}
const oldDup=dup;dup=function(){const before=new Set(cur().map(o=>o.id));oldDup();const groups=new Map();for(const o of cur())if(!before.has(o.id)&&o._pdfDashGroup){if(!groups.has(o.grp))groups.set(o.grp,'dash-copy-'+o.id);o.grp=groups.get(o.grp);}if(S.selected)selectObj(S.selected);};
window.PdfDashLines={chain,promote};
})();
