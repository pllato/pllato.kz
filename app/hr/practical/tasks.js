/* Shared task structure; no answer key or grading rules in the candidate bundle. */
export const tasks=[
 {title:'Боли клиента',minutes:10,hint:'Выпишите 5–7 проблем или желаний клиента. Для каждой — цитата его словами и что за ней стоит для бизнеса.',rows:7,cols:['Цитата клиента','Что за этим стоит']},
 {title:'Разделы портала',minutes:8,hint:'Какие разделы портала закрывают каждую боль из задания 1? Назовите раздел и одной фразой, что в нём происходит. Номера строк соответствуют болям из первого задания.',rows:7,cols:['Раздел портала','Что в нём происходит']},
 {title:'Пакет, опции, отказ',minutes:7,hint:'Разложите всё, что хочет клиент, по трём колонкам. Укажите сумму, которую назовёте клиенту в КП.',fields:['Входит в стандартный пакет','Отдельно, за доплату','Не берём / не наше','Сумма в КП, ₸','Условия оплаты']},
 {title:'Решение и следующий шаг',minutes:5,hint:'Ответьте коротко и конкретно, опираясь на встречу.',fields:['Кто принимает решение? Кто ещё влияет?','Какой следующий шаг, когда и в каком формате?','Что нужно отправить клиенту сегодня и что в этом документе обязательно?','Какой риск может сорвать сделку?']},
 {title:'Вопросы, которые не задали',minutes:10,hint:'На встрече не прозвучали важные вопросы. Напишите 5–7 вопросов, которые вы бы задали на демо, и зачем каждый.',rows:7,cols:['Вопрос клиенту','Зачем']}
];
export function emptyAnswers(){return tasks.map(t=>Array(t.rows?t.rows*2:t.fields.length).fill(''))}
export function completion(a){return tasks.map((t,i)=>{const v=a?.[i]||[];return t.rows?Array.from({length:7},(_,j)=>!!v[j*2]?.trim()&&!!v[j*2+1]?.trim()).filter(Boolean).length>=5:t.fields.every((_,j)=>!!v[j]?.trim())})}
export function cleanAnswers(a){if(!Array.isArray(a)||a.length!==5)throw Error('Неверный формат ответов');return tasks.map((t,i)=>{if(!Array.isArray(a[i])||a[i].length!==(t.rows?14:t.fields.length))throw Error('Неверный формат задания');return a[i].map(x=>{if(typeof x!=='string'||x.length>2000)throw Error('Каждое поле — не более 2000 символов');return x})})}
