# -*- coding: utf-8 -*-
# Счета на предоплату 10% доли (100 000 ₸): BUB-С-2026-01 (Тимур, ИП «Кинезис») и BUB-С-2026-02 (Талгат, ТОО «Центр кинезиса Костанай»).
# Шаблон — app/schet-101kz-1.html; меняются шапка, плательщик, назначение, суммы.
import os,re
ROOT=os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','..','..'))
T=open(ROOT+'/app/schet-101kz-1.html',encoding='utf-8').read()
C=[
 dict(slug='timur',inv='BUB-С-2026-01',num='BUB-2026-01',other='Талгат',onum='BUB-2026-02',
      name='ИП «Кинезис»',idk='ИИН / БИН',bin='860810350751',addr='РК, ЗКО, г. Уральск, ул. Курмангалиева, 2',head='Индивидуальный предприниматель (Тимур)',
      bank='АО «Банк ЦентрКредит»',iik='KZ638562204145349621'),
 dict(slug='talgat',inv='BUB-С-2026-02',num='BUB-2026-02',other='Тимур',onum='BUB-2026-01',
      name='ТОО «Центр кинезиса Костанай»',idk='БИН',bin='150740002754',addr='110000, РК, Костанайская обл., г. Костанай, пр. Абая, д. 147, н.п. 2',head='Директор: Блялова Д. Б.',
      bank='АО «Kaspi Bank»',iik='KZ69722S000014120830'),
]
for c in C:
    s=T
    def cut(a,b,new):
        global s
        i=s.index(a);j=s.index(b,i)
        s=s[:i]+new+s[j:]
    s=re.sub(r'<title>.*?</title>',f'<title>Счёт {c["inv"]} · предоплата · Центр Бубновского · {c["name"]}</title>',s,1)
    cut('<div class="badge">','<div class="parties">',f'''<div class="badge">ЛФК · Старт</div>
      <div class="numblock">
        <div class="cap">Счёт на оплату · предоплата 1 из 3</div>
        <div class="no serif">№ {c["inv"]}</div>
        <div class="dt">от 27 октября 2026 г.<br>Действителен до 10.11.2026</div>
      </div>
    </div>
  </header>

  ''')
    cut('<div class="lbl">ПЛАТЕЛЬЩИК · PAYER</div>','<div class="accept">',f'''<div class="lbl">ПЛАТЕЛЬЩИК · PAYER</div>
      <div class="nm">{c["name"]}</div>
      <div>{c["idk"]} {c["bin"]}</div>
      <div>{c["addr"]}</div>
      <div>{c["head"]}</div>
      <div>Проект: система учёта пациентов ЛФК Центр Бубновского</div>
    </div>
  </div>

  ''')
    cut('<div class="accept">','<div class="paybar">',f'''<div class="accept">
    <div class="at">ПЛАТЁЖ 1 · ПРЕДОПЛАТА 10% ДОЛИ · СТАРТ РАБОТ</div>
    Предоплата по <b>Договору № {c["num"]} от 27.10.2026</b> (п. 2.4) на разработку системы учёта пациентов, записи и абонементов «ЛФК Центр Бубновского · Уральск · Костанай». Общая стоимость работ — <b>2 000 000 ₸</b>, оплачивается двумя заказчиками по 50%. Доля Плательщика — <b>1 000 000 ₸</b>, оплата 10% / 45% / 45%. Работы начинаются в рабочий день, следующий за поступлением предоплаты от обоих заказчиков (п. 2.5).
  </div>

  <div class="sec-cap">НАЗНАЧЕНИЕ ПЛАТЕЖА · ПРЕДОПЛАТА 10% ДОЛИ (50%)</div>
  <table class="work">
    <thead><tr><th style="width:30px">№</th><th>Наименование работ</th><th class="r" style="width:110px">Сумма, ₸</th></tr></thead>
    <tbody>
      <tr>
        <td class="num">1</td>
        <td><b>Предоплата 10% доли Заказчика за разработку программного обеспечения по Договору № {c["num"]} от 27.10.2026.</b>
        Система учёта пациентов, записи и абонементов: пациенты и карты, отметка визита, расписание и запись, напоминания в WhatsApp, курсы и программы, абонементы и оплаты, команда, пульт руководителя, перенос данных и запуск — по Приложению № 1 «Техническое задание».</td>
        <td class="r">100 000,00</td>
      </tr>
    </tbody>
  </table>
  <div class="steps">
    <div class="step cur"><span>Платёж 1 · 10% — предоплата, старт работ<span class="tg">← настоящий счёт</span></span><span>100 000 ₸</span></div>
    <div class="step"><span>Платёж 2 · 45% — утверждение ядра Системы</span><span>450 000 ₸</span></div>
    <div class="step"><span>Платёж 3 · 45% — сдача Системы</span><span>450 000 ₸</span></div>
    <div class="step"><span>Итого доля Плательщика (50%)</span><span>1 000 000 ₸</span></div>
  </div>
  <div class="projnote">Вторые 50% — 1 000 000 ₸ — оплачивает второй заказчик ({c["other"]}) по договору № {c["onum"]} по такому же графику. Абонентской платы нет. Гарантийная поддержка — 3 месяца после сдачи Системы и передачи ключей. Договор действует до 31.12.2027.</div>

  ''')
    s=s.replace('<span class="pc">К ОПЛАТЕ — ПРЕДОПЛАТА 50%<span>1-й из 2 платежей · старт работ</span></span>','<span class="pc">К ОПЛАТЕ — ПРЕДОПЛАТА 10%<span>1-й из 3 платежей по доле · старт работ</span></span>')
    s=s.replace('<span class="pv">400 000 ₸</span>','<span class="pv">100 000 ₸</span>')
    s=s.replace('Четыреста тысяч тенге 00 тиын.','Сто тысяч тенге 00 тиын.')
    cut('<div class="rc-h">Плательщик (для справки)</div>','<div class="purpose">',f'''<div class="rc-h">Плательщик (для справки)</div>
      <table class="req">
        <tr><td class="k">Наименование</td><td class="v">{c["name"]}</td></tr>
        <tr><td class="k">{c["idk"]}</td><td class="v">{c["bin"]}</td></tr>
        <tr><td class="k">Банк · ИИК</td><td class="v">{c["bank"]} · {c["iik"]}</td></tr>
        <tr><td class="k">Основание</td><td class="v">Договор № {c["num"]} от 27.10.2026, п. 2.4</td></tr>
      </table>
    </div>
  </div>

  ''')
    cut('<div class="purpose">','</div>',f'<div class="purpose"><b>Назначение платежа:</b> Оплата по счёту {c["inv"]} от 27.10.2026, предоплата 10% по договору № {c["num"]} от 27.10.2026 за разработку программного обеспечения (доля 50%). Без НДС.')
    s=s.replace('Дата выставления: 15.10.2026 · Срок оплаты: до 29.10.2026<br>\n      <b>К оплате: 400 000 ₸</b>','Дата выставления: 27.10.2026 · Срок оплаты: до 10.11.2026<br>\n      <b>К оплате: 100 000 ₸</b>')
    cut('<div class="runfoot">','</section>',f'<div class="runfoot"><span>Pllato · Счёт {c["inv"]} · Центр Бубновского · {c["name"]} · предоплата 10%</span><span>pllato.kz</span></div>\n')
    for bad in ('101kz','LB-С','Линия','400 000','PL-2609'):
        assert bad not in s.split('<body')[1],(c['slug'],bad)
    open(ROOT+f'/app/schet-bubnovsky-{c["slug"]}.html','w',encoding='utf-8').write(s)
    print('ok',c['slug'])
