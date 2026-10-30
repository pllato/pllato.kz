// Stabilise model confidence before the nonlinear foreground threshold.
// Only the existing small mask is processed; no camera readback/model/extra stream.
export class TemporalPersonMask {
  reset(){this.history=null;this.time=null;}
  apply(rgba,width,height,now){
    const count=width*height;
    const fresh=!this.history||this.width!==width||this.height!==height||now-this.time>350||now<this.time;
    if(!this.history||this.history.length!==count)this.history=new Float32Array(count);
    this.width=width;this.height=height;
    const dt=this.time==null?50:Math.max(1,Math.min(150,now-this.time));this.time=now;
    const steady=1-Math.exp(-dt/240);
    for(let i=0;i<count;i++){
      const offset=i*4+3,current=rgba[offset],previous=this.history[i];
      // Small fluctuations settle slowly; a real foreground/background change
      // bypasses history. This avoids trailing opaque silhouettes during movement.
      const motion=Math.max(0,Math.min(1,(Math.abs(current-previous)-20)/55));
      const weight=fresh?1:steady+(1-steady)*motion*motion*(3-2*motion);
      // Keep denoising within 8 confidence levels of this frame: old edges
      // must not turn background into translucent foreground (or erase hair).
      const value=Math.max(current-8,Math.min(current+8,previous+(current-previous)*weight));
      this.history[i]=value;rgba[offset]=Math.round(value);
    }
  }
}
