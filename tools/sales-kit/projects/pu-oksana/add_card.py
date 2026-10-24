# -*- coding: utf-8 -*-
import os
ROOT=os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','..','..'))
p=os.path.join(ROOT,'app.html')
s=open(p,encoding='utf-8').read()
if 'data-app-id="pu_oksana"' in s: raise SystemExit('already')
links=[('dash','Пульт РОПа'),('ads','Источники и реклама'),('kpi','KPI менеджеров'),('inbox','Все обращения: WhatsApp, звонки, сайт'),('funnel','Воронка заказа'),('calc','Расчёт по чертежу'),('docs','КП, счёт, договор в WhatsApp'),('clients','Клиенты'),('prod','Заказы в производстве'),('molds','Пресс-формы'),('raw','Склад сырья'),('fg','Готовая продукция и отгрузки'),('onec','1С — позже'),('launch','Стоимость: 1,5 млн ₸')]
card='''      <div class="tool-card" data-app-id="pu_oksana" data-created="2026-10-24" data-updated="2026-10-24" data-crm-deal-id="deal_meta_954204780745681" data-transcript-id="zoom:4b9eaaa8-ca1d-4070-a90a-9e05e4ddeb13" data-crm-deal-title="Оксана (РОП) · Александр Шин · изделия из полиуретана">
        <div class="tool-icon" style="background:#1e2228;color:#ff9a3c;font-size:11px;font-weight:900;letter-spacing:.04em">ПУ</div>
        <h3>Изделия из полиуретана: CRM, расчёт по чертежу, производство (Оксана РОП · Александр Шин) — Демо + КП</h3>
        <p>Встреча с Оксаной (РОП) 23.10: производство изделий из полиуретана под заказ — втулки, сайлентблоки, ходовая часть, футеровка. Реклама в Instagram и Google. Один менеджер, ищут ещё двоих, в системе 4–5 человек. Рассматривали Битрикс (тяжёлый) и amoCRM. Запрос: <b>лиды из платформ и сайтов сразу к менеджеру</b>, обязательно <b>WhatsApp и телефония</b> — цену дают только после фото, чертежей, размеров; нравятся <b>КП, счета, договоры</b> из системы. Платон предложил стандартный пакет со складами и производством. Демо: 16 экранов, 5 ролей. КП: 1 500 000 ₸, 4–6 недель, 150 000 / 675 000 / 675 000; 1С позже — 800 000 ₸. Встреча с директором и демо — вторник 27.10.</p>
        <a class="tool-cta as-link" href="app/pu-oksana.html">Открыть демо →</a>
        <details class="tool-dd"><summary>Материалы проекта</summary><div class="tool-dd-menu">
'''+''.join(f'          <a href="app/pu-oksana.html?s={k}" target="_blank" rel="noopener"><span class="dot"></span>{t}</a>\n' for k,t in links)+'''          <a href="app/kp-pu-oksana.html" target="_blank" rel="noopener"><span class="dot"></span>КП — веб-версия · 8 стр.</a>
          <a class="is-pdf" href="app/Pllato_KP_Poliuretan.pdf" target="_blank" rel="noopener"><span class="dot"></span>КП · стандартный пакет 1,5 млн ₸ · по этапам · PDF 8 страниц</a>
        </div></details>
        <span class="tool-badge new">Демо 27.10</span>
      </div>

'''
a='      <div class="tool-card" data-app-id="otchety_aleksandr"'
assert s.count(a)==1; s=s.replace(a,card+a)
a='  { id: "otchety_aleksandr",'
assert a in s; s=s.replace(a,'  { id: "pu_oksana", label: "Изделия из полиуретана (Оксана) — Демо + КП" },\n'+a)
open(p,'w',encoding='utf-8').write(s)
print('card ok')
