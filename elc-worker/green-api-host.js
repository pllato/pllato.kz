// Universal host documented by GREEN-API; retain dedicated instance hosts.
export function greenApiHost(value) {
  const base=String(value||'https://api.greenapi.com').trim().replace(/\/+$/,'');
  return base==='https://api.green-api.com' ? 'https://api.greenapi.com' : base;
}
