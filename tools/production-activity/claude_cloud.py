"""Opt-in read-only Claude cloud import. Only event hashes/times are persisted."""
import json, subprocess, time, urllib.request, urllib.parse, sqlite3, getpass

API = 'https://api.anthropic.com'
SERVICE = 'Claude Code-credentials'


def credentials():
    result = subprocess.run(['security', 'find-generic-password', '-s', SERVICE, '-w'], capture_output=True, text=True, timeout=15)
    if result.returncode:
        raise RuntimeError('Claude login unavailable; run claude auth login')
    return json.loads(result.stdout)


def access_token():
    saved = credentials()
    oauth = saved['claudeAiOauth']
    if oauth.get('expiresAt', 0) > time.time()*1000 + 300000:
        return oauth['accessToken']
    if not oauth.get('refreshToken'):
        raise RuntimeError('Claude login expired; run claude auth login')
    body = {'grant_type': 'refresh_token', 'refresh_token': oauth['refreshToken'],
            'client_id': '9d1c250a-e61b-44d9-88ed-5944d1962f5e'}
    request = urllib.request.Request('https://platform.claude.com/v1/oauth/token', json.dumps(body).encode(), headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(request, timeout=30) as response:
        fresh = json.load(response)
    current = credentials()
    if current['claudeAiOauth']['accessToken'] != oauth['accessToken']:
        return current['claudeAiOauth']['accessToken']
    current['claudeAiOauth'].update(accessToken=fresh['access_token'], refreshToken=fresh.get('refresh_token', oauth['refreshToken']), expiresAt=int(time.time()*1000)+fresh['expires_in']*1000)
    # Pass secrets through stdin, never process arguments or logs.
    quote = lambda s: '"'+s.replace('\\', '\\\\').replace('"', '\\"')+'"'
    command = 'add-generic-password -U -s '+quote(SERVICE)+' -a '+quote(getpass.getuser())+' -w '+quote(json.dumps(current))+'\n'
    result = subprocess.run(['security', '-i'], input=command, capture_output=True, text=True, timeout=15)
    if result.returncode or credentials()['claudeAiOauth']['accessToken'] != fresh['access_token']:
        raise RuntimeError('Could not persist refreshed Claude login')
    return fresh['access_token']


class Client:
    def __init__(self):
        self.token = access_token()

    def get(self, path):
        if not path.startswith('/v1/code/sessions'):
            raise ValueError('Unexpected cloud endpoint')
        request = urllib.request.Request(API+path, headers={'Authorization': 'Bearer '+self.token, 'anthropic-version': '2023-06-01', 'anthropic-client-platform': 'cli'})
        with urllib.request.urlopen(request, timeout=30) as response:
            return json.load(response)


def pages(get, path, cursor_key):
    seen = set()
    for _ in range(100):
        response = get(path)
        rows = response.get('data')
        if not isinstance(rows, list):
            raise RuntimeError('Unexpected Claude cloud response')
        yield rows
        # Session-list resume_token is a change-stream token, not a page cursor.
        cursor = response.get('next_cursor')
        if not cursor:
            return
        if cursor in seen:
            raise RuntimeError('Repeated Claude cloud cursor')
        seen.add(cursor)
        path = path.split('?')[0]+'?'+urllib.parse.urlencode({'limit': 1000 if '/teleport-events' in path else 100, cursor_key: cursor})
    raise RuntimeError('Claude cloud pagination incomplete')


def sync(state, since, now, parse_event, parse_timestamp, get=None):
    get = get or Client().get
    db = sqlite3.connect(state)
    db.executescript('CREATE TABLE IF NOT EXISTS events(id TEXT PRIMARY KEY,at INTEGER);CREATE TABLE IF NOT EXISTS cloud_sessions(id TEXT PRIMARY KEY,version TEXT);')
    imported = 0
    try:
        for sessions in pages(get, '/v1/code/sessions?limit=100', 'cursor'):
            for session in sessions:
                if session.get('environment_kind') != 'anthropic_cloud':
                    continue
                version = session.get('last_event_at') or session.get('updated_at')
                if parse_timestamp(version) < since:
                    continue
                sid = session['id']
                old = db.execute('SELECT version FROM cloud_sessions WHERE id=?', (sid,)).fetchone()
                if old == (version,):
                    continue
                path = '/v1/code/sessions/'+urllib.parse.quote(sid, safe='')+'/teleport-events?limit=1000'
                for rows in pages(get, path, 'cursor'):
                    for row in rows:
                        if row.get('is_compaction') or row.get('event_type') != 'user':
                            continue
                        payload = row.get('payload')
                        if not isinstance(payload, dict):
                            continue
                        event = parse_event(payload, 'claude', sid)
                        if event and since <= event[1] <= now:
                            imported += db.execute('INSERT OR IGNORE INTO events VALUES(?,?)', event).rowcount
                db.execute('INSERT OR REPLACE INTO cloud_sessions VALUES(?,?)', (sid, version))
                db.commit()
    finally:
        db.close()
    return imported
