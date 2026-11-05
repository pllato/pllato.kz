# Вносит в демо app/obojma.(html|js) воронки по встрече с Вадимом 05.11: лиды и РЭС, договор из шаблона, исполнение по накладным,
# расходы по договору, снабжение, мессенджер/лента/задачи, согласование по СМС. Идемпотентно (маркер).
import os
ROOT=os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','..','..'))
H=os.path.dirname(os.path.abspath(__file__))
M='/* ====== ПО ВСТРЕЧЕ 05.11'
j=open(ROOT+'/app/obojma.js',encoding='utf-8').read()
if M in j: j=j[:j.index(M)]+j[j.index('function renderRoles'):]
def rep(a,b):
    global j
    if b in j: return
    assert a in j,a[:60];j=j.replace(a,b,1)
rep(" {k:'dog',n:'Договоры',sub:[['contracts','Договоры и лимиты'],['contract','Карточка договора'],"," {k:'lead',n:'Лиды и тендеры',sub:[['leads','Лиды · B2G и B2B'],['lead','Карточка лида · РЭС']]},\n {k:'dog',n:'Договоры',sub:[['contracts','Договоры и лимиты'],['docgen','Договор из шаблона'],['contract','Карточка договора'],")
rep("['pick','Подбор по складам'],['funnel','Воронка исполнения']]}","['pick','Подбор по складам'],['funnel','Воронка исполнения'],['exec','Исполнение по накладным'],['costs','Расходы по договору']]}")
rep("['moves','Перемещения и межфирменные'],['purchase','Закуп · дефицит']]}","['moves','Перемещения и межфирменные'],['purchase','Закуп · дефицит'],['supply','Снабжение · сравнение и закуп']]}")
rep(" {k:'sys',n:'Система',sub:[['calendar','Календарь'],"," {k:'talk',n:'Общение',sub:[['chat','Мессенджер'],['feed','Лента'],['tasks','Задачи']]},\n {k:'sys',n:'Система',sub:[['calendar','Календарь'],['edo','Согласование по СМС · опция'],")
rep("s:['alerts','contracts','contract','specs','spec','clients','orders','order','pick','funnel','stock','catalog','receiv','calendar','mobile']}","s:['leads','lead','alerts','contracts','docgen','contract','specs','spec','clients','orders','order','pick','funnel','exec','costs','stock','catalog','receiv','chat','feed','tasks','calendar','mobile']}")
rep("s:['purchase','stock','catalog','orders','order','alerts']}","s:['purchase','supply','stock','catalog','orders','order','alerts','chat','feed','tasks']}")
rep("s:['funnel','order','stock','catalog','moves','mobile']}","s:['funnel','exec','order','stock','catalog','moves','chat','tasks','mobile']}")
rep("s:['realiz','receiv','moves','sync','mapping','contracts','contract']}","s:['realiz','receiv','costs','moves','sync','mapping','contracts','contract','chat','feed','tasks']}")
rep("s:['funnel','order','clients','mobile']}","s:['funnel','exec','costs','order','clients','chat','tasks','mobile']}")
rep("const TOUR=[\n","const TOUR=[\n ['leads','0 · Исток: лиды из тендеров (B2G) и холодных звонков (B2B) — как ваша воронка в Bitrix.'],\n ['lead','0 · Карточка лида: данные объявления и РЭС — стартовая, закупочная, ограничение по марже не менее 20%, цена для биржи.'],\n ['docgen','0 · Отыграли — договор собирается из лида по шаблону заказчика.'],\n ['exec','0 · Исполнение: накладные по регионам — резерв, сборка, ожидание отгрузки, в пути.'],\n ['supply','0 · Снабжение: дефицит → сравнительная таблица → счёт → забор груза → «заказ освоен».'],\n ['costs','0 · Расходы по договору: логистика, входной контроль, неустойки — итог по договору.'],\n")
ex=open(H+'/extra.js',encoding='utf-8').read()
j=j.replace('function renderRoles',ex+'\nfunction renderRoles',1)
open(ROOT+'/app/obojma.js','w',encoding='utf-8').write(j)
h=open(ROOT+'/app/obojma.html',encoding='utf-8').read()
CSS='/* kfpu-0511 */.pills{display:flex;gap:6px;flex-wrap:wrap}.lstp{display:flex;margin-bottom:12px;overflow-x:auto}.lstp a{flex:1;min-width:110px;padding:8px 10px 8px 18px;font-size:10.8px;background:var(--card3);color:var(--muted);cursor:pointer;clip-path:polygon(0 0,calc(100% - 9px) 0,100% 50%,calc(100% - 9px) 100%,0 100%,9px 50%);margin-right:-5px;white-space:nowrap}.lstp a.ok{background:var(--brandl);color:var(--text)}.lstp a.cur{background:var(--brand);color:#fff;font-weight:700}.docv{font-size:11.6px;line-height:1.6}.dvh{display:flex;justify-content:space-between;border-bottom:2px solid var(--text);padding-bottom:6px;margin-bottom:8px}.var{background:#fff3c4;color:#1b2229;padding:0 3px;border-radius:2px}.wrap{white-space:normal;text-align:right;max-width:64%}\n'
if '/* kfpu-0511 */' not in h: h=h.replace('</style>',CSS+'</style>',1)
open(ROOT+'/app/obojma.html','w',encoding='utf-8').write(h)
print('ok')
