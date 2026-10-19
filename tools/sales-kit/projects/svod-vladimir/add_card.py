# -*- coding: utf-8 -*-
import os
ROOT=os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','..','..'))
p=os.path.join(ROOT,'app.html')
s=open(p,encoding='utf-8').read()
if 'data-app-id="vladimir_svod"' in s: raise SystemExit('already')
links=[('dash','Пульт руководителя'),('registry','Реестр документов и поиск'),('nav','Архив по папкам'),('doc','Карточка документа: маршрут, версии, след'),('newdoc','Новый документ'),('approve','Мои согласования'),('routes','Маршруты согласования'),('tasks','Поручения: исполнено, продлено, снято'),('control','Контроль исполнения'),('journals','Журналы регистрации'),('access','Права доступа — руководитель сам'),('audit','Журнал действий и ПДн'),('backup','Хранение и резервные копии'),('launch','Стоимость: 1,5 млн, 10/45/45')]
card='''      <div class="tool-card" data-app-id="vladimir_svod" data-created="2026-10-19" data-updated="2026-10-19">
        <div class="tool-icon" style="background:#173a3a;color:#d08442;font-size:11px;font-weight:900;letter-spacing:.04em">СЭД</div>
        <h3>СВОД · внутренний документооборот, производство кабеля (Владимир, Дмитрий) — Демо + КП</h3>
        <p>Встреча 19 октября: производитель электрокабельной продукции, на встрече — юрист Владимир (решения принимает директор по развитию Дмитрий). Нужен <b>внутренний документооборот</b>: архив документов с резервными копиями; создание документа с правами доступа, которые <b>руководитель задаёт сам через интерфейс</b>; <b>согласование с сохранением следов</b>; <b>поручения с отметками об исполнении, продлении, снятии</b>; виды — договоры, входящие и исходящие письма, приказы, протоколы, решения участника; поиск и путеводитель по папкам; защита ПДн через права (и чтобы это было видно); размещение на серверах компании; <b>код — собственность заказчика</b>, не коробка; обучение, пилот, прямая линия. До 50 пользователей (фактически около 20). Битрикс — негативный опыт (отключение при неоплате). 1С (обмен файлами) — второй этап, 800 000 ₸. Демо: 14 экранов, 5 ролей. КП: 1 500 000 ₸, 4–6 недель, 10/45/45 (150 000 / 675 000 / 675 000). Показ демо — вторник 20.10 в 12:00 с Дмитрием.</p>
        <a class="tool-cta as-link" href="app/svod-vladimir.html">Открыть демо →</a>
        <details class="tool-dd"><summary>Материалы проекта</summary><div class="tool-dd-menu">
'''+''.join(f'          <a href="app/svod-vladimir.html?s={k}" target="_blank" rel="noopener"><span class="dot"></span>{t}</a>\n' for k,t in links)+'''          <a href="app/kp-svod-vladimir.html" target="_blank" rel="noopener"><span class="dot"></span>КП — веб-версия · 10 стр.</a>
          <a class="is-pdf" href="app/Pllato_KP_Svod.pdf" target="_blank" rel="noopener"><span class="dot"></span>КП · 1 500 000 ₸ · 10/45/45 · PDF 10 страниц</a>
        </div></details>
        <span class="tool-badge new">Демо 20.10 12:00</span>
      </div>

'''
a='      <div class="tool-card" data-app-id="rauan_potok"'
assert s.count(a)==1; s=s.replace(a,card+a)
a='  { id: "rauan_potok",'
assert a in s; s=s.replace(a,'  { id: "vladimir_svod", label: "СВОД · документооборот, производство кабеля (Владимир) — Демо + КП" },\n'+a)
open(p,'w',encoding='utf-8').write(s)
print('card ok')
