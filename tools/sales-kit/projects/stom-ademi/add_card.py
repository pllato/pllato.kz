# -*- coding: utf-8 -*-
import os
ROOT=os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','..','..'))
p=os.path.join(ROOT,'app.html')
s=open(p,encoding='utf-8').read()
if 'data-app-id="stom_ademi"' in s: raise SystemExit('already')
links=[('dash','Пульт сети'),('money','Выручка и врачи'),('sched','Расписание по креслам'),('remind','Подтверждения записи в WhatsApp'),('inbox','Чаты и звонки'),('funnel','Воронка'),('patients','Пациенты и зубная формула'),('plan','Планы лечения'),('price','Прайсы'),('osms','Услуги по ОСМС'),('audit','Проверка кодов ОСМС'),('stock','Материалы'),('migr','Переход с MacDent'),('launch','Стоимость: 2 000 000 ₸')]
card='''      <div class="tool-card" data-app-id="stom_ademi" data-created="2026-10-28" data-updated="2026-10-28" data-crm-deal-id="deal_meta_4781811752102965" data-crm-deal-title="Адеми · сеть стоматологий">
        <div class="tool-icon" style="background:#0e3b4a;color:#5fd3c3;font-size:11px;font-weight:900;letter-spacing:.04em">СТМ</div>
        <h3>Сеть стоматологий: запись, WhatsApp-подтверждения, лечение, ОСМС, склад (Адеми · 4 филиала) — Демо + КП</h3>
        <p>Встреча с Адеми: 4 филиала, сейчас MacDent (оплачена годовая). Нужны ежедневные утренние подтверждения записи в WhatsApp, CRM с чатами и воронкой, склад, планы лечения и прайсы. Лечат детей и беременных по ОСМС — проверка за 2023–2025 нашла неверные коды, требование о возврате 14 млн; в ноябре полная проверка, старт — декабрь. Демо: 14 экранов, 5 ролей. КП: стандартный пакет 2 000 000 ₸, 4–6 недель, 200 000 / 900 000 / 900 000, до 6 филиалов, сотрудники без ограничений, 3 месяца сопровождения.</p>
        <a class="tool-cta as-link" href="app/stom-ademi.html">Открыть демо →</a>
        <details class="tool-dd"><summary>Материалы проекта</summary><div class="tool-dd-menu">
'''+''.join(f'          <a href="app/stom-ademi.html?s={k}" target="_blank" rel="noopener"><span class="dot"></span>{t}</a>\n' for k,t in links)+'''          <a href="app/kp-stom-ademi.html" target="_blank" rel="noopener"><span class="dot"></span>КП — веб-версия · 8 стр.</a>
          <a class="is-pdf" href="app/Pllato_KP_Stom.pdf" target="_blank" rel="noopener"><span class="dot"></span>КП · 2 000 000 ₸ · PDF 8 страниц</a>
        </div></details>
        <span class="tool-badge new">Старт в декабре</span>
      </div>

'''
a='      <div class="tool-card" data-app-id="obuv_mukhtar"'
assert s.count(a)==1; s=s.replace(a,card+a)
a='  { id: "obuv_mukhtar",'
assert a in s; s=s.replace(a,'  { id: "stom_ademi", label: "Сеть стоматологий (Адеми) — Демо + КП" },\n'+a)
open(p,'w',encoding='utf-8').write(s)
print('card ok')
