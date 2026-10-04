"""Локальный сервер для проверки страниц: корень репозитория, порт 8199, без кэша.

Запуск (фоном):
    cd <repo> && (nohup python3 tools/sales-kit/scripts/serve.py >/tmp/serve.log 2>&1 &)
Проверка:  curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8199/app.html
Сервер иногда падает между шагами — при ERR_CONNECTION_REFUSED просто запусти снова.
"""
import http.server, socketserver, os, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..'))
PORT = int(os.environ.get('PORT', sys.argv[1] if len(sys.argv) > 1 else 8199))
os.chdir(ROOT)


class H(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()


socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(('127.0.0.1', PORT), H) as s:
    s.serve_forever()
