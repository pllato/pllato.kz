# -*- coding: utf-8 -*-
# Счёт № AGR-С-2026-01 на предоплату 10% по договору AGR-2026-01 (ТОО «Аграрное») — из шаблона schet-grandis-1.html
import os,re
ROOT=os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','..','..'))
s=open(os.path.join(ROOT,'app','schet-grandis-1.html'),encoding='utf-8').read()
def r(a,b):
    global s
    assert a in s,a[:70]; s=s.replace(a,b)
r('<title>Счёт на предоплату № GR-С-2026-01 · Grandis × Pllato</title>','<title>Счёт на предоплату № AGR-С-2026-01 · ТОО «Аграрное» × Pllato</title>')
r(':root{--ink:#13202c;--acc:#1f7a8c;--accD:#14606f;--accL:#e9f4f6;',':root{--ink:#1f3d2b;--acc:#2e6b45;--accD:#1f5a36;--accL:#edf3e8;')
s=re.sub(r'<div class="bm">.*?</div>','<div class="bm"><svg width="23" height="23" viewBox="0 0 100 100"><path d="M18 70c20-4 44-4 64 0" stroke="#e0a530" stroke-width="8" fill="none" stroke-linecap="round"/><path d="M50 66V26M50 40c-8-2-12-8-12-14M50 40c8-2 12-8 12-14M50 54c-8-2-12-8-12-14M50 54c8-2 12-8 12-14" stroke="#e0a530" stroke-width="7" fill="none" stroke-linecap="round"/></svg></div>',s,count=1,flags=re.S)
r('<div class="bs">разработка систем управления · CRM-система мебельного производства</div>','<div class="bs">разработка систем управления · система «ДАЛА» для ТОО «Аграрное»</div>')
r('СЧЁТ НА ОПЛАТУ № GR-С-2026-01','СЧЁТ НА ОПЛАТУ № AGR-С-2026-01')
r('<div class="dt">от 8 октября 2026 г.</div>','<div class="dt">от 19 октября 2026 г.</div>')
r('Основание — договор № GR-2026-01 на разработку программного обеспечения от 8 октября 2026 года.','Основание — договор № AGR-2026-01 на разработку и передачу программного обеспечения от 19 октября 2026 года.')
s=re.sub(r'<div class="note-top">.*?</div>\n','<div class="note-top"><b>Оплата этого счёта запускает работы.</b> Датой начала работ считается рабочий день после поступления предоплаты (п. 4.2 Договора). Ядро Системы — не позднее 3 недель, полная разработка — не позднее 6 недель, затем 10 рабочих дней опытной эксплуатации. Следующие платежи — по 45% после приёмки Ядра и после окончательной приёмки (Приложение № 2).</div>\n',s,count=1,flags=re.S)
s=re.sub(r'(<div class="lbl">Заказчик \(плательщик\)</div>).*?(</div>\n  </div>\n\n  <table class="work">)',r'''\1
      <div class="nm">ТОО «Аграрное»</div>
      <div>БИН 980840004599 · Кбе 17</div>
      <div>Директор: Шамиган Алмас Нурланулы</div>
      <div>Акмолинская обл., Атбасарский р-н, с. Борисовка,</div>
      <div>ул. Бейбитшилик, строение 51</div>
      <div>ИИК: KZ74998JTB0000334920 · АО «Alatau City Bank» · БИК TSESKZKA</div>\n    \2''',s,count=1,flags=re.S)
a=re.search(r'<td>Разработка CRM-системы.*?</td>\n\s*<td class="r">1</td><td class="r">198 000</td><td class="r">198 000</td>',s,re.S); assert a
s=s.replace(a.group(0),'<td>Разработка информационной системы управления сельскохозяйственным предприятием «ДАЛА» по Приложению № 1 к Договору: растениеводство, склады зерна и кормов, отгрузка, ГСМ и АЗС, техника и запчасти, животноводство и убойный цех, выдача населению, отчёты, табель и зарплата, пульт руководителя, администрирование, перенос данных и обучение. <b>Предоплата 10% — старт работ.</b></td>\n        <td class="r">1</td><td class="r">242 500</td><td class="r">242 500</td>')
r('Сумма к оплате (предоплата 10%)</span><span class="v">198 000 ₸','Сумма к оплате (предоплата 10%)</span><span class="v">242 500 ₸')
r('198 000 (сто девяносто восемь тысяч) тенге','242 500 (двести сорок две тысячи пятьсот) тенге')
i=s.index('<div class="kvwrap">');j=s.index('</div>\n\n  <div class="sec">Реквизиты',i)
s=s[:i]+'''<div class="kvwrap">
    <div class="kv"><span>Стоимость работ без скидки</span><span>2 500 000 ₸</span></div>
    <div class="kv"><span>Скидка 3%</span><span>−75 000 ₸</span></div>
    <div class="kv"><span><b>Стоимость по договору № AGR-2026-01</b></span><span><b>2 425 000 ₸</b></span></div>
    <div class="kv cur"><span>Платёж 1 · предоплата 10% — после подписания Договора<span class="tag">← текущий счёт</span></span><span>242 500 ₸</span></div>
    <div class="kv"><span>Платёж 2 · приёмка Ядра Системы (45%)</span><span>1 091 250 ₸</span></div>
    <div class="kv"><span>Платёж 3 · окончательная приёмка Системы (45%)</span><span>1 091 250 ₸</span></div>
  '''+s[j:]
r('198 000 ₸ в течение 5 рабочих дней с даты подписания договора.','242 500 ₸ в течение 5 рабочих дней с даты подписания Договора (п. 5.4).')
r('Предоплата 10% по договору № GR-2026-01 от 08.10.2026 за разработку программного обеспечения, счёт № GR-С-2026-01. Без НДС','Предоплата 10% по договору № AGR-2026-01 от 19.10.2026 за разработку программного обеспечения, счёт № AGR-С-2026-01. Без НДС')
r('<div class="snm">ИП «Grandis»</div><div class="ln"><u></u> / Измеров В. А. / М.П.</div>','<div class="snm">ТОО «Аграрное»</div><div class="ln"><u></u> / Шамиган А. Н. / М.П.</div>')
r('счёт GR-С-2026-01 ·','счёт AGR-С-2026-01 ·')
s=s.replace(' Возможен перевод Kaspi по номеру +7 701 123 99 99','')
s=s.replace('\n.runfoot{','\n@media print{body{background:#fff}.page{margin:0;height:297mm;overflow:hidden}}\n.runfoot{',1)
assert 'Grandis' not in s and 'GR-2026' not in s.replace('AGR-2026','')
open(os.path.join(ROOT,'app','schet-agro-1.html'),'w',encoding='utf-8').write(s)
print('ok')
