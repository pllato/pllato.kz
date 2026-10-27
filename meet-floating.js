// Adopt the existing grid: no extra decoder, MediaStream, or canvas loop.
export class FloatingParticipants {
  constructor(grid, onChange = () => {}, screenArea = null) {
    this.screenArea = screenArea;
    this.grid = grid;
    this.onChange = onChange;
    this.window = null;
    this.pending = false;
    this.generation = 0;
  }
  get active() { return !!this.window; }
  async toggle() {
    if (this.active || this.pending) { this.close(); return; }
    if (!window.documentPictureInPicture?.requestWindow) return false;
    this.pending = true;
    const generation = ++this.generation;
    let pip;
    try {
      pip = await window.documentPictureInPicture.requestWindow({width:640, height:480});
      if (generation !== this.generation) { pip.close(); return; }
      const doc = pip.document;
      doc.title = 'Pllato — встреча';
      document.querySelectorAll('style').forEach(source => {
        const style = doc.createElement('style'); style.textContent = source.textContent;
        doc.head.appendChild(style);
      });
      const style = doc.createElement('style');
      style.textContent = `html,body{margin:0;width:100%;height:100%;overflow:hidden}
        body{display:flex;flex-direction:column;background:#0d1322;color:#fff}
        .pip-header{display:flex;align-items:center;justify-content:space-between;padding:8px;gap:8px;font:13px system-ui}
        .pip-header button{background:#253047;color:white;border:0;border-radius:6px;padding:6px;cursor:pointer}
        #video-grid{display:grid;position:static;transform:none;flex:1;min-height:0;padding:0 6px 6px;gap:6px;overflow:auto}
        #video-grid .tile{min-height:80px;border-radius:8px}
        #video-grid .tile-name{font-size:12px}
        #screen-area{display:none;min-height:0;min-width:0;gap:6px;padding:0 6px}
        body.pip-presenting #screen-area{display:grid;flex:1}
        #screen-area .tile{min-height:0;min-width:0}
        #screen-area video,#video-grid video{object-fit:contain;width:100%;height:100%}
        body.pip-presenting #video-grid{display:flex;flex:0 0 112px;overflow-x:auto;overflow-y:hidden;padding-top:6px}
        body.pip-presenting #video-grid .tile{flex:0 0 170px;min-height:0}
        body.pip-presenting #video-grid .tile-name{font-size:10px;padding:2px 5px}
        body.pip-presenting #video-grid .host-tag{font-size:8px}`;
      doc.head.appendChild(style);
      const header = doc.createElement('div'); header.className = 'pip-header';
      const title = doc.createElement('span'); title.textContent = 'Встреча · экран и собеседники';
      const back = doc.createElement('button'); back.textContent = 'Вернуть во встречу';
      back.onclick = () => this.close(); header.append(title, back);
      this.marker = document.createComment('participants return here');
      this.grid.before(this.marker);
      this.window = pip;
      pip.addEventListener('pagehide', () => { if (this.window === pip) this.close(); }, {once:true});
      doc.body.append(header);
      if(this.screenArea){
        this.screenMarker=document.createComment('screen returns here');
        this.screenArea.before(this.screenMarker);
        doc.body.append(this.screenArea);
      }
      doc.body.append(this.grid);
      this.onChange();
      return true;
    } catch (error) {
      if (this.window === pip) this.close();
      else pip?.close();
      throw error;
    } finally { if (generation === this.generation) this.pending = false; }
  }
  close() {
    ++this.generation; this.pending = false;
    const pip = this.window; this.window = null;
    if (this.marker) { this.marker.replaceWith(this.grid); this.marker = null; }
    if(this.screenMarker){this.screenMarker.replaceWith(this.screenArea);this.screenMarker=null;}
    if (pip && !pip.closed) pip.close();
    this.onChange();
  }
}
