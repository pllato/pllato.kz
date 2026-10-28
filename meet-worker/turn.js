// Master TURN key stays in Worker secrets. Only admitted room participants
// receive short-lived relay credentials over their existing WebSocket.
export async function issueTurnCredentials(env, request = fetch) {
  if (!env.TURN_KEY_ID || !env.TURN_KEY_TOKEN) return {available:false};
  const response = await request(`https://rtc.live.cloudflare.com/v1/turn/keys/${encodeURIComponent(env.TURN_KEY_ID)}/credentials/generate-ice-servers`, {
    method:'POST', headers:{Authorization:`Bearer ${env.TURN_KEY_TOKEN}`,'Content-Type':'application/json'},
    body:JSON.stringify({ttl:21600}), signal:AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(`TURN credentials HTTP ${response.status}`);
  const data = await response.json();
  const iceServers = (data.iceServers || []).filter(server => server && (typeof server.urls === 'string' || Array.isArray(server.urls)));
  if (!iceServers.some(server => [server.urls].flat().some(url=>/^turns?:/.test(url)))) throw new Error('TURN relay missing');
  return {available:true,iceServers};
}
