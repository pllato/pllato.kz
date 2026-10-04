// Общие функции для скриптов sales-kit: путь к репозиторию, Chromium, Playwright,
// адрес локального сервера и временный ключ к гейту (/app/gate.js).
// Ключ не хранится в репозитории — он вычисляется тем же алгоритмом, что и в gate.js.
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..', '..');
const PORT = process.env.PORT || 8199;
const BASE = `http://127.0.0.1:${PORT}/`;

function playwright() {
  const tries = ['playwright', '/opt/node22/lib/node_modules/playwright'];
  try { tries.push(path.join(execSync('npm root -g').toString().trim(), 'playwright')); } catch (e) {}
  for (const t of tries) { try { return require(t); } catch (e) {} }
  throw new Error('Playwright не найден. Он предустановлен глобально (npm root -g) — проверь путь.');
}

function chromiumPath() {
  if (process.env.CHROME) return process.env.CHROME;
  const base = '/opt/pw-browsers';
  if (fs.existsSync(base)) {
    for (const d of fs.readdirSync(base).filter(d => /^chromium-\d+$/.test(d)).sort().reverse()) {
      const p = path.join(base, d, 'chrome-linux', 'chrome');
      if (fs.existsSync(p)) return p;
    }
  }
  return undefined; // Playwright попробует свой браузер
}

async function launch(opts = {}) {
  return playwright().chromium.launch({ executablePath: chromiumPath(), ...opts });
}

// Временный ключ гейта на N дней — тот же формат, что выдаёт app/linkgen.html.
function gateToken(days = 1) {
  const g = fs.readFileSync(path.join(ROOT, 'app', 'gate.js'), 'utf8');
  const secret = (g.match(/SECRET='([^']+)'/) || [])[1];
  if (!secret) throw new Error('В app/gate.js не найден SECRET — алгоритм гейта изменился.');
  const h = s => { let x = 7; for (let i = 0; i < s.length; i++) x = ((x * 31) + s.charCodeAt(i)) >>> 0; return x.toString(36); };
  const exp = String(Date.now() + days * 864e5);
  return Buffer.from(exp + '.' + h(exp + secret)).toString('base64');
}

// url('app/x.html') → http://127.0.0.1:8199/app/x.html?k=…
function url(rel, extra = '') {
  rel = rel.replace(/^\/+/, '');
  return BASE + rel + (rel.includes('?') ? '&' : '?') + 'k=' + gateToken() + extra;
}

// Имя демо → относительный путь: 'kvarta-sanzhar' → 'app/kvarta-sanzhar.html'
function demoPath(name) {
  if (name.startsWith('app/')) return name;
  return 'app/' + (name.endsWith('.html') ? name : name + '.html');
}

module.exports = { ROOT, PORT, BASE, playwright, chromiumPath, launch, gateToken, url, demoPath };
