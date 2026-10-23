# -*- coding: utf-8 -*-
# Карточка FitnessBlitz после второй встречи 22.10: новая стоимость, сделка CRM, новые экраны
import io,os
ROOT=os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','..','..'))
p=os.path.join(ROOT,'app.html');s=io.open(p,encoding='utf-8').read()
a=s.index('<div class="tool-card" data-app-id="blitz_murat"');b=s.index('</div></details>',a)
c=s[a:b]
head=c[:c.index('>')+1]
if 'data-crm-deal-id' not in head:
    c=c.replace('data-app-id="blitz_murat"','data-app-id="blitz_murat" data-crm-deal-id="deal_meta_1642763600905992" data-transcript-id="zoom:752556fb-02a2-4416-84ea-fbf3adf6ea09"',1)
c=c.replace('data-updated="2026-10-22"','data-updated="2026-10-23"')
c=c.replace('Демо: 16 экранов, 5 ролей. КП: блоками по ≈ 2,5 млн ₸ и 4–6 недель (10/45/45), 4 блока + 1С ≈ 10,8 млн ₸. Следующая встреча — Мурат показывает текущий функционал.',
 'Вторая встреча 22.10 (Мурат и операционный менеджер Минарис показали TS Portal): объединяем продажи и управление клубом в одно окно, 1С убираем — выписки Kaspi и Halyk. Добавлено в демо: взаиморасчёты между клубами (гостевые визиты, зачёт), загрузка клубов, воронки от событий клуба, абонемент (заморозка, возврат, передача), LTV и доходность (продажи минус возвраты), касса без двойных чеков, ваши данные и бэкапы. Демо: 22 экрана, 5 ролей. КП обновлено: этап 1 (ядро, финансы, продажи, клуб, веб-кабинет клиента) — 3 млн ₸ (300 000 / 1 350 000 / 1 350 000), этап 2 (приложение, тренеры, геймификация) — 3,5 млн ₸; итого 6,5 млн вместо 10,8. Мурат обсуждает с шефом, затем живая встреча.')
assert '6,5 млн вместо 10,8' in c, 'описание не найдено'
c=c.replace('КП · блоки по 2,5 млн ₸ · вся система ≈ 10,8 млн · PDF 10 страниц','КП · этап 1 — 3 млн, этап 2 — 3,5 млн · 6,5 млн ₸ · PDF 13 страниц')
c=c.replace('КП — веб-версия · 10 стр.','КП — веб-версия · 13 стр.')
c=c.replace('<span class="dot"></span>Выписки банков и 1С</a>','<span class="dot"></span>Выписки Kaspi и Halyk</a>')
c=c.replace('<span class="dot"></span>Единое ядро и модули</a>','<span class="dot"></span>Одно окно и два этапа</a>')
c=c.replace('<span class="dot"></span>Стоимость: блок ≈ 2,5 млн</a>','<span class="dot"></span>Стоимость: 3 + 3,5 = 6,5 млн ₸</a>')
new=[('mutual','Взаиморасчёты между клубами'),('load','Загрузка клубов'),('triggers','Воронки от событий клуба'),('sub','Абонемент: заморозка, возврат, передача'),('ltv','LTV и доходность'),('data','Ваши данные и резервные копии')]
if 'blitz-murat.html?s=mutual' not in c:
    k=c.index('<a href="app/kp-blitz-murat.html"')
    k=c.rindex('\n',0,k)+1
    c=c[:k]+''.join(f'          <a href="app/blitz-murat.html?s={x}" target="_blank" rel="noopener"><span class="dot"></span>{t}</a>\n' for x,t in new)+c[k:]
s=s[:a]+c+s[b:]
io.open(p,'w',encoding='utf-8').write(s)
print('ok')
