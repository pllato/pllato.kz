import assert from 'node:assert/strict';
import '../app/hr/data/abstract.js';
import '../app/hr/figures.js';
const expand=cell=>cell.flatMap(p=>Array.from({length:p.count??1},()=>({...p,count:1})));
const key=p=>JSON.stringify([p.shape,p.fill,p.size,p.shape==='circle'?0:p.shape==='square'?(p.rot||0)%90:(p.rot||0)%360]);
const signature=cell=>expand(cell).map(key).sort().join('|');
for(const it of HR_ABSTRACT.items){
 assert.equal(new Set(it.options.map(signature)).size,it.options.length,it.id+' duplicate option');
 assert.equal(new Set(it.options.map(HR_FIGURES.renderShapes)).size,it.options.length,it.id+' duplicate SVG');
 for(const cell of [...it.grid.filter(Boolean),...it.options])assert.equal((HR_FIGURES.renderShapes(cell).match(/<(circle|rect|polygon) /g)||[]).length,expand(cell).length,it.id+' count rendered');
 let expected;
 const g=it.grid;
 if(it.rule==='constant')expected=g[0];
 if(it.rule==='progression'){const a=g[6][0],b=g[7][0];expected=[{...b}];if(a.count!==b.count)expected[0].count=2*b.count-a.count;else{const sizes=['s','m','l'];expected[0].size=sizes[2*sizes.indexOf(b.size)-sizes.indexOf(a.size)];}}
 if(it.rule==='distribution3'){const remaining=g.slice(0,3).map(c=>({sig:signature(c),cell:c}));for(const c of g.slice(6,8))remaining.splice(remaining.findIndex(x=>x.sig===signature(c)),1);expected=remaining[0].cell;}
 if(it.rule==='addition')expected=[...g[6],...g[7]];
 if(it.rule==='xor'){const a=expand(g[6]),b=expand(g[7]);expected=[...a.filter(p=>!b.some(x=>key(x)===key(p))),...b.filter(p=>!a.some(x=>key(x)===key(p)))];}
 if(it.rule==='two-rules')expected=[{...g[6][0],shape:g[2][0].shape}];
 if(it.rule==='rotation')expected=[{...g[2][0],rot:(2*g[2][0].rot-g[1][0].rot)%360}];
 if(it.rule==='odd-symmetry'){const matches=it.options.map((c,i)=>({c,i})).filter(({c})=>it.form==='A'?c[0].shape==='arrow'&&c[0].rot%180===90:c[0].fill===0);assert.equal(matches.length,1,it.id+' single odd option');expected=matches[0].c;}
 assert.ok(expected,it.id+' rule covered');const matches=it.options.map((c,i)=>signature(c)===signature(expected)?i:-1).filter(i=>i>=0);assert.deepEqual(matches,[it.answerIndex],it.id+' unique correct answer');
}
console.log('26 figure tasks: unique visible options, primitive counts and rule-derived correct answers passed');
