// Демо подтверждается только фактическим входом в «Показ Демо», не соседними этапами.
export function resolvePllatoDemoStages(stages) {
  const entries=Object.entries(stages||{}).filter(([,stage])=>String(stage?.name||'').trim().toLowerCase()==='показ демо');
  return entries.length ? {stageIds:entries.map(([id])=>id),stageNames:entries.map(([,stage])=>stage.name)} : null;
}
export async function fetchDemoChartSeries(points, period) {
  const count=Math.max(4,Math.min(Number(points)||8,16));
  const scale=['day','week','month'].includes(period)?period:'week';
  const response=await fetch(`https://pllato-elc-worker.uurraa.workers.dev/api/public/pllato-demos?points=${count}&period=${scale}`,{signal:AbortSignal.timeout(10000)});
  if(!response.ok)throw new Error(`Demo chart: ${response.status}`);
  const payload=await response.json();
  if(!Array.isArray(payload.series))throw new Error('Demo chart: missing series');
  return payload.series;
}
