# -*- coding: utf-8 -*-
import os
ROOT=os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','..','..'))
p=os.path.join(ROOT,'app.html')
s=open(p,encoding='utf-8').read()
if 'data-app-id="myaso_vitaliy"' in s: raise SystemExit('already')
links=[('dash','Пульт собственника'),('flow','Путь продукции'),('orders','Все заявки: МОБИЭС, операторы, оптовики'),('req','Заявка на производство — считается сама'),('sku','Номенклатура без пересортов'),('wh','Остатки: ГП, в пути, реализация'),('transit','Рейсы с производства'),('shelf','Сроки хранения партий (≤ 5 дней)'),('inv','Инвентаризация и пересорт'),('plan','План выпуска по сменам'),('prod','Цех: готово → на склад'),('tp','Торговый представитель'),('funnel','Оптовики и дистрибьюторы'),('debt','Дебиторка'),('integr','1С и МОБИЭС'),('launch','Стоимость: 2 млн + 800 тыс.')]
card='''      <div class="tool-card" data-app-id="myaso_vitaliy" data-created="2026-10-26" data-updated="2026-10-26" data-crm-deal-id="deal_local_1on7ylod" data-crm-deal-title="Виталий · мясоперерабатывающее производство · Щучинск">
        <div class="tool-icon" style="background:#4a1418;color:#f0b44c;font-size:11px;font-weight:900;letter-spacing:.04em">МК</div>
        <h3>Мясокомбинат: заявка на производство, склады, сроки партий (Виталий · Щучинск) — Демо + КП</h3>
        <p>Встреча с Виталием (Zoom, запись и транскрипция TurboScribe): мясоперерабатывающее производство, колбасные изделия, Щучинск, Акмолинская обл. Сейчас 1С + МОБИЭС: торговые собирают заявки в МОБИЭС, оптовики и дистрибьюторы — через оператора. Боль: <b>некорректная заявка со склада реализации на производство</b> — пересорты между похожими номенклатурами (варёная говяжья: батон / штучная / «Народная»), продукция в машине ещё не посажена на склад (2–3 рейса в день), остатки «с пальца»; по заявке — продукция не должна лежать на складах дольше 5 дней. МОБИЭС убрать нельзя — интегрируемся. Платон: свой портал с первичкой, 1С — бухгалтерия, веб-доступ торговым. Демо: 18 экранов, 6 ролей. КП: стандартный пакет 2 000 000 ₸ + интеграции 1С и МОБИЭС 800 000 ₸ = 2,8 млн ₸, 4–6 недель, 10/45/45. Следующий шаг — Zoom с торговой командой и складом.</p>
        <a class="tool-cta as-link" href="app/myaso-vitaliy.html">Открыть демо →</a>
        <details class="tool-dd"><summary>Материалы проекта</summary><div class="tool-dd-menu">
'''+''.join(f'          <a href="app/myaso-vitaliy.html?s={k}" target="_blank" rel="noopener"><span class="dot"></span>{t}</a>\n' for k,t in links)+'''          <a href="app/kp-myaso-vitaliy.html" target="_blank" rel="noopener"><span class="dot"></span>КП — веб-версия · 7 стр.</a>
          <a class="is-pdf" href="app/Pllato_KP_Myasokombinat.pdf" target="_blank" rel="noopener"><span class="dot"></span>КП · 2 млн + 1С и МОБИЭС 800 тыс. · 2,8 млн ₸ · PDF 7 страниц</a>
        </div></details>
        <span class="tool-badge new">Zoom с командой</span>
      </div>

'''
a='      <div class="tool-card" data-app-id="pu_oksana"'
assert s.count(a)==1; s=s.replace(a,card+a)
a='  { id: "pu_oksana",'
assert a in s; s=s.replace(a,'  { id: "myaso_vitaliy", label: "Мясокомбинат (Виталий) — Демо + КП" },\n'+a)
open(p,'w',encoding='utf-8').write(s)
print('card ok')
