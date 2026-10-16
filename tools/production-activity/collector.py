#!/usr/bin/env python3
"""Counts human requests locally. Only hourly counts leave this computer."""
import argparse,collections,datetime,hashlib,json,os,pathlib,sqlite3,time,urllib.request,fcntl
HOUR=3600000

def timestamp(value):
    try:
        if isinstance(value,(int,float)):return int(value*(1000 if value<1e12 else 1))
        return int(datetime.datetime.fromisoformat(value.replace('Z','+00:00')).timestamp()*1000)
    except (ValueError,TypeError,AttributeError):return 0

def event(row,source,session):
    if source=='codex':
        p=row.get('payload',{})
        if row.get('type')!='response_item' or p.get('type')!='message' or p.get('role')!='user':return None
        meta=p.get('internal_chat_message_metadata_passthrough') or {}
        kinds=meta.get('content_item_kinds',[])
        if kinds and not any(k.startswith('user.') for k in kinds):return None
        blocks=p.get('content',[])
        text='\n'.join(b.get('text','') for b in blocks if isinstance(b,dict))
        if not kinds and text.lstrip().startswith(('<environment_context>','<realtime_delegation>','<send_user_message_question_reply>','<subagent_notification>')):return None
        at=timestamp(meta.get('create_time')) or timestamp(row.get('timestamp'))
        key=p.get('id') or (str(at)+text)
    else:
        if row.get('type')!='user' or row.get('isSidechain') or row.get('isMeta') or row.get('isCompactSummary'):return None
        if row.get('origin',{}).get('kind','human')!='human' or row.get('promptSource')=='system':return None
        content=row.get('message',{}).get('content')
        if isinstance(content,list):
            if any(b.get('type')=='tool_result' for b in content if isinstance(b,dict)):return None
            text='\n'.join(b.get('text','') for b in content if isinstance(b,dict))
        elif isinstance(content,str):text=content
        else:return None
        if text.lstrip().startswith(('<task-notification>','<local-command-stdout>','<command-name>')):return None
        at=timestamp(row.get('timestamp'));key=row.get('uuid') or (session+str(at)+text)
    if not at:return None
    return hashlib.sha256((source+str(key)).encode()).hexdigest(),at

def collect(source,home,state,now=None):
    now=now or int(time.time()*1000);cutoff=now-180*24*HOUR
    roots=[home/'.codex/sessions',home/'.codex/archived_sessions'] if source=='codex' else [home/'.claude/projects']
    files=[p for root in roots if root.exists() for p in root.rglob('*.jsonl') if 'subagents' not in p.parts]
    if not files:return {'available':False,'observedAt':now}
    db=sqlite3.connect(state);db.executescript('CREATE TABLE IF NOT EXISTS files(path TEXT PRIMARY KEY,size INTEGER,mtime INTEGER);CREATE TABLE IF NOT EXISTS events(id TEXT PRIMARY KEY,at INTEGER);')
    for p in files:
        st=p.stat();old=db.execute('SELECT size,mtime FROM files WHERE path=?',(str(p),)).fetchone()
        if old==(st.st_size,st.st_mtime_ns):continue
        # Re-read changed files: global IDs deduplicate imports, forks and repeated syncs.
        with p.open(errors='replace') as f:
            for line in f:
                try:r=json.loads(line)
                except (ValueError,TypeError):continue
                if source=='codex' and r.get('type')=='session_meta':
                    meta=r.get('payload',{})
                    if meta.get('parent_thread_id') or isinstance(meta.get('source'),dict) and 'subagent' in meta['source']:break
                e=event(r,source,p.stem)
                if e and cutoff<=e[1]<=now:db.execute('INSERT OR IGNORE INTO events VALUES(?,?)',e)
        db.execute('INSERT OR REPLACE INTO files VALUES(?,?,?)',(str(p),st.st_size,st.st_mtime_ns))
    db.execute('DELETE FROM events WHERE at<?',(cutoff,));db.commit()
    first=db.execute('SELECT MIN(at) FROM events').fetchone()[0]
    buckets=[{'at':h*HOUR,'count':n} for h,n in db.execute('SELECT CAST(at/? AS INTEGER),COUNT(*) FROM events GROUP BY 1 ORDER BY 1',(HOUR,))]
    db.close()
    return {'available':bool(first),'observedAt':now,**({'coverageStart':max(cutoff,first),'buckets':buckets} if first else {})}

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--config',required=True);parser.add_argument('--dry-run',action='store_true');args=parser.parse_args()
    path=pathlib.Path(args.config).expanduser();cfg=json.loads(path.read_text())
    if cfg['source'] not in ('codex','claude'):raise ValueError('Unknown source')
    with open(path.with_suffix('.lock'),'w') as lock:
        try:fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
        except BlockingIOError:return
        body=collect(cfg['source'],pathlib.Path.home(),path.with_suffix('.sqlite'))
        if args.dry_run:
            print(json.dumps({'source':cfg['source'],'available':body['available'],'hours':len(body.get('buckets',[])),'requests':sum(b['count'] for b in body.get('buckets',[])),'coverageStart':body.get('coverageStart')},ensure_ascii=False));return
        # Fixed service allowlist; a modified config cannot send credentials elsewhere.
        endpoint=cfg['endpoint']
        if endpoint!='https://pllato-comm.uurraa.workers.dev/production-activity/ingest':raise ValueError('Unexpected endpoint')
        req=urllib.request.Request(endpoint,json.dumps(body).encode(),headers={'User-Agent':'PllatoActivity/1.0 (macOS)','Content-Type':'application/json','Authorization':'Bearer '+cfg['token'],'X-Activity-Device':cfg['device']},method='POST')
        with urllib.request.urlopen(req,timeout=30) as response:result=json.load(response)
        if not result.get('ok'):raise RuntimeError('Sync failed')
        print(datetime.datetime.now().isoformat(timespec='seconds'),cfg['source'],'sync OK',sum(b['count'] for b in body.get('buckets',[])))
if __name__=='__main__':main()
