import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DEMO_BUILD_STAGE_RE,INVOICE_BUILD_STAGE_RE} from './production-stages.js';
test('русские названия запускают правильный процесс',()=>{
 for(const name of ['Создание Демо','СОЗДАНИЕ ДЕМО','Готов к сбору демо','Готова к сборке демо','Демо создается'])assert.ok(DEMO_BUILD_STAGE_RE.test(name),name);
 for(const name of ['Показ Демо','Демо готово','Встреча назначена'])assert.ok(!DEMO_BUILD_STAGE_RE.test(name),name);
 for(const name of ['Создание счета','Создание счёта','Счета создаются'])assert.ok(INVOICE_BUILD_STAGE_RE.test(name),name);
 assert.ok(!INVOICE_BUILD_STAGE_RE.test('КП отправлено'));
});
