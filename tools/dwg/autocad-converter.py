#!/usr/bin/env python3
"""Local-only Autodesk Core Console conversion; no cloud transfer, originals untouched."""
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import json, os, subprocess, tempfile, threading
CORE = Path('/Applications/Autodesk/AutoCAD 2027/AutoCAD 2027.app/Contents/Helpers/AcCoreConsole.app/Contents/MacOS/AcCoreConsole')
ALLOWED = {'https://pllato.kz', 'https://www.pllato.kz', 'http://127.0.0.1:8817'}
LOCK = threading.Lock()
LIMIT = 128 * 1024 * 1024
class Handler(BaseHTTPRequestHandler):
    def log_message(self, *args): pass  # No private filenames or contents in service logs.
    def allowed(self):
        return self.headers.get('Host') == '127.0.0.1:8818' and self.headers.get('Origin') in ALLOWED
    def reply(self, status, payload, mime='application/json'):
        self.send_response(status)
        if self.allowed():
            self.send_header('Access-Control-Allow-Origin', self.headers['Origin'])
            self.send_header('Vary', 'Origin')
            self.send_header('Access-Control-Allow-Private-Network', 'true')
        self.send_header('Cache-Control', 'no-store')
        self.send_header('Content-Type', mime)
        self.send_header('Content-Length', str(len(payload)))
        self.end_headers(); self.wfile.write(payload)
    def do_OPTIONS(self):
        if not self.allowed(): return self.reply(403, b'{}')
        self.send_response(204)
        self.send_header('Access-Control-Allow-Origin', self.headers['Origin'])
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Access-Control-Allow-Private-Network', 'true')
        self.end_headers()
    def do_GET(self):
        if not self.allowed() or self.path != '/status': return self.reply(403, b'{}')
        self.reply(200, json.dumps({'available':CORE.is_file(), 'format':'AC1032'}).encode())
    def do_POST(self):
        if not self.allowed() or self.path != '/convert' or self.headers.get('Content-Type') != 'application/acad': return self.reply(403, b'{}')
        try: size = int(self.headers.get('Content-Length', '0'))
        except ValueError: return self.reply(400, b'{}')
        if size < 6 or size > LIMIT: return self.reply(413, b'{}')
        if not CORE.is_file(): return self.reply(503, b'{"error":"AutoCAD converter unavailable"}')
        if not LOCK.acquire(blocking=False): return self.reply(409, b'{"error":"AutoCAD converter busy"}')
        try:
            self.connection.settimeout(30)
            data=self.rfile.read(size)
            if len(data)!=size or data[:6]!=b'AC1021': return self.reply(400, b'{"error":"Expected DWG2007"}')
            with tempfile.TemporaryDirectory(prefix='pllato-cad-') as folder:
                root=Path(folder); source=root/'source.dwg'; output=root/'converted.dwg'
                source.write_bytes(data)
                script=root/'convert.scr'
                script.write_text('_AUDIT\n_No\n_SAVEAS\n2018\n'+str(output)+'\n_QUIT\n',encoding='utf-8')
                result=subprocess.run([str(CORE),'/i',str(source),'/s',str(script),'/l','en-US'],stdout=subprocess.PIPE,stderr=subprocess.STDOUT,timeout=300)
                log=result.stdout.decode('utf-8',errors='replace')
                if result.returncode or not output.is_file() or 'Total errors found 0 fixed 0' not in log:
                    return self.reply(422, b'{"error":"AutoCAD conversion or AUDIT failed; original unchanged"}')
                converted=output.read_bytes()
                if converted[:6]!=b'AC1032' or len(converted)>LIMIT: return self.reply(422,b'{}')
                self.reply(200,converted,'application/acad')
        except subprocess.TimeoutExpired: self.reply(504,b'{"error":"AutoCAD conversion timed out; original unchanged"}')
        except (OSError,ValueError): self.reply(500,b'{"error":"Local conversion failed; original unchanged"}')
        finally: LOCK.release()
if __name__=='__main__': ThreadingHTTPServer(('127.0.0.1',8818),Handler).serve_forever()
