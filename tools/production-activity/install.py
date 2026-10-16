#!/usr/bin/env python3
"""Register a persistent per-computer identity. Enrollment key stays in the ZIP."""
import hashlib,json,os,pathlib,plistlib,secrets,shutil,subprocess,sys,urllib.request,uuid
BASE='https://pllato-comm.uurraa.workers.dev/production-activity'

def prepare(root,kind,name):
    root.mkdir(parents=True,exist_ok=True);root.chmod(0o700)
    identity=root/'machine.json'
    if identity.exists():machine=json.loads(identity.read_text())
    else:
        machine={'id':str(uuid.uuid4()),'name':name};identity.write_text(json.dumps(machine));identity.chmod(0o600)
    config=root/(kind+'-config.json')
    if config.exists():
        cfg=json.loads(config.read_text())
        if cfg.get('endpoint')!=BASE+'/ingest' or cfg.get('source')!=kind:raise ValueError('Unexpected installed configuration')
        return cfg,config
    cfg={'version':2,'source':kind,'machineId':machine['id'],'name':machine['name'],'device':'device_'+machine['id']+'_'+kind,'token':secrets.token_hex(32),'endpoint':BASE+'/ingest'}
    # Persist before networking: retries reuse the same identity and key.
    config.write_text(json.dumps(cfg));config.chmod(0o600)
    return cfg,config

def register(cfg,enrollment):
    if cfg.get('version')!=2:return # Keep an already connected legacy installation and its history.
    body={'id':cfg['device'],'source':cfg['source'],'machineId':cfg['machineId'],'name':cfg['name'],'tokenHash':hashlib.sha256(cfg['token'].encode()).hexdigest()}
    req=urllib.request.Request(BASE+'/register',json.dumps(body).encode(),headers={'User-Agent':'PllatoActivity/2.0 (macOS)','Content-Type':'application/json','Authorization':'Bearer '+enrollment},method='POST')
    with urllib.request.urlopen(req,timeout=30) as r:
        if not json.load(r).get('ok'):raise RuntimeError('Registration failed')

def main():
    source=pathlib.Path(__file__).resolve().parent
    bundle=json.loads((source/'config.json').read_text())
    root=pathlib.Path.home()/'Library/Application Support/Pllato Activity'
    identity=root/'machine.json'
    if identity.exists():name=json.loads(identity.read_text())['name'];print('Компьютер: '+name)
    else:name=input('Название компьютера (например, Mac Ернара): ').strip() or 'Mac '+uuid.uuid4().hex[:6]
    if len(name)>80 or any(ord(c)<32 for c in name):raise ValueError('Название: от 1 до 80 символов')
    selection=input('Что учитывать: 1 — Codex и Claude, 2 — только Claude, 3 — только Codex [1]: ').strip() or '1'
    kinds={'1':('codex','claude'),'2':('claude',),'3':('codex',)}.get(selection)
    if not kinds:raise ValueError('Выберите 1, 2 или 3')
    for kind in kinds:
        cfg,config=prepare(root,kind,name);register(cfg,bundle['enrollmentToken'])
        script=root/'collector.py';shutil.copy2(source/'collector.py',script)
        label='kz.pllato.activity.'+kind;folder=pathlib.Path.home()/'Library/LaunchAgents';folder.mkdir(exist_ok=True)
        plist=folder/(label+'.plist');plist.write_bytes(plistlib.dumps({'Label':label,'ProgramArguments':[sys.executable,str(script),'--config',str(config)],'RunAtLoad':True,'StartInterval':600,'StandardOutPath':str(root/(kind+'.log')),'StandardErrorPath':str(root/(kind+'-error.log'))}))
        subprocess.run(['launchctl','bootout','gui/'+str(os.getuid()),str(plist)],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
        subprocess.run(['launchctl','bootstrap','gui/'+str(os.getuid()),str(plist)],check=True)
        print(kind+': подключён, обновление каждые 10 минут.')
    print('Передаются только почасовые счётчики. Тексты остаются на компьютере. Нет местной истории — нет данных.')
if __name__=='__main__':main()
