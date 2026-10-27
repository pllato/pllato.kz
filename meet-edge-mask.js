// Joint bilateral upsampling: align low-resolution alpha to the camera's edges.
// One GPU pass, no full-frame CPU readback or additional inference model.
export class EdgeMaskRenderer {
  constructor() {
    this.canvas = document.createElement('canvas');
    const gl = this.gl = this.canvas.getContext('webgl', {alpha:true, antialias:false, depth:false, stencil:false, premultipliedAlpha:true});
    if (!gl) throw new Error('WebGL unavailable');
    try {
      const compile = (type, source) => {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source); gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
          const error = gl.getShaderInfoLog(shader); gl.deleteShader(shader); throw new Error(error);
        }
        return shader;
      };
      const vertex = compile(gl.VERTEX_SHADER, `attribute vec2 position; varying vec2 uv;
        void main(){uv=(position+1.0)*0.5;gl_Position=vec4(position,0.0,1.0);}`);
      const fragment = compile(gl.FRAGMENT_SHADER, `precision mediump float;
        varying vec2 uv; uniform sampler2D mask; uniform sampler2D guide; uniform vec2 maskSize;
        void main(){
          vec3 center=texture2D(guide,uv).rgb;
          vec2 cell=floor(uv*maskSize);
          float total=0.0; float alpha=0.0;
          for(int y=-1;y<=1;y++) for(int x=-1;x<=1;x++){
            vec2 point=(cell+vec2(float(x),float(y))+0.5)/maskSize;
            vec2 distance=(point-uv)*maskSize;
            vec3 delta=texture2D(guide,point).rgb-center;
            float weight=exp(-0.5*dot(distance,distance)-60.0*dot(delta,delta));
            alpha+=weight*texture2D(mask,point).a;total+=weight;
          }
          float a=alpha/max(total,0.00001);
          gl_FragColor=vec4(a,a,a,a);
        }`);
      this.program = gl.createProgram(); gl.attachShader(this.program, vertex); gl.attachShader(this.program, fragment);
      gl.linkProgram(this.program); gl.deleteShader(vertex); gl.deleteShader(fragment);
      if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) throw new Error('Edge shader link failed');
      gl.useProgram(this.program);
      this.buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
      const position = gl.getAttribLocation(this.program, 'position');
      gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
      this.textures = [0,1].map(unit => {
        const texture = gl.createTexture(); gl.activeTexture(gl.TEXTURE0+unit); gl.bindTexture(gl.TEXTURE_2D,texture);
        gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
        return texture;
      });
      gl.uniform1i(gl.getUniformLocation(this.program,'mask'),0);
      gl.uniform1i(gl.getUniformLocation(this.program,'guide'),1);
      this.sizeLocation = gl.getUniformLocation(this.program,'maskSize');
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
    } catch(error) { this.dispose(); throw error; }
  }
  render(mask, image, width, height) {
    const gl=this.gl;
    if(!gl || gl.isContextLost()) throw new Error('Edge context unavailable');
    if(this.canvas.width!==width || this.canvas.height!==height){this.canvas.width=width;this.canvas.height=height;}
    gl.viewport(0,0,width,height);
    for(const [unit, source] of [[0,mask],[1,image]]){
      gl.activeTexture(gl.TEXTURE0+unit); gl.bindTexture(gl.TEXTURE_2D,this.textures[unit]);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,source);
    }
    gl.uniform2f(this.sizeLocation,mask.width,mask.height);
    gl.drawArrays(gl.TRIANGLES,0,6);
    return this.canvas;
  }
  dispose(){
    const gl=this.gl;if(!gl)return;
    for(const texture of this.textures||[])gl.deleteTexture(texture);
    if(this.buffer)gl.deleteBuffer(this.buffer);
    if(this.program)gl.deleteProgram(this.program);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    this.gl=null;this.canvas.width=0;this.canvas.height=0;
  }
}
