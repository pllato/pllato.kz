function toNum(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function clamp01(value) {
  return Math.max(0, Math.min(1, toNum(value, 0)));
}

/**
 * @param {{Z:number,D:number,V:number,planZ:number,planD:number,planV:number}} args
 * @returns {{Z_score:number,D_score:number,V_score:number,K_kpi_raw:number}}
 */
export function computeKpi(args) {
  const Z = toNum(args?.Z, 0);
  const D = toNum(args?.D, 0);
  const V = toNum(args?.V, 0);
  const planZ = toNum(args?.planZ, 0);
  const planD = toNum(args?.planD, 0);
  const planV = toNum(args?.planV, 0);

  const Z_score = planZ > 0 ? clamp01(Z / planZ) : 0;
  const D_score = planD > 0 ? clamp01(D / planD) : 0;
  const V_score = planV > 0 ? clamp01(V / planV) : 0;
  const K_kpi_raw = (Z_score + D_score + V_score) / 3;

  return { Z_score, D_score, V_score, K_kpi_raw };
}

/**
 * @param {{
 * V:number,
 * K_kpi_raw:number,
 * isApprentice:boolean,
 * isSelfClosed:boolean,
 * rateBase:number,      // %
 * rateBonus:number,     // %
 * threshold:number,     // %
 * salary:number
 * }} args
 * @returns {{
 * K_kpi_eff:number,
 * base:number,
 * bonus:number,
 * total:number,
 * baseEligible:boolean,
 * bonusEligible:boolean,
 * belowThreshold:boolean
 * }}
 */
export function computePayout(args) {
  const V = Math.max(0, toNum(args?.V, 0));
  const K_kpi_raw = clamp01(args?.K_kpi_raw);
  const isApprentice = !!args?.isApprentice;
  const isSelfClosed = !!args?.isSelfClosed;
  const rateBase = Math.max(0, toNum(args?.rateBase, 0)) / 100;
  const rateBonus = Math.max(0, toNum(args?.rateBonus, 0)) / 100;
  const threshold = Math.max(0, toNum(args?.threshold, 0)) / 100;
  const salary = Math.max(0, toNum(args?.salary, 0));

  const baseEligible = isSelfClosed;
  const bonusEligible = isSelfClosed && !isApprentice;
  const belowThreshold = K_kpi_raw < threshold;
  const K_kpi_eff = belowThreshold ? 0 : K_kpi_raw;

  const base = baseEligible ? V * rateBase : 0;
  const bonus = bonusEligible && !belowThreshold ? V * rateBonus * K_kpi_raw : 0;
  const total = salary + base + bonus;

  return { K_kpi_eff, base, bonus, total, baseEligible, bonusEligible, belowThreshold };
}
