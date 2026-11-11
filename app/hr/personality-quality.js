/* Interaction safeguards, not a lie detector or a hiring decision. */
(function(){
 const MIN_READ_MS=1500;
 function issue(items,answers,quality){
  if(items.some(it=>!Number.isInteger(answers?.[it.id])||answers[it.id]<1||answers[it.id]>5))return 'Ответьте на все вопросы личностного теста.';
  if(items.some(it=>it.factor==='ATT'&&answers[it.id]!==it.attn_answer))return 'Перечитайте задания на внимательность и выполните указанную инструкцию.';
  if(quality?.version===1&&items.some(it=>!Number.isFinite(quality.readMs?.[it.id])||quality.readMs[it.id]<MIN_READ_MS))return 'Некоторые вопросы были пропущены слишком быстро. Вернитесь к ним и перечитайте.';
  return null;
 }
 globalThis.HR_PERSONALITY_QUALITY={MIN_READ_MS,issue};
})();
