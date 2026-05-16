function num(v, d = 0) {
  const x = Number(v);
  return Number.isFinite(x) ? x : d;
}

function clamp01(v) {
  return Math.max(0, Math.min(1, num(v, 0)));
}

export function computeKpi({ Z, D, V, planZ, planD, planV }) {
  const z = num(planZ) > 0 ? clamp01(num(Z) / num(planZ)) : 0;
  const d = num(planD) > 0 ? clamp01(num(D) / num(planD)) : 0;
  const v = num(planV) > 0 ? clamp01(num(V) / num(planV)) : 0;
  const K_kpi_raw = (z + d + v) / 3;
  return { Z_score: z, D_score: d, V_score: v, K_kpi_raw };
}

export function computePayout({ V, K_kpi_raw, isApprentice, isSelfClosed, rateBase, rateBonus, threshold }) {
  const vol = Math.max(0, num(V));
  const kRaw = clamp01(K_kpi_raw);
  const baseRate = Math.max(0, num(rateBase));
  const bonusRate = Math.max(0, num(rateBonus));
  const th = Math.max(0, num(threshold));

  const baseEligible = !!isSelfClosed;
  const bonusEligible = !!isSelfClosed && !isApprentice;
  const belowThreshold = kRaw < th;
  const K_kpi = belowThreshold ? 0 : kRaw;

  const base = baseEligible ? vol * baseRate : 0;
  const bonus = bonusEligible && !belowThreshold ? vol * bonusRate * kRaw : 0;
  const total = base + bonus;
  const monthly = total * 4.33;

  return {
    K_kpi,
    base,
    bonus,
    total,
    monthly,
    eligible: { base: baseEligible, bonus: bonusEligible },
    belowThreshold,
  };
}
