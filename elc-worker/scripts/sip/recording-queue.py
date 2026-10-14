#!/usr/bin/env python3
"""Durable Asterisk recording uploader. Enqueue is local; timer performs HTTP."""
import fcntl
import json
import os
from pathlib import Path
import re
import sys
import urllib.request

ROOT = Path('/var/spool/asterisk/monitor')


def enqueue(args):
    file, phone, direction, started, duration, call_key, endpoint = args
    path = Path(file)
    if path.parent != ROOT or not re.fullmatch(r'[\w.-]+\.wav', path.name):
        raise ValueError('invalid recording path')
    if not re.fullmatch(r'\d{7,15}', phone) or direction not in ('in', 'out'):
        raise ValueError('invalid recording identity')
    if not re.fullmatch(r'[\w.-]+', call_key) or not started.isdigit() or not duration.isdigit():
        raise ValueError('invalid call metadata')
    if not endpoint.startswith('https://pllato-elc-worker.uurraa.workers.dev/api/sip/recording?'):
        raise ValueError('invalid endpoint')
    if not path.exists() or path.stat().st_size <= 44:
        return
    job = dict(file=str(path), phone=phone, direction=direction, started=started,
               duration=duration, callKey=call_key, endpoint=endpoint)
    target = path.with_suffix('.upload.json')
    temp = target.with_suffix('.tmp')
    os.umask(0o077)
    temp.write_text(json.dumps(job))
    os.replace(temp, target)


def flush():
    from urllib.parse import urlencode
    with (ROOT / '.upload.lock').open('w') as lock:
        try:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            return
        for job_path in sorted(ROOT.glob('*.upload.json')):
            try:
                job = json.loads(job_path.read_text())
                path = Path(job['file'])
                if path.parent != ROOT or path.is_symlink():
                    raise ValueError('invalid file')
                query = urlencode({k: job[k] for k in ('phone', 'direction', 'started', 'duration', 'callKey')})
                request = urllib.request.Request(job['endpoint'] + '&' + query,
                    data=path.read_bytes(), headers={'Content-Type': 'audio/wav'}, method='POST')
                with urllib.request.urlopen(request, timeout=45) as response:
                    result = json.load(response)
                if result.get('ok') is not True:
                    raise ValueError('upload not confirmed')
                # Delete audio only after CRM confirms the object AND call-log record.
                job_path.unlink()
                path.unlink(missing_ok=True)
            except Exception as error:
                # Do not log signed URL, phone, or audio. Keep both files for retry.
                print('Recording upload deferred: ' + type(error).__name__, file=sys.stderr)


if __name__ == '__main__':
    if sys.argv[1:] == ['--flush']:
        flush()
    else:
        enqueue(sys.argv[1:])
