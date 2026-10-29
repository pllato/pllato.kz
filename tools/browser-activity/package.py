#!/usr/bin/env python3
"""Build a private employee ZIP; never print or commit enrollment secrets."""
import argparse,hashlib,json,pathlib,secrets,shutil,time,zipfile

FILES=['manifest.json','model.mjs','background.js','content.js','popup.html','popup.js','style.css']
def build(output,sources):
    source=pathlib.Path(__file__).resolve().parent
    output=output.resolve()
    if output==source or source in output.parents:
        raise ValueError('Choose a private directory outside the source tree')
    output.mkdir(parents=True,exist_ok=True);output.chmod(0o700)
    ext=output/'extension';ext.mkdir(exist_ok=True)
    config=ext/'config.json'
    if config.exists():
        credentials=json.loads(config.read_text())
    else:
        credentials={'enrollmentToken':secrets.token_hex(32),'expiresAt':int(time.time()*1000)+30*86400000}
        config.write_text(json.dumps(credentials));config.chmod(0o600)
    token=credentials['enrollmentToken']
    if len(token)!=64 or any(c not in 'abcdef0123456789' for c in token):raise ValueError('Invalid private configuration')
    if credentials['expiresAt']<time.time()*1000:raise ValueError('Package expired; choose a new output folder')
    digest=hashlib.sha256(token.encode()).hexdigest()
    registry=json.loads(sources.read_text())
    item={'id':'browser-installer-'+digest[:12],'enrollment':True,'transport':'browser','expiresAt':credentials['expiresAt'],'tokenHash':digest}
    registry=[r for r in registry if r['id']!=item['id']]+[item]
    sources.write_text(json.dumps(registry,indent=2,ensure_ascii=False)+'\n')
    for name in FILES:shutil.copy2(source/name,ext/name)
    shutil.copy2(source/'README.md',output/'ИНСТРУКЦИЯ.md')
    (output/'НАЧАТЬ.html').write_text('''<!doctype html><html lang="ru"><meta charset="utf-8"><title>Установка Pllato Activity</title><style>body{font:18px/1.6 system-ui;background:#f8f7f3;color:#17222b;max-width:760px;margin:60px auto;padding:24px}h1{font-size:32px}li{margin:16px 0}code{background:#eee9df;padding:4px 8px;border-radius:6px}</style><h1>Pllato Activity</h1><p>Без паролей. Один раз установите — дальше статистика отправляется автоматически.</p><ol><li>Сохраните распакованную папку в постоянном месте.</li><li>Откройте в Chrome <code>chrome://extensions</code>, в Edge <code>edge://extensions</code> (скопируйте адрес в адресную строку).</li><li>Включите «Режим разработчика», нажмите «Загрузить распакованное расширение» и выберите папку <b>extension</b>.</li><li>Введите имя и фамилию → <b>Подключить учёт</b>.</li><li>Обновите вкладки Claude и Codex.</li></ol><p>Собираются имя и количество новых отправок. Тексты переписок, код и пароли не передаются. Учёт можно поставить на паузу через значок расширения.</p><p>Обновление графика — до 10 минут. Для немедленной отправки нажмите «Обновить сейчас» в расширении.</p></html>''')
    archive=output.with_suffix('.zip')
    with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED) as z:
        for name in FILES+['config.json']:z.write(ext/name,'Pllato-Activity/extension/'+name)
        for name in ['НАЧАТЬ.html','ИНСТРУКЦИЯ.md']:z.write(output/name,'Pllato-Activity/'+name)
    archive.chmod(0o600)
    print('Private package:',archive)
    print('Registry updated with a hash only. Publish it before distribution.')
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--output',type=pathlib.Path,required=True);p.add_argument('--sources',type=pathlib.Path,required=True);a=p.parse_args();build(a.output,a.sources)
