# HANDOFF — Aminamed CRM × 1С: новый каталог и заказы (продолжение)

> Передача контекста для продолжения в новой сессии (репозитории
> `pllato/pllato-core-crm` — фронт, `pllato/pllato.kz` — воркер).

## Цель
Заказы из CRM должны брать товары/цены из **нового каталога** (новые коды) и
создавать документы в 1С **на новых карточках номенклатуры**. Замечания
бухгалтера (Асем) должны садиться: НДС, договор, адрес поставки, КПН, аналитика.

## Репозитории и деплой
- `pllato/pllato-core-crm` (private) — **источник кода CRM (фронт)**. Деплой →
  CF Pages `aminamed-crm` → `crm.aminamed.kz`. Форма заказа: `app/deal_items.js`.
  («pharmacy-crm» в старых коммитах — локальное/старое имя этого же репо.)
- `pllato/pllato.kz` (private) — зеркало `/crm/` + **воркер** `pllato-comm`
  (`crm/worker/worker.js`), деплой `cd crm/worker && wrangler deploy`.
- Правило: фронт правится в `pllato-core-crm` → sync в `pllato.kz/crm/`.
- Ветка работы в pllato.kz: `claude/practical-wright-22dxpo`.

## Инфраструктура / ID
- CF account `uurraa`, id `d0655e161d8fca8487f88d55c0eeb215`.
- Worker `pllato-comm` → https://pllato-comm.uurraa.workers.dev
- D1 `pllato-crm-d1`, id `dc9ebee7-7907-4b39-9148-c33717941a6c`, team_id=`pllato`.
- 1С:Фреш host `https://1cfresh.kz`. Базы:
  - Аминамед (ТОО): `/a/ea186/263825`, org `8678efaa-9684-4325-a198-7f3c8a1bc2f3`
  - Баймуханова (ИП): `/a/ea68/264980`
  - Алишерова (ИП): `/a/ea189/264981`
  - KZT `9e9a6ffb-aa56-11e1-b9c4-002215ba1bbe`; склад Аминамед
    `c4d32421-aa56-11e1-b9c4-002215ba1bbe`; ед.«шт» Аминамед
    `c4d3241f-aa56-11e1-b9c4-002215ba1bbe`.
- OData-креды хранятся в воркере (`one_c_settings`, шифрованы). Менять через
  страницу `GET /1c-setup` (вставить токен сессии из localStorage `pllato_session`).
  ⚠️ Личный пароль OData засветился в переписке — стоит сменить и завести
  отдельного технического пользователя 1С.

## СДЕЛАНО (бэкенд — живое, задеплоено)
1. Эндпоинты каталога (воркер):
   - `GET /api/crm/1c/nomenclature/catalog?base=&q=&priceListId=&sort=&onlyPriced=&onlyUnpriced=&offset=&limit=`
     → `{ items:[{ref,base,code,name,article,unit,stock,price}], total, counts:{all,priced,unpriced}, source }`.
     Отдаёт `catalog_approved_<base>` (ref=**новый код**, цена по `priceListId`,
     остаток=сумма серий из `catalog_lots_<base>`), фолбэк `nomenclature_1c_<base>`.
   - `POST /api/crm/1c/nomenclature/catalog/pull` — обновляет зеркало 1С
     `nomenclature_1c_<base>` (постранично + `$select` + паузы; защита от 402).
     Утверждённый каталог НЕ трогает.
   - `GET /api/crm/catalog/approved/lots?base=&code=` → `{ series:[{lot,srok,stock}] }`.
   - `GET /1c-setup` — страница смены пароля OData (без консоли).
2. В 1С созданы **706 карточек** номенклатуры (Вариант Б — «с нуля»):
   - Аминамед (ea186): **384**. Баймуханова (ea68): **322**.
   - «Код»=короткий (strip `NEW-`: `ТОО-0018`, `ИП-0169`), «Артикул»=полный
     (`NEW-ТОО-0018`), Вид=«Товары приобретённые», Группа=«Товары/Товар», ед.=шт.
3. Связь с 1С восстановлена (пароль обновлён; ping=719 коллекций).

## Данные в D1 (таблица `store`, team_id=`pllato`)
- `catalog_approved_<base>`: `{id=code(=новый код), code, oldCode, name, unit, stock, base}`.
  Аминамед 384, Баймуханова 322. ⚠️ `oldCode` (старый код 1С) **БИТЫЙ** — не
  соответствует реальной 1С, для документов НЕ использовать.
- `catalog_lots_<base>`: `{id=code, code, series:[{lot,srok,stock}]}`. Аминамед 150, Баймуханова 124.
- `nomenclature_1c_<base>`: зеркало 1С (фолбэк каталога).
- `price_lists` (6): `{name, prices:{ "<base>:<новый код>": цена }, priceMeta:{...} }`.
  **Ключ цены = `<base>:<новый код>`** (для approved-товаров `ref`=новый код).

## ОСТАЛОСЬ СДЕЛАТЬ
1. **Фронт** (`pllato-core-crm`, `app/deal_items.js`): форма заказа —
   - добавить **выбор прайс-листа**;
   - поиск товара переключить на `/api/crm/1c/nomenclature/catalog` (сейчас ищет
     по `warehouse_products` + `/api/crm/1c/nomenclature/search`);
   - **автоцена** из `item.price`; строка заказа несёт идентификатор товара.
2. **Бэкенд** (воркер, `create1cSalesDocument`): при создании счёта/реализации/СФ
   резолвить товар строки (новый код / `ref` из каталога) → **Ref_Key карточки 1С
   по «Артикул»** (Catalog_Номенклатура, Артикул=новый код). Опц.: сохранить
   Ref_Key в `catalog_approved` (связка), чтобы не резолвить каждый раз.
3. **Бэкенд**: доделать вкладку «Каталог» (сейчас 404):
   - `POST /api/crm/catalog/approved/receipt` {base,code,lot,srok,qty} → апдейт `catalog_lots_<base>`;
   - `POST /api/crm/catalog/approved/update`, `/delete` {base,codes:[]}, `/import` {base,items,replace}.
   Контракты — в `app/deal_items.js` фронта.
4. **Остатки/себестоимость в 1С** — отдельно, нужны закупочные цены (Асем). База
   разрешает списание без остатка (реализация проводится, себестоимость 0).

## Реализации замечаний Асем (в worker.js — для документов)
- НДС: `lineVatSum()` (`integrations/1c/mapper.js`) — НДС берётся из строки заказа
  (`vatRateRef`), формула «в т.ч.». VAT-refs: 0% `c4d32414-…`, 12% `2aac9ae8-…`, 5% `34dffed7-…`.
- Договор/адрес: `oneCContractorPrimaryContract()` / `oneCContractorAddress()`.
- КПН + аналитика (реализация, только Аминамед): `ONE_C_AMINAMED_REAL_LINE_ACCOUNTS`
  + `УчитыватьКПН=true` + `СубконтоДоходовНУ2`=номенклатура строки.

## Гочи (важно)
- 1С «Код» = макс **11 символов** → полный код в «Артикул», короткий в «Код».
- В этой 1С `$filter` ломается; `$select`/`$orderby`/`$skip` работают; у
  `Catalog_Номенклатура` поля `ЕдиницаИзмерения_Key` НЕТ (есть
  `БазоваяЕдиницаИзмерения_Key`) — иначе 400.
- 1С:Фреш отдаёт **402** при тяжёлых/частых запросах (лимит сеансов) — тянуть
  постранично с паузами, не спамить.
- `oldCode` в `catalog_approved` — битый; матчить по «Артикул» новых карточек.

## Тестовые документы в 1С (можно удалить)
- Аминамед: Счёт №379 (проведён), Реализация №530 (проведена) на новых карточках;
  возможно остались черновики 378/529/524. **706 карточек — НЕ удалять.**

## Доступы для новой сессии
- CF API-токен с правом **Workers Scripts Edit** (для `wrangler deploy` воркера,
  аккаунт `uurraa` `d0655e161d…`).
- CF API-токен с правом **D1 Edit** (для чтения каталога из D1; даёт pllato).
- GitHub-доступ Claude-приложения к **обоим** репо (приватные).
