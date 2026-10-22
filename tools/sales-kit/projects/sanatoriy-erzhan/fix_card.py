# -*- coding: utf-8 -*-
# Переписывает карточку санатория в app.html: описание и ссылки на экраны
import os,re
ROOT=os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','..','..'))
p=os.path.join(ROOT,'app.html')
s=open(p,encoding='utf-8').read()
a=s.index('<div class="tool-card" data-app-id="sanatoriy_erzhan"')
b=s.index('<div class="tool-card" data-app-id="prokorm_nurzhan"')
blk=s[a:b]
links=[('dash','Пульт руководителя'),('report','Отчёты: заезды и выезды'),('chess','Шахматка номеров'),('guest','Карточка гостя и путёвка'),('contract','Договор при заезде'),('med','Пульт главного врача'),('prog','Программа и автораспределение'),('cabs','Кабинеты и расписание'),('nurse','Планшет медсестры'),('phone','Телефон пациента: подтверждение процедур'),('paid','Платные процедуры'),('food','Ресторан: сколько готовить'),('wfood','Склад продуктов по калькуляции'),('wmed','Медикаменты и расходники'),('whouse','Хозяйственный склад'),('hk','Хаускипинг'),('migrate','Вместо Shelter'),('launch','Стоимость: 2,5 млн ₸')]
i=blk.index('<div class="tool-icon"');j=blk.index('<a class="tool-cta')
blk=blk[:i]+'''<div class="tool-icon" style="background:#0f4a52;color:#fff;font-size:11px;font-weight:900;letter-spacing:.04em">СН</div>
        <h3>Санаторий: шахматка, медблок, ресторан, склады (Ержан) — Демо + КП</h3>
        <p>Встреча с Ержаном: санаторий, сейчас Shelter на локальном сервере (свет отключается — ошибки, свои хотелки не настроить). Главное — <b>шахматка номеров и медблок</b>: путёвки с программами, врач нажимает <b>автораспределение</b> процедур по дням и часам, 25–30 кабинетов, медсестра на два кабинета с планшетом, <b>пациент подтверждает процедуру с телефона</b> (против приписок), платные процедуры. Связь ресепшн → медблок (главврач видит заезды) → ресторан (сколько готовить, блюда вне меню). Склады: продукты по калькуляции, масло и расходники по процедурам, хозяйственный. Хаускипинг, договор при заезде, отчёты, до 50 пользователей. Демо: 18 экранов, 8 ролей. КП: 2,5 млн ₸, 4–6 недель, 10/45/45. Демо-встреча 22.10 в 18:00.</p>
        '''+blk[j:]
# ссылки на экраны
m0=blk.index('<div class="tool-dd-menu">')+len('<div class="tool-dd-menu">\n')
m1=blk.index('          <a href="app/kp-sanatoriy-erzhan.html"')
blk=blk[:m0]+''.join(f'          <a href="app/sanatoriy-erzhan.html?s={k}" target="_blank" rel="noopener"><span class="dot"></span>{t}</a>\n' for k,t in links)+blk[m1:]
blk=blk.replace('КП · 2,8 млн ₸ с 1С','КП · 2,5 млн ₸').replace('Демо 22.10','Демо 22.10 · 18:00')
s=s[:a]+blk+s[b:]
s=s.replace('{ id: "sanatoriy_erzhan", label: "Производство кормов (Нуржан) — Демо + КП" }','{ id: "sanatoriy_erzhan", label: "Санаторий (Ержан) — Демо + КП" }')
open(p,'w',encoding='utf-8').write(s)
print('fixed')
