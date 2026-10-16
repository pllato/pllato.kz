#!/bin/bash
set -eu
cd "$(dirname "$0")"
PYTHON=$(command -v python3 || true)
if [ -z "$PYTHON" ]; then
  echo 'Нужен Python 3. Установите его с https://www.python.org/downloads/macos/ и запустите установку ещё раз.'
  read -r -p 'Нажмите Enter для закрытия'; exit 1
fi
"$PYTHON" - <<'PY'
import json,pathlib,plistlib,shutil,subprocess,os,sys
source=pathlib.Path.cwd();cfg=json.loads((source/'config.json').read_text());kind=cfg['source']
assert kind in ('codex','claude')
root=pathlib.Path.home()/'Library/Application Support/Pllato Activity';root.mkdir(parents=True,exist_ok=True);root.chmod(0o700)
script=root/'collector.py';shutil.copy2(source/'collector.py',script)
config=root/(kind+'-config.json');shutil.copy2(source/'config.json',config);config.chmod(0o600)
label='kz.pllato.activity.'+kind
folder=pathlib.Path.home()/'Library/LaunchAgents';folder.mkdir(exist_ok=True)
plist=folder/(label+'.plist');plist.write_bytes(plistlib.dumps({'Label':label,'ProgramArguments':[sys.executable,str(script),'--config',str(config)],'RunAtLoad':True,'StartInterval':600,'StandardOutPath':str(root/(kind+'.log')),'StandardErrorPath':str(root/(kind+'-error.log'))}))
subprocess.run(['launchctl','bootout','gui/'+str(os.getuid()),str(plist)],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
subprocess.run(['launchctl','bootstrap','gui/'+str(os.getuid()),str(plist)],check=True)
print('Готово. '+kind+' будет передавать счётчики в Pllato каждые 10 минут.')
print('Передаются только количество обращений по часам и время синхронизации. Текст сообщений остаётся на компьютере.')
PY
read -r -p 'Нажмите Enter для закрытия'
