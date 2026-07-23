/* Pllato HR-Ассесмент — ядро: нормы, скоринг, кодирование результата.
   Код результата хранит ТОЛЬКО сырые ответы. Вся интерпретация — здесь и в панели,
   поэтому нормы/веса можно менять, не ломая ранее выданные коды.
   Все тяжёлые расчёты идут на стороне работодателя (панель), кандидату баллы не показываются. */
(function () {
  const HR = {};

  /* ---------- Статистика ---------- */
  // Нормальная CDF Φ(z) (аппроксимация Абрамовица–Стигана 7.1.26)
  HR.normCdf = function (z) {
    const t = 1 / (1 + 0.2316419 * Math.abs(z));
    const d = 0.3989423 * Math.exp(-z * z / 2);
    let p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return z > 0 ? 1 - p : p;
  };
  HR.pct = function (z) { return Math.round(HR.normCdf(z) * 100); }; // перцентиль 0..100
  HR.clamp = function (x, a, b) { return Math.max(a, Math.min(b, x)); };

  /* ---------- Референсные нормы личности (предварительные, международная выборка IPIP) ----------
     Метрика: среднее по пункту на шкале 1..5. m — среднее, sd — станд. отклонение, a — надёжность (α). */
  HR.NORMS = {
    C:  { m: 3.55, sd: 0.60, a: 0.85 }, ES: { m: 3.25, sd: 0.72, a: 0.82 },
    H:  { m: 3.65, sd: 0.62, a: 0.78 }, E:  { m: 3.35, sd: 0.70, a: 0.84 },
    A:  { m: 3.80, sd: 0.55, a: 0.80 }, O:  { m: 3.60, sd: 0.58, a: 0.78 },
    C1: { m: 3.60, sd: 0.66, a: 0.72 }, C2: { m: 3.45, sd: 0.72, a: 0.70 },
    C3: { m: 3.40, sd: 0.72, a: 0.74 }, C4: { m: 3.70, sd: 0.64, a: 0.72 },
    ES1:{ m: 3.30, sd: 0.76, a: 0.76 }, ES2:{ m: 3.25, sd: 0.78, a: 0.74 },
    Hf: { m: 3.75, sd: 0.66, a: 0.75 }, Hs: { m: 3.55, sd: 0.72, a: 0.65 }, Hm: { m: 3.50, sd: 0.74, a: 0.62 },
  };

  /* ---------- Личность ----------
     answers: {itemId: 1..5}. Возвращает домены/фасетки в percentile + z + oca(-100..100) + флаги достоверности. */
  HR.scorePersonality = function (answers) {
    const P = window.HR_PERSONALITY;
    const acc = {}; // factor/facet -> {sum, n}
    const add = (k, v) => { if (!k) return; (acc[k] = acc[k] || { sum: 0, n: 0 }); acc[k].sum += v; acc[k].n++; };
    let sdSum = 0, sdN = 0;              // соц. желательность
    let attFail = 0, attTotal = 0;       // проверки внимания
    let infFail = 0;                     // «невозможный» пункт
    const consVals = {};                 // пара на согласованность
    const seq = [];                      // для longstring

    P.items.forEach(it => {
      const a = answers[it.id];
      if (a == null) return;
      const val = it.key === 1 ? a : (6 - a); // реверс
      if (it.block === 'main') {
        add(it.factor, val);
        if (it.facet) add(it.facet, val);
        seq.push(a);
      } else if (it.factor === 'SD') { sdSum += a; sdN++; }
      else if (it.factor === 'ATT') { attTotal++; if (a !== it.attn_answer) attFail++; }
      else if (it.factor === 'INF') { if (a >= 3) infFail++; } // согласие с невозможным
      else if (it.factor === 'CONS') { consVals.a = a; consVals.pairId = it.pairId; consVals.key = it.key; }
    });
    // согласованность: сравним ответ CONS-пункта с его парным пунктом (оба приведены к «направлению черты»)
    let consDiff = null;
    if (consVals.pairId != null && consVals.a != null && answers[consVals.pairId] != null) {
      const pairItem = P.items.find(x => x.id === consVals.pairId);
      const consAligned = consVals.key === 1 ? consVals.a : (6 - consVals.a);
      const pairAligned = (pairItem && pairItem.key === -1) ? (6 - answers[consVals.pairId]) : answers[consVals.pairId];
      consDiff = Math.abs(consAligned - pairAligned);
    }
    const scored = {};
    Object.keys(acc).forEach(k => {
      const mean = acc[k].sum / acc[k].n;
      const nrm = HR.NORMS[k] || { m: 3.5, sd: 0.7, a: 0.75 };
      const z = (mean - nrm.m) / nrm.sd;
      scored[k] = {
        mean: mean, z: z, pct: HR.clamp(HR.pct(z), 1, 99),
        oca: Math.round(HR.clamp(z * 33.3, -100, 100)),
        semZ: Math.sqrt(1 - nrm.a),
      };
    });
    // longstring
    let maxRun = 1, run = 1;
    for (let i = 1; i < seq.length; i++) { if (seq[i] === seq[i - 1]) { run++; maxRun = Math.max(maxRun, run); } else run = 1; }

    const sdMean = sdN ? sdSum / sdN : 0;
    const flags = [];
    if (sdMean >= 4.2) flags.push({ level: 'red', code: 'SD', text: 'Профиль вероятно приукрашен (высокая соц. желательность) — интерпретировать с осторожностью.' });
    else if (sdMean >= 3.6) flags.push({ level: 'yellow', code: 'SD', text: 'Умеренная тенденция приукрашивать себя.' });
    if (attFail >= 2) flags.push({ level: 'red', code: 'ATT', text: 'Провалены проверки внимания (' + attFail + '/' + attTotal + ') — результат ненадёжен.' });
    else if (attFail === 1) flags.push({ level: 'yellow', code: 'ATT', text: 'Одна проверка внимания не пройдена.' });
    if (infFail) flags.push({ level: 'yellow', code: 'INF', text: 'Согласие с «невозможным» утверждением — невнимательность или небрежность.' });
    if (maxRun > 12) flags.push({ level: 'red', code: 'LONGSTRING', text: 'Более 12 одинаковых ответов подряд — вероятно, отвечал не читая.' });
    if (consDiff != null && consDiff >= 3) flags.push({ level: 'yellow', code: 'CONS', text: 'Противоречивые ответы на почти одинаковые вопросы — проверить внимательность и искренность.' });

    const invalid = attFail >= 2 || maxRun > 12;
    return { scales: scored, sdMean: sdMean, attFail: attFail, longstring: maxRun, flags: flags, invalid: invalid };
  };

  /* ---------- Когнитивный ----------
     items: администрированные задания [{p, answerIndex, section}]; answers: [idx|null].
     Возвращает шкалу 1..99 (композит и секции V/N/A) через Φ-калибровку по проектным p. */
  HR.scoreCognitive = function (items, answers) {
    const alpha = 0.80;
    function calc(subset) {
      let raw = 0, E = 0, varSum = 0, n = 0;
      subset.forEach(x => {
        const it = x.it, a = x.a;
        E += it.p; varSum += it.p * (1 - it.p); n++;
        if (a === it.answerIndex) raw++;
      });
      if (n === 0) return null;
      const denom = 1 - alpha * (n - 1) / n;
      const sigma = Math.sqrt(Math.max(varSum / denom, 0.5));
      const score = HR.clamp(Math.round(100 * HR.normCdf((raw - E) / sigma)), 1, 99);
      // приблизительный ±SEM в баллах шкалы: разница перцентилей при ±1 сырой ошибке измерения
      const semRaw = sigma * Math.sqrt(1 - alpha);
      const semScore = Math.max(3, Math.round(100 * (HR.normCdf(semRaw / sigma) - 0.5)));
      return { score: score, raw: raw, n: n, semScore: semScore };
    }
    const pack = items.map((it, i) => ({ it: it, a: answers[i] }));
    const bySec = s => pack.filter(x => (x.it.section || 'A') === s);
    return {
      composite: calc(pack),
      V: calc(bySec('V')), N: calc(bySec('N')), A: calc(bySec('A')),
    };
  };

  /* ---------- Абстрактная секция входит в когнитивный как section 'A' ---------- */

  /* ---------- SJT ----------
     scenarios: [{best, worst, measures, ...}]; answers: [{best, worst}].
     +2 за верный «лучший», +2 за верный «худший». Флаги — выбор худшего как лучшего в кейсах безопасности/честности. */
  HR.scoreSJT = function (scenarios, answers) {
    let raw = 0; const max = scenarios.length * 4; const flags = [];
    const critical = /безопас|честн|воровств|качеств|ответственност/i;
    scenarios.forEach((s, i) => {
      const a = answers[i] || {};
      if (a.best === s.best) raw += 2;
      if (a.worst === s.worst) raw += 2;
      if (a.best === s.worst && critical.test(s.measures || '')) {
        flags.push({ level: 'red', code: 'SJT', text: 'Кейс «' + s.title + '»: как ЛУЧШИЙ выбран самый неверный вариант (' + (s.measures || '') + ') — обсудить на интервью.' });
      }
    });
    const percent = Math.round(raw / max * 100);
    return { percent: percent, raw: raw, max: max, flags: flags };
  };

  /* ---------- Integrity ----------
     items: [{type,key}]; answers: {id: value}. likert→среднее(реверс)→0..100. */
  HR.scoreIntegrity = function (items, answers) {
    let sum = 0, n = 0; const flags = [];
    items.forEach(it => {
      const a = answers[it.id];
      if (a == null) return;
      if (it.type === 'likert') { const v = it.key === 1 ? a : (6 - a); sum += v; n++; }
      else if (it.type === 'projection') {
        if (a > 60) flags.push({ level: 'yellow', code: 'INT-PROJ', text: 'Считает, что нарушают «многие» (' + a + '%) — проекция допустимости нарушений.' });
      } else if (it.type === 'marker') {
        if (a >= 4) flags.push({ level: 'yellow', code: 'INT-MARK', text: '«Никогда не нарушал ни одного правила» — возможна социальная желательность.' });
      }
    });
    const mean = n ? sum / n : 0;
    const score = Math.round((mean - 1) / 4 * 100);
    if (score < 50) flags.push({ level: 'red', code: 'INT-LOW', text: 'Повышенный риск ненадёжности (установки к правилам/честности). Проверить рекомендации.' });
    return { score: score, mean: mean, flags: flags };
  };

  /* ---------- Biodata ----------
     items: массив пунктов с рубрикой; answers: {id: value|array}; family для workerBands.
     overrides: {id: 0|1|2} — ручная корректировка балла работодателем после проверки фактов. */
  HR.scoreBiodata = function (items, answers, family, overrides) {
    overrides = overrides || {};
    let sum = 0, max = 0; const flags = []; const verify = []; const breakdown = []; let hasResults = false, hasRefs = false;
    items.forEach(it => {
      max += 2; const a = answers[it.id];
      let s = 0; let answerText = '';
      if (it.kind === 'number') {
        const v = parseFloat(a); const bands = (family === 'worker' && it.workerBands) ? it.workerBands : it.bands;
        if (!isNaN(v) && bands) { const b = bands.slice().sort((x, y) => y.min - x.min).find(b => v >= b.min); s = b ? b.score : 0; }
        if (it.redFlagAbove && v > it.redFlagAbove) flags.push({ level: 'red', code: it.id, text: it.label + ' — ' + v + ' (много).' });
        answerText = (a == null || a === '') ? '—' : String(a);
      } else if (it.kind === 'select') {
        const opt = (it.options || [])[a]; s = opt ? opt.score : 0;
        if (opt && opt.flag) flags.push({ level: 'yellow', code: it.id, text: it.label + ' → ' + opt.label + ': ' + opt.flag });
        answerText = opt ? opt.label : '—';
      } else if (it.kind === 'textlist') {
        const arr = a || []; const filled = arr.filter(x => x && x.trim()).length;
        const withNum = arr.filter(x => x && /\d/.test(x)).length;
        s = withNum >= 3 ? 2 : (withNum >= 1 || filled >= 3) ? 1 : 0;
        if (filled) { hasResults = true; arr.forEach(x => { if (x && x.trim()) verify.push('Результат: ' + x.trim()); }); }
        answerText = arr.filter(x => x && x.trim()).join('; ') || '—';
      } else if (it.kind === 'refs') {
        const arr = a || []; const filled = arr.filter(x => x && x.trim()).length;
        s = filled >= 2 ? 2 : filled === 1 ? 1 : 0;
        if (filled) { hasRefs = true; arr.forEach(x => { if (x && x.trim()) verify.push('Рекомендатель: ' + x.trim()); }); }
        answerText = arr.filter(x => x && x.trim()).join('; ') || '—';
      } else if (it.kind === 'text') {
        if (a && a.trim()) { s = it.scoreIfFilled || 0; if (it.verify) verify.push(it.label + ' ' + a.trim()); }
        answerText = (a && a.trim()) ? a.trim() : '—';
      }
      const auto = s;
      const ov = overrides[it.id];
      const eff = (ov === 0 || ov === 1 || ov === 2) ? ov : auto;
      breakdown.push({ id: it.id, label: it.label, answer: answerText, auto: auto, score: eff, overridden: eff !== auto });
      sum += eff;
    });
    if (hasResults && !hasRefs) flags.push({ level: 'red', code: 'BD-REF', text: 'Результаты заявлены, но подтвердить некому — проверить особенно тщательно.' });
    const score = max ? Math.round(sum / max * 100) : 0;
    return { score: score, raw: sum, max: max, flags: flags, verify: verify, breakdown: breakdown };
  };

  /* ---------- Внимательность (perceptual speed) ---------- */
  HR.scoreAttention = function (r) {
    if (!r || !r.total) return null;
    const net = Math.max(0, (r.correct || 0) - (r.errors || 0));
    return { score: HR.clamp(Math.round(net / r.total * 100), 1, 99), correct: r.correct, errors: r.errors, total: r.total };
  };

  /* ---------- Личностный Fit (0..100) по весам позиции ---------- */
  HR.personalityFit = function (position, pers) {
    const w = position.personalityWeights || {}; let s = 0, wsum = 0;
    Object.keys(w).forEach(dom => {
      if (!w[dom]) return; const sc = pers.scales[dom]; if (!sc) return;
      s += w[dom] * sc.pct; wsum += w[dom];
    });
    return wsum ? Math.round(s / wsum) : 0;
  };

  /* ---------- Общий Fit Score + вердикт ---------- */
  HR.computeFit = function (position, moduleScores) {
    // moduleScores: {personality, cognitive, sjt, integrity, biodata, knowledge, attention} — каждый 0..100 или undefined
    const w = position.moduleWeights || {}; let s = 0, wsum = 0; const contrib = [];
    Object.keys(w).forEach(m => {
      const ms = moduleScores[m];
      if (ms == null) return;
      s += w[m] * ms; wsum += w[m];
      contrib.push({ module: m, weight: w[m], score: ms });
    });
    const fit = wsum ? Math.round(s / wsum) : 0;
    contrib.forEach(c => c.norm = wsum ? c.weight / wsum : 0);
    const band = window.HR_BANDS.fit.find(b => fit >= b.min);
    return { fit: fit, verdict: band.verdict, tone: band.tone, note: band.note, contrib: contrib };
  };

  HR.band = function (pct) { return window.HR_BANDS.percentile.find(b => pct <= b.max); };

  /* ---------- Кодирование результата (UTF-8 → base64 + контрольная сумма) ---------- */
  function hash(str) { let h = 5381; for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0; return h.toString(36); }
  HR.encodeResult = function (obj) {
    const json = JSON.stringify(obj);
    const b64 = btoa(unescape(encodeURIComponent(json)));
    return 'HR1.' + hash(json) + '.' + b64;
  };
  HR.decodeResult = function (code) {
    try {
      code = (code || '').trim();
      const parts = code.split('.');
      if (parts.length !== 3 || parts[0] !== 'HR1') return { error: 'Не похоже на код результата (нужен формат HR1.…).' };
      const json = decodeURIComponent(escape(atob(parts[2])));
      if (hash(json) !== parts[1]) return { error: 'Код повреждён или изменён вручную (не сходится контрольная сумма).' };
      return { data: JSON.parse(json) };
    } catch (e) { return { error: 'Не удалось прочитать код: ' + e.message }; }
  };

  /* ---------- Настройки (overrides дефолтов) ----------
     settings = { positions:{fam:{moduleWeights,personalityWeights,cognitive}}, sjt:{scenarioId:{best,worst}}, combine:{interview,tests} } */
  HR.effectivePosition = function (fam, settings) {
    const base = window.HR_POSITIONS[fam];
    const ov = settings && settings.positions && settings.positions[fam];
    if (!ov) return base;
    return Object.assign({}, base, {
      moduleWeights: Object.assign({}, base.moduleWeights, ov.moduleWeights || {}),
      personalityWeights: Object.assign({}, base.personalityWeights, ov.personalityWeights || {}),
      cognitive: Object.assign({}, base.cognitive, ov.cognitive || {}),
    });
  };
  // применяет override ключей SJT к банку (не мутируя оригинал)
  HR.effectiveSJT = function (scenarios, settings) {
    const ov = settings && settings.sjt;
    if (!ov) return scenarios;
    return scenarios.map(s => ov[s.id] ? Object.assign({}, s, { best: ov[s.id].best, worst: ov[s.id].worst }) : s);
  };

  /* ---------- Интервью (BARS) ----------
     comps: [{c,B,S}]; scores: {"idx:B":1..5, "idx:S":1..5}. Возвращает total/max/pct/complete. */
  HR.scoreInterview = function (comps, scores) {
    scores = scores || {}; let total = 0, answered = 0; const max = comps.length * 2 * 5;
    comps.forEach((c, i) => {
      ['B', 'S'].forEach(t => { const v = scores[i + ':' + t]; if (v >= 1 && v <= 5) { total += v; answered++; } });
    });
    const maxAnswered = comps.length * 2;
    return { total: total, max: max, answered: answered, maxAnswered: maxAnswered,
      complete: answered === maxAnswered,
      pct: answered ? Math.round(total / (answered * 5) * 100) : null };
  };

  /* ---------- Комбинированный вердикт (тесты + интервью) ----------
     Интервью — предиктор №1 (.42), поэтому при полном интервью весит больше. */
  HR.combineVerdict = function (fitScore, interview, settings) {
    const w = (settings && settings.combine) || { interview: 55, tests: 45 };
    if (!interview || interview.pct == null) {
      const band = window.HR_BANDS.fit.find(b => fitScore >= b.min);
      return { score: fitScore, verdict: band.verdict, tone: band.tone, note: band.note, hasInterview: false };
    }
    const wi = w.interview, wf = w.tests, sum = wi + wf;
    const score = Math.round((wi * interview.pct + wf * fitScore) / sum);
    const band = window.HR_BANDS.fit.find(b => score >= b.min);
    return { score: score, verdict: band.verdict, tone: band.tone, note: band.note, hasInterview: true, complete: interview.complete };
  };

  /* ---------- Быстрый общий результат (для кандидатской стороны: Fit + прошёл/не прошёл) ----------
     Переиспользует те же функции, что и панель. rec — для override/интервью (у кандидата пусто). */
  HR.quickResult = function (d, settings) {
    settings = settings || {};
    const P = HR.effectivePosition(d.fam, settings);
    const pers = HR.scorePersonality(d.ans.personality || {});
    const lookup = {}; window.HR_COGNITIVE.items.forEach(it => lookup[it.id] = it);
    window.HR_ABSTRACT.items.forEach(it => lookup[it.id] = Object.assign({ section: 'A' }, it));
    let cog = null;
    if ((d.ans.cognitive || []).length) {
      const adm = d.ans.cognitive.map(c => lookup[c.id]).filter(Boolean);
      cog = HR.scoreCognitive(adm, d.ans.cognitive.map(c => c.a));
    }
    const bank = P.sjtBank ? HR.effectiveSJT(window.HR_SJT[P.sjtBank], settings) : null;
    const sjt = (bank && d.ans.sjt && d.ans.sjt.length) ? HR.scoreSJT(bank, d.ans.sjt) : null;
    const intItems = window.HR_INTEGRITY.core.concat(window.HR_INTEGRITY[d.fam] || []);
    const integ = (d.ans.integrity && Object.keys(d.ans.integrity).length) ? HR.scoreIntegrity(intItems, d.ans.integrity) : null;
    const bioItems = window.HR_BIODATA.core.concat(window.HR_BIODATA[d.fam] || []);
    const bio = (d.ans.biodata && Object.keys(d.ans.biodata).length) ? HR.scoreBiodata(bioItems, d.ans.biodata, d.fam, {}) : null;
    let know = null;
    if ((d.ans.knowledge || []).length) {
      const kl = {}; window.HR_KNOWLEDGE.items.forEach(it => kl[it.id] = it);
      let correct = 0, n = 0; d.ans.knowledge.forEach(k => { const it = kl[k.id]; if (it) { n++; if (k.a === it.answerIndex) correct++; } });
      know = { score: n ? Math.round(correct / n * 100) : 0 };
    }
    const att = d.ans.attention ? HR.scoreAttention(d.ans.attention) : null;
    const persAnswered = d.ans.personality && Object.keys(d.ans.personality).length;
    const ms = {};
    if (persAnswered) ms.personality = HR.personalityFit(P, pers);
    if (cog) ms.cognitive = cog.composite.score;
    if (sjt) ms.sjt = sjt.percent;
    if (integ) ms.integrity = integ.score;
    if (bio) ms.biodata = bio.score;
    if (know) ms.knowledge = know.score;
    if (att) ms.attention = att.score;
    const fit = HR.computeFit(P, ms);
    // Порог прохождения: второй порог вердикта (по умолчанию 60). Ниже — «не прошёл».
    const passMin = (window.HR_BANDS.fit[1] && window.HR_BANDS.fit[1].min) || 60;
    return { fit: fit.fit, tone: fit.tone, verdict: fit.verdict, passed: fit.fit >= passMin, passMin: passMin, moduleScores: ms };
  };

  window.HR = HR;
})();
