# -*- coding: utf-8 -*-
import os
ROOT=os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','..','..'))
p=os.path.join(ROOT,'app.html')
s=open(p,encoding='utf-8').read()
if 'data-app-id="blitz_murat"' in s: raise SystemExit('already')
links=[('dash','Пульт сети'),('clubs','Клубы и франшизы, роялти'),('fin','Финансы по клубам (как у Додо)'),('money','Деньги: 2 канала доходов, 3 расходов'),('bank','Выписки банков и 1С'),('inv','Кабинет инвестора'),('funnel','Воронка отдела продаж'),('members','Клиенты и абонементы'),('pos','Касса: ресепшн и бар'),('shop','Бар и склад'),('access','Турникеты по QR в 18 клубах'),('classes','Групповые занятия'),('trainer','Кабинет тренера'),('app','Мобильное приложение'),('core','Единое ядро и модули'),('launch','Стоимость: блок ≈ 2,5 млн')]
card='''      <div class="tool-card" data-app-id="blitz_murat" data-created="2026-10-22" data-updated="2026-10-22">
        <div class="tool-icon" style="background:#980017;color:#fff;font-size:11px;font-weight:900;letter-spacing:.04em">FB</div>
        <h3>FitnessBlitz · сеть из 18 фитнес-клубов (Мурат · Алматы) — Демо + КП</h3>
        <p>Встреча с Муратом: сеть FitnessBlitz, 18 клубов (франшизы, 4 в Алматы), «1 абонемент на всю сеть». Сейчас — TS Portal (местные разработчики, касса и учёт; часть кода потом заберут себе как продукт) и своё приложение. Запрос: <b>финансовый модуль как у Додо</b> — прозрачно и онлайн: доходы (касса/эквайринг, онлайн), расходы по трём каналам (безнал по выпискам, наличные из кассы, снятия со счёта для сотрудников с заблокированными картами), 1С и выписки банков, аналитика; <b>модуль для инвесторов</b>; плюс продажи и касса, бар/магазин со складом и инвентаризацией, <b>турникеты по QR во всех клубах</b>, мобильное приложение (эквайринг, рекуррентные платежи, запись на групповые), модуль тренеров (вес, питание, программы), позже геймификация. Платон: финансы отдельно делать нельзя — нужно единое ядро, модули к нему. Демо: 16 экранов, 5 ролей. КП: блоками по ≈ 2,5 млн ₸ и 4–6 недель (10/45/45), 4 блока + 1С ≈ 10,8 млн ₸. Следующая встреча — Мурат показывает текущий функционал.</p>
        <a class="tool-cta as-link" href="app/blitz-murat.html">Открыть демо →</a>
        <details class="tool-dd"><summary>Материалы проекта</summary><div class="tool-dd-menu">
'''+''.join(f'          <a href="app/blitz-murat.html?s={k}" target="_blank" rel="noopener"><span class="dot"></span>{t}</a>\n' for k,t in links)+'''          <a href="app/kp-blitz-murat.html" target="_blank" rel="noopener"><span class="dot"></span>КП — веб-версия · 10 стр.</a>
          <a class="is-pdf" href="app/Pllato_KP_FitnessBlitz.pdf" target="_blank" rel="noopener"><span class="dot"></span>КП · блоки по 2,5 млн ₸ · вся система ≈ 10,8 млн · PDF 10 страниц</a>
        </div></details>
        <span class="tool-badge new">Показ функционала клиента</span>
      </div>

'''
a='      <div class="tool-card" data-app-id="ptica_sergey"'
assert s.count(a)==1; s=s.replace(a,card+a)
a='  { id: "ptica_sergey",'
assert a in s; s=s.replace(a,'  { id: "blitz_murat", label: "FitnessBlitz · сеть фитнес-клубов (Мурат) — Демо + КП" },\n'+a)
open(p,'w',encoding='utf-8').write(s)
print('card ok')
