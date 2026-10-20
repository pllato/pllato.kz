# -*- coding: utf-8 -*-
# Обязательство субподрядчика о добросовестном выполнении работ — форма для ТОО «RL-system» (1 лист A4)
import os
D=os.path.dirname(os.path.abspath(__file__))
ROOT=os.path.abspath(os.path.join(D,'..','..','..','..'))
L=lambda w='100%':f'<span class="ln" style="width:{w}"></span>'
html=f'''<!doctype html><html lang="ru"><head>
<script src="/app/gate.js"></script>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>Обязательство субподрядчика · ТОО «RL-system»</title>
<link href="https://fonts.googleapis.com/css2?family=PT+Serif:wght@400;700&display=swap" rel="stylesheet">
<style>
@page{{size:A4;margin:0}}
*{{box-sizing:border-box;margin:0;padding:0}}
html{{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
body{{font-family:'PT Serif',Georgia,serif;color:#111;background:#d9dcdf;font-size:9.4pt;line-height:1.34}}
.page{{width:210mm;height:297mm;margin:0 auto;background:#fff;padding:11mm 14mm 10mm 18mm;overflow:hidden;position:relative}}
@media print{{body{{background:#fff}}.page{{margin:0}}}}
.top{{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:1.5px solid #111;padding-bottom:5px;margin-bottom:8px;font-size:8.6pt}}
.top b{{font-size:10.2pt;letter-spacing:.02em}}
h1{{text-align:center;font-size:12.6pt;letter-spacing:.06em;margin:4px 0 1px}}
.sub{{text-align:center;font-size:9.6pt;font-style:italic;margin-bottom:7px}}
.place{{display:flex;justify-content:space-between;margin-bottom:7px}}
.ln{{display:inline-block;border-bottom:1px solid #222;height:1.05em;vertical-align:bottom}}
p{{text-align:justify;margin-bottom:4px}}
table.f{{width:100%;border-collapse:collapse;margin:5px 0 7px}}
table.f td{{border:1px solid #444;padding:4px 7px;vertical-align:top;height:6.6mm}}
table.f td.k{{width:34%;font-weight:700;font-size:9pt;background:#f2f2f0}}
ol{{margin:0 0 4px 16px}}ol li{{text-align:justify;margin-bottom:3px;padding-left:2px}}
.fine{{border:1.5px solid #111;padding:5px 8px;margin:3px 0 5px;font-weight:700;text-align:justify}}
.sig{{display:grid;grid-template-columns:1.15fr 1fr;gap:10mm;margin-top:7px}}
.sig h3{{font-size:9.6pt;margin-bottom:4px;letter-spacing:.03em}}
.row{{display:flex;gap:5px;align-items:flex-end;margin-bottom:5.2px;font-size:9pt}}.row span:first-child{{white-space:nowrap}}.row .ln{{flex:1}}
.req{{font-size:8.8pt;line-height:1.45}}
.mp{{font-size:8.4pt;color:#444;margin-top:3px}}
.foot{{position:absolute;left:18mm;right:14mm;bottom:7mm;font-size:7.6pt;color:#555;display:flex;justify-content:space-between;border-top:1px solid #bbb;padding-top:3px}}
</style></head><body><section class="page">
<div class="top"><div><b>ТОО «RL-system»</b><br>БИН 040340014374 · 050002, г. Алматы, Медеуский р-н, ул. Карамысова К, д. 84/2, корп. 1, кв. 55</div><div style="text-align:right">Форма СП-1<br>№ {L('22mm')}</div></div>
<h1>ОБЯЗАТЕЛЬСТВО СУБПОДРЯДЧИКА</h1>
<div class="sub">о добросовестном, полном и своевременном выполнении работ</div>
<div class="place"><span>г. Алматы</span><span>«{L('8mm')}» {L('30mm')} 20{L('6mm')} г.</span></div>
<p style="text-align:left;line-height:1.55">{L('125mm')} <small>(наименование / ФИО)</small>, ИИН/БИН {L('40mm')}, в лице {L('62mm')}, действующего на основании {L('42mm')} (далее — «Субподрядчик»), выполняющий работы по заданию ТОО «RL-system», БИН 040340014374 (далее — «Генподрядчик»), настоящим в одностороннем порядке принимает на себя следующие обязательства по проекту:</p>
<table class="f">
<tr><td class="k">Проект / объект (адрес)</td><td></td></tr>
<tr><td class="k">Вид и объём работ</td><td></td></tr>
<tr><td class="k">Срок начала / окончания работ</td><td>с «{L('7mm')}» {L('26mm')} 20{L('6mm')} г. &nbsp;по «{L('7mm')}» {L('26mm')} 20{L('6mm')} г.</td></tr>
<tr><td class="k">Стоимость работ, тенге</td><td></td></tr>
<tr><td class="k">Рабочий чат проекта (мессенджер, название)</td><td></td></tr>
<tr><td class="k">Ответственный от Генподрядчика</td><td></td></tr>
</table>
<ol>
<li><b>Работать добросовестно, «на совесть».</b> Выполнять работы качественно, в соответствии с проектом, техническим заданием, строительными нормами и правилами Республики Казахстан и указаниями Генподрядчика, соблюдать технику безопасности и порядок на объекте.</li>
<li><b>Выполнять все договорённости.</b> Соблюдать условия, согласованные с Генподрядчиком в договоре, в настоящем Обязательстве и в рабочих чатах проекта (WhatsApp, Telegram и др.). Сообщения уполномоченных лиц Сторон в рабочем чате признаются письменной формой договорённостей и обязательны для исполнения наравне с договором.</li>
<li><b>Завершить работы в срок и в полном объёме.</b> Не прекращать и не приостанавливать работы и не покидать объект без письменного согласования с Генподрядчиком; о любых препятствиях сообщать в рабочий чат не позднее 24 часов с момента их возникновения.</li>
<li><b>Устранять недостатки за свой счёт</b> в срок, указанный Генподрядчиком; не передавать работы третьим лицам без согласия Генподрядчика.</li>
<li><b>Недобросовестным исполнением</b> признаются, в том числе: срыв сроков без уважительной причины; оставление объекта или отказ от продолжения работ; некачественное выполнение работ и неустранение недостатков в установленный срок; невыполнение договорённостей, зафиксированных в рабочем чате; привлечение третьих лиц без согласия Генподрядчика.</li>
</ol>
<div class="fine">6. В случае недобросовестного исполнения Субподрядчик обязуется уплатить Генподрядчику штраф в размере 3 000 000 (три миллиона) тенге в течение 10 (десяти) рабочих дней с даты письменного требования. Уплата штрафа не освобождает Субподрядчика от обязанности завершить работы в срок и в полном объёме, устранить недостатки и возместить причинённые убытки. Генподрядчик вправе удержать сумму штрафа из платежей, причитающихся Субподрядчику.</div>
<p>7. Настоящее Обязательство действует до полного завершения и приёмки работ, является неотъемлемой частью договора субподряда (при его наличии) и составлено в двух экземплярах. Споры разрешаются в суде по месту нахождения Генподрядчика в соответствии с законодательством Республики Казахстан. Субподрядчик подтверждает, что ознакомлен с Обязательством, понимает его последствия и подписывает его добровольно.</p>
<div class="sig">
 <div><h3>СУБПОДРЯДЧИК</h3>
  <div class="row"><span>Наименование / ФИО</span>{L()}</div>
  <div class="row"><span>ИИН / БИН</span>{L()}</div>
  <div class="row"><span>Адрес</span>{L()}</div>
  <div class="row"><span>Телефон</span>{L()}</div>
  <div class="row"><span>ИИК, банк</span>{L()}</div>
  <div class="row"><span>Подпись</span>{L('36mm')}<span>/</span>{L()}<span>/</span></div>
  <div class="mp">М.П. (при наличии) · экземпляр получил</div></div>
 <div><h3>ПРИНЯТО ГЕНПОДРЯДЧИКОМ</h3>
  <div class="req"><b>ТОО «RL-system»</b><br>БИН 040340014374<br>г. Алматы, Медеуский р-н, ул. Карамысова К, д. 84/2, корп. 1, кв. 55</div>
  <div class="row" style="margin-top:9px"><span>Руководитель</span>{L()}</div>
  <div class="row"><span>Подпись</span>{L('36mm')}<span>/</span>{L()}<span>/</span></div>
  <div class="mp">М.П.</div></div>
</div>
<div class="foot"><span>Обязательство субподрядчика · ТОО «RL-system»</span><span>Лист 1 из 1</span></div>
</section></body></html>'''
open(os.path.join(ROOT,'app','obyazatelstvo-rl-subpodryad.html'),'w',encoding='utf-8').write(html)
print('ok')
