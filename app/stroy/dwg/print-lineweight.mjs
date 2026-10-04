import {cableLayer} from './source-cable-lengths.mjs?v=0.17.76';

// Paper millimetres, independent of drawing units and viewport zoom.
// Original electrical paths must not become hairlines beside newly drawn ones.
export function printLineweight(shape){
 const cable=shape.text===null&&!shape.fill&&!shape.hatch&&cableLayer(shape.layer||'');
 const mm=Number.isFinite(shape.lineweight)&&shape.lineweight>0?shape.lineweight/100:.18;
 return Math.max(cable?.25:.1,mm)*72/25.4;
}
