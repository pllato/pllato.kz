// Same starter choices as the graphical editor; free text remains allowed.
export const cableBrands=['АсВВГнг(А)LS','ВВГнг(А)-LS','АВВГнг(А)-LS','ВВГнг(А)-FRLS','КВВГнг(А)-LS','ПВ3','ПуГВ'];
export const cableSections=['2×1,5','3×1,5','3×2,5','3×4','3×6','3×10','3×16','4×2,5','4×4','4×6','4×10','4×16','5×2,5','5×4','5×6','5×10','5×16'];
export function mountCableCatalog(){
 for(const [suffix,defaults] of [['Brand',cableBrands],['Section',cableSections]]){
  const list=document.createElement('datalist');list.id='cableCatalog'+suffix;document.body.append(list);
  const values=new Set(defaults),fields=['ex','cw','lw','cn','dp'].map(p=>document.getElementById(p+suffix)).filter(Boolean);
  function refresh(){for(const field of fields){const value=field.value.trim();if(value&&value.length<=1000)values.add(value);}list.replaceChildren(...[...values].map(value=>new Option(value,value)));}
  for(const field of fields){field.setAttribute('list',list.id);field.setAttribute('autocomplete','off');field.title='Выберите из каталога или введите своё значение';field.addEventListener('focus',refresh);field.addEventListener('change',refresh);}
  refresh();
 }
}
