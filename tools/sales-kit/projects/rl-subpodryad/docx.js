// node docx.js → app/obyazatelstvo-rl-subpodryad.docx (Word-версия формы СП-1, 1 лист A4)
const fs = require('fs'), path = require('path');
const { Document, Packer, Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType, TabStopType, LevelFormat } = require('docx');
const OUT = path.join(__dirname, '..', '..', '..', '..', 'app', 'obyazatelstvo-rl-subpodryad.docx');
const F = 'Times New Roman', SZ = 19; // 9.5 pt
const r = (t, o = {}) => new TextRun({ text: t, font: F, size: o.size || SZ, bold: o.b, italics: o.i, underline: o.u ? {} : undefined });
const P = (runs, o = {}) => new Paragraph({ alignment: o.al || AlignmentType.JUSTIFIED, spacing: { after: o.after ?? 50, before: o.before || 0, line: o.line || 245 }, indent: o.ind, keepNext: o.keep, children: Array.isArray(runs) ? runs : [r(runs, o)], tabStops: o.tabs, border: o.border, numbering: o.num });
const blank = n => '_'.repeat(n);
const none = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const thin = { style: BorderStyle.SINGLE, size: 4, color: '444444' };
const W = 9638; // ширина полосы: A4 11906 − поля 1134+1134

const kids = [];
// шапка
kids.push(new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [7400, 2238], borders: { top: none, left: none, right: none, bottom: { style: BorderStyle.SINGLE, size: 10, color: '111111' }, insideHorizontal: none, insideVertical: none },
  rows: [new TableRow({ children: [
    new TableCell({ width: { size: 7400, type: WidthType.DXA }, borders: { top: none, left: none, right: none, bottom: { style: BorderStyle.SINGLE, size: 10, color: '111111' } }, children: [P([r('ТОО «RL-system»', { b: true, size: 21 })], { al: AlignmentType.LEFT, after: 0 }), P([r('БИН 040340014374 · 050002, г. Алматы, Медеуский р-н, ул. Карамысова К, д. 84/2, корп. 1, кв. 55', { size: 17 })], { al: AlignmentType.LEFT, after: 40 })] }),
    new TableCell({ width: { size: 2238, type: WidthType.DXA }, borders: { top: none, left: none, right: none, bottom: { style: BorderStyle.SINGLE, size: 10, color: '111111' } }, children: [P([r('Форма СП-1', { size: 17 })], { al: AlignmentType.RIGHT, after: 0 }), P([r('№ ' + blank(12), { size: 17 })], { al: AlignmentType.RIGHT, after: 40 })] })] })] }));
kids.push(P([r('ОБЯЗАТЕЛЬСТВО СУБПОДРЯДЧИКА', { b: true, size: 25 })], { al: AlignmentType.CENTER, before: 120, after: 0 }));
kids.push(P([r('о добросовестном, полном и своевременном выполнении работ', { i: true })], { al: AlignmentType.CENTER, after: 100 }));
kids.push(P([r('г. Алматы\t«' + blank(4) + '» ' + blank(16) + ' 20' + blank(3) + ' г.')], { al: AlignmentType.LEFT, tabs: [{ type: TabStopType.RIGHT, position: W }], after: 90 }));
kids.push(P([r(blank(62) + ' '), r('(наименование / ФИО)', { size: 15 }), r(', ИИН/БИН ' + blank(22) + ', в лице ' + blank(34) + ', действующего на основании ' + blank(24) + ' (далее — «Субподрядчик»), выполняющий работы по заданию ТОО «RL-system», БИН 040340014374 (далее — «Генподрядчик»), настоящим в одностороннем порядке принимает на себя следующие обязательства по проекту:')], { al: AlignmentType.LEFT, line: 300, after: 80 }));
// таблица проекта
const K = 3300, V = W - K;
const row = (k, v = '') => new TableRow({ height: { value: 370, rule: 'atLeast' }, children: [
  new TableCell({ width: { size: K, type: WidthType.DXA }, shading: { type: ShadingType.CLEAR, fill: 'F2F2F0', color: 'auto' }, margins: { top: 40, bottom: 40, left: 100, right: 100 }, children: [P([r(k, { b: true, size: 18 })], { al: AlignmentType.LEFT, after: 0 })] }),
  new TableCell({ width: { size: V, type: WidthType.DXA }, margins: { top: 40, bottom: 40, left: 100, right: 100 }, children: [P([r(v, { size: 18 })], { al: AlignmentType.LEFT, after: 0 })] })] });
kids.push(new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [K, V], borders: { top: thin, bottom: thin, left: thin, right: thin, insideHorizontal: thin, insideVertical: thin },
  rows: [row('Проект / объект (адрес)'), row('Вид и объём работ'), row('Срок начала / окончания работ', 'с «' + blank(3) + '» ' + blank(12) + ' 20' + blank(3) + ' г.   по «' + blank(3) + '» ' + blank(12) + ' 20' + blank(3) + ' г.'), row('Стоимость работ, тенге'), row('Рабочий чат проекта (мессенджер, название)'), row('Ответственный от Генподрядчика')] }));
kids.push(P('', { after: 60 }));
// пункты 1–5
const items = [
  ['Работать добросовестно, «на совесть». ', 'Выполнять работы качественно, в соответствии с проектом, техническим заданием, строительными нормами и правилами Республики Казахстан и указаниями Генподрядчика, соблюдать технику безопасности и порядок на объекте.'],
  ['Выполнять все договорённости. ', 'Соблюдать условия, согласованные с Генподрядчиком в договоре, в настоящем Обязательстве и в рабочих чатах проекта (WhatsApp, Telegram и др.). Сообщения уполномоченных лиц Сторон в рабочем чате признаются письменной формой договорённостей и обязательны для исполнения наравне с договором.'],
  ['Завершить работы в срок и в полном объёме. ', 'Не прекращать и не приостанавливать работы и не покидать объект без письменного согласования с Генподрядчиком; о любых препятствиях сообщать в рабочий чат не позднее 24 часов с момента их возникновения.'],
  ['Устранять недостатки за свой счёт ', 'в срок, указанный Генподрядчиком; не передавать работы третьим лицам без согласия Генподрядчика.'],
  ['Недобросовестным исполнением ', 'признаются, в том числе: срыв сроков без уважительной причины; оставление объекта или отказ от продолжения работ; некачественное выполнение работ и неустранение недостатков в установленный срок; невыполнение договорённостей, зафиксированных в рабочем чате; привлечение третьих лиц без согласия Генподрядчика.']];
items.forEach((it, i) => kids.push(P([r((i + 1) + '. ' + it[0], { b: true }), r(it[1])], { ind: { left: 284, hanging: 284 }, after: 40 })));
// пункт 6 — штраф в рамке
const box = { style: BorderStyle.SINGLE, size: 12, color: '111111', space: 4 };
kids.push(P([r('6. В случае недобросовестного исполнения Субподрядчик обязуется уплатить Генподрядчику штраф в размере 3 000 000 (три миллиона) тенге в течение 10 (десяти) рабочих дней с даты письменного требования. Уплата штрафа не освобождает Субподрядчика от обязанности завершить работы в срок и в полном объёме, устранить недостатки и возместить причинённые убытки. Генподрядчик вправе удержать сумму штрафа из платежей, причитающихся Субподрядчику.', { b: true })], { border: { top: box, bottom: box, left: box, right: box }, before: 60, after: 90, ind: { left: 80, right: 80 } }));
kids.push(P('7. Настоящее Обязательство действует до полного завершения и приёмки работ, является неотъемлемой частью договора субподряда (при его наличии) и составлено в двух экземплярах. Споры разрешаются в суде по месту нахождения Генподрядчика в соответствии с законодательством Республики Казахстан. Субподрядчик подтверждает, что ознакомлен с Обязательством, понимает его последствия и подписывает его добровольно.', { after: 120 }));
// подписи
const L = 5200, R = W - L;
const sl = (t, n) => P([r(t + ' ' + blank(n), { size: 18 })], { al: AlignmentType.LEFT, after: 70 });
const cell = (w, ch) => new TableCell({ width: { size: w, type: WidthType.DXA }, borders: { top: none, bottom: none, left: none, right: none }, children: ch });
kids.push(new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [L, R], borders: { top: none, bottom: none, left: none, right: none, insideHorizontal: none, insideVertical: none },
  rows: [new TableRow({ children: [
    cell(L, [P([r('СУБПОДРЯДЧИК', { b: true })], { al: AlignmentType.LEFT, after: 70 }), sl('Наименование / ФИО', 32), sl('ИИН / БИН', 41), sl('Адрес', 46), sl('Телефон', 43), sl('ИИК, банк', 41), sl('Подпись ' + blank(18) + ' /', 22), P([r('М.П. (при наличии) · экземпляр получил', { size: 16 })], { al: AlignmentType.LEFT, after: 0 })]),
    cell(R, [P([r('ПРИНЯТО ГЕНПОДРЯДЧИКОМ', { b: true })], { al: AlignmentType.LEFT, after: 70 }), P([r('ТОО «RL-system»', { b: true, size: 18 })], { al: AlignmentType.LEFT, after: 0 }), P([r('БИН 040340014374', { size: 18 })], { al: AlignmentType.LEFT, after: 0 }), P([r('г. Алматы, Медеуский р-н, ул. Карамысова К, д. 84/2, корп. 1, кв. 55', { size: 18 })], { al: AlignmentType.LEFT, after: 110 }), sl('Руководитель', 28), sl('Подпись ' + blank(14) + ' /', 16), P([r('М.П.', { size: 16 })], { al: AlignmentType.LEFT, after: 0 })])] })] }));

const doc = new Document({ creator: 'ТОО «RL-system»', title: 'Обязательство субподрядчика',
  sections: [{ properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 680, bottom: 620, left: 1134, right: 1134 } } }, children: kids }] });
Packer.toBuffer(doc).then(b => { fs.writeFileSync(OUT, b); console.log('ok', OUT); });
