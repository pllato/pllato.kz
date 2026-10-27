# -*- coding: utf-8 -*-
# Счёт KUG-С-2026-01 · предоплата 10% (100 000 ₸) по договору KUG-2026-01 · шаблон app/schet-101kz-1.html
import os,re
ROOT=os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','..','..'))
s=open(ROOT+'/app/schet-101kz-1.html',encoding='utf-8').read()
def cut(a,b,new):
    global s
    i=s.index(a);j=s.index(b,i)
    s=s[:i]+new+s[j:]
s=re.sub(r'<title>.*?</title>','<title>Счёт KUG-С-2026-01 · предоплата · ТОО «Кугуар-секьюрити»</title>',s,1)
cut('<div class="badge">','<div class="parties">','''<div class="badge">Сайт и CRM · Старт</div>
      <div class="numblock">
        <div class="cap">Счёт на оплату · предоплата 1 из 3</div>
        <div class="no serif">№ KUG-С-2026-01</div>
        <div class="dt">от 27 октября 2026 г.<br>Действителен до 10.11.2026</div>
      </div>
    </div>
  </header>

  ''')
cut('<div class="lbl">ПЛАТЕЛЬЩИК · PAYER</div>','<div class="accept">','''<div class="lbl">ПЛАТЕЛЬЩИК · PAYER</div>
      <div class="nm">ТОО «Кугуар-секьюрити»</div>
      <div>БИН 010540003767</div>
      <div>г. Астана, район Алматы, ж/м Юго-Восток (левая сторона), ул. Есіл, д. 27</div>
      <div>Директор: Майкибаев Б. Б.</div>
      <div>Проект: сайт с личным кабинетом и мини-CRM</div>
    </div>
  </div>

  ''')
cut('<div class="accept">','<div class="paybar">','''<div class="accept">
    <div class="at">ПЛАТЁЖ 1 · ПРЕДОПЛАТА 10% · СТАРТ РАБОТ</div>
    Предоплата по <b>Договору № KUG-2026-01 от 27.10.2026</b> (п. 2.4): сайт охранного агентства по готовому макету с личным кабинетом клиента — 800 000 ₸, мини-CRM на базе сайта — 200 000 ₸, интеграция системы лояльности — бонусом. Стоимость работ — <b>1 000 000 ₸</b>, срок — 4–5 недель. Работы начинаются в рабочий день, следующий за поступлением предоплаты.
  </div>

  <div class="sec-cap">НАЗНАЧЕНИЕ ПЛАТЕЖА · ПРЕДОПЛАТА 10%</div>
  <table class="work">
    <thead><tr><th style="width:30px">№</th><th>Наименование работ</th><th class="r" style="width:110px">Сумма, ₸</th></tr></thead>
    <tbody>
      <tr>
        <td class="num">1</td>
        <td><b>Предоплата 10% за разработку программного обеспечения по Договору № KUG-2026-01 от 27.10.2026.</b>
        Сайт по макету Заказчика с переносом с Tilda, формы заявок, личный кабинет клиента, мини-CRM с воронкой заявок и карточкой клиента, система лояльности, запуск на сервере Заказчика — по Приложению № 1 «Техническое задание».</td>
        <td class="r">100 000,00</td>
      </tr>
    </tbody>
  </table>
  <div class="steps">
    <div class="step cur"><span>Платёж 1 · 10% — предоплата, старт работ<span class="tg">← настоящий счёт</span></span><span>100 000 ₸</span></div>
    <div class="step"><span>Платёж 2 · 45% — Этап 1 «Сайт и кабинет», после подписания Акта утверждения сайта</span><span>450 000 ₸</span></div>
    <div class="step"><span>Платёж 3 · 45% — Этап 2 «CRM, лояльность и запуск», после подписания Акта сдачи</span><span>450 000 ₸</span></div>
    <div class="step"><span>Итого по договору</span><span>1 000 000 ₸</span></div>
  </div>
  <div class="projnote">Сайт с кабинетом — <b>800 000 ₸</b>, мини-CRM — <b>200 000 ₸</b>, интеграция системы лояльности — <b>бонус, 0 ₸</b>. Абонентской платы нет. Гарантия — 3 месяца после сдачи. Портал управления предприятием — следующим этапом по отдельному договору (раздел 10 договора).</div>

  ''')
s=s.replace('<span class="pc">К ОПЛАТЕ — ПРЕДОПЛАТА 50%<span>1-й из 2 платежей · старт работ</span></span>','<span class="pc">К ОПЛАТЕ — ПРЕДОПЛАТА 10%<span>1-й из 3 платежей · старт работ</span></span>')
s=s.replace('<span class="pv">400 000 ₸</span>','<span class="pv">100 000 ₸</span>')
s=s.replace('Четыреста тысяч тенге 00 тиын.','Сто тысяч тенге 00 тиын.')
cut('<div class="rc-h">Плательщик (для справки)</div>','<div class="purpose">','''<div class="rc-h">Плательщик (для справки)</div>
      <table class="req">
        <tr><td class="k">Наименование</td><td class="v">ТОО «Кугуар-секьюрити»</td></tr>
        <tr><td class="k">БИН</td><td class="v">010540003767</td></tr>
        <tr><td class="k">Банк · ИИК</td><td class="v">АО «ForteBank» · KZ359650000001132531</td></tr>
        <tr><td class="k">Основание</td><td class="v">Договор № KUG-2026-01 от 27.10.2026, п. 2.4</td></tr>
      </table>
    </div>
  </div>

  ''')
cut('<div class="purpose">','</div>','<div class="purpose"><b>Назначение платежа:</b> Оплата по счёту KUG-С-2026-01 от 27.10.2026, предоплата 10% по договору № KUG-2026-01 от 27.10.2026 за разработку программного обеспечения. Без НДС.')
s=s.replace('Дата выставления: 15.10.2026 · Срок оплаты: до 29.10.2026<br>\n      <b>К оплате: 400 000 ₸</b>','Дата выставления: 27.10.2026 · Срок оплаты: до 10.11.2026<br>\n      <b>К оплате: 100 000 ₸</b>')
cut('<div class="runfoot">','</section>','<div class="runfoot"><span>Pllato · Счёт KUG-С-2026-01 · ТОО «Кугуар-секьюрити» · предоплата 10%</span><span>pllato.kz</span></div>\n')
for bad in ('101kz','LB-С','Линия','400 000','PL-2609'):
    assert bad not in s.split('<body')[1],bad
open(ROOT+'/app/schet-kuguar-1.html','w',encoding='utf-8').write(s)
print('ok')
