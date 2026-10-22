# -*- coding: utf-8 -*-
import os
ROOT=os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','..','..'))
p=os.path.join(ROOT,'app.html')
s=open(p,encoding='utf-8').read()
if 'data-app-id="prokorm_nurzhan"' in s: raise SystemExit('already')
links=[('dash','Пульт собственника'),('cash','Движение денег'),('orders','Заказы: дилеры, Kaspi, Halyk, прямые'),('abc','ABC-анализ продаж'),('dealer','Кабинет дилера'),('mp','Kaspi Магазин и Halyk Market'),('ar','Дебиторка и кредиторка'),('consign','Консигнация'),('raw','Склад сырья'),('prod','Производство партий'),('fg','Склад готовой продукции'),('inv','Инвентаризация'),('logi','Рейсы и водители'),('onec','Обмен с 1С'),('migrate','Вместо МойСклад и Битрикс'),('launch','Стоимость: 2 млн + 1С 800 тыс.')]
card='''      <div class="tool-card" data-app-id="prokorm_nurzhan" data-created="2026-10-22" data-updated="2026-10-22" data-crm-deal-id="deal_meta_2315651865863130" data-transcript-id="zoom:fb802205-0d85-48b7-920b-3f146e8f78d5">
        <div class="tool-icon" style="background:#23402f;color:#fff;font-size:11px;font-weight:900;letter-spacing:.04em">ПК</div>
        <h3>Производство кормов для животных (Нуржан) — Демо + КП</h3>
        <p>Встреча с Нуржаном: производство кормов для собак и кошек, продажи через дилеров, Kaspi Магазин, Halyk Market и напрямую. Сейчас — МойСклад (основное), Битрикс и 1С, приходится прыгать между программами. Запрос: <b>всё в одном месте с дашбордами</b>, видеть <b>кто нам должен и кому должны мы</b> со сроками, <b>консигнацию с датой закрытия</b>, заявки на водителей, доступ с телефона. Демо «ПРОКОРМ»: 16 экранов, 6 ролей (собственник, финдиректор, менеджер, склад и производство, дилер, водитель). КП: 2 000 000 ₸ + обмен с 1С 800 000 ₸ = 2,8 млн ₸, 4–6 недель, 10/45/45, 3 месяца сопровождения.</p>
        <a class="tool-cta as-link" href="app/prokorm-nurzhan.html">Открыть демо →</a>
        <details class="tool-dd"><summary>Материалы проекта</summary><div class="tool-dd-menu">
'''+''.join(f'          <a href="app/prokorm-nurzhan.html?s={k}" target="_blank" rel="noopener"><span class="dot"></span>{t}</a>\n' for k,t in links)+'''          <a href="app/kp-prokorm-nurzhan.html" target="_blank" rel="noopener"><span class="dot"></span>КП — веб-версия · 10 стр.</a>
          <a class="is-pdf" href="app/Pllato_KP_Prokorm.pdf" target="_blank" rel="noopener"><span class="dot"></span>КП · 2,8 млн ₸ с 1С · PDF 10 страниц</a>
        </div></details>
        <span class="tool-badge new">Демо 22.10</span>
      </div>

'''
a='      <div class="tool-card" data-app-id="blitz_murat"'
assert s.count(a)==1; s=s.replace(a,card+a)
a='  { id: "blitz_murat",'
assert a in s; s=s.replace(a,'  { id: "prokorm_nurzhan", label: "Производство кормов (Нуржан) — Демо + КП" },\n'+a)
open(p,'w',encoding='utf-8').write(s)
print('card ok')
