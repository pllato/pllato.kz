/* ELC — контент 7 уроков (по уровням placement-теста).
   Слова берутся из словаря ELC (dict-words.js, Урок 1 курса). Тема, чтение и спикинг
   подобраны под эти слова + грамматику уровня (из теста). Грамматика = то, что мерит placement-тест.

   grammar.table — мини-таблица-шпаргалка: строки {rule, form, example} связывают
   темы уровня в один мини-урок. grammar.examples — 5 примеров на уровень. */

window.ELC_LEVELS = [
  { n:1, name:'Beginner 1',             cefr:'A1'  },
  { n:2, name:'Beginner 2',             cefr:'A1'  },
  { n:3, name:'Elementary',             cefr:'A2'  },
  { n:4, name:'Pre-Intermediate',       cefr:'B1'  },
  { n:5, name:'Intermediate',           cefr:'B1+' },
  { n:6, name:'Upper-Intermediate 2.0', cefr:'B2'  },
  { n:7, name:'Upper-Intermediate 3.0', cefr:'B2+' },
];

window.ELC_LESSONS = {
  1: {
    theme: 'Greetings · Приветствия',
    grammar: {
      title: 'to be (am/is/are), артикли a/an, this/these',
      form: 'I am · he/she is · we/you/they are · a friend · This is… / These are…',
      table: [
        { rule:'to be', form:'I am · he/she is · we/you/they are', example:'I am a student.' },
        { rule:'a / an', form:'a + согласная · an + гласная', example:'She has an orange.' },
        { rule:'this / these', form:'this = один · these = много', example:'This is my friend.' },
      ],
      examples: ['I am fine, thank you.', 'This is my friend Tom.', 'We are happy today.', 'She has an orange.', 'These are my books.'],
      test: [
        { q:'I ___ a teacher.',   o:['am','is','are','be'], a:0 },
        { q:'This ___ my book.',  o:['is','are','am','do'], a:0 },
        { q:'She has ___ orange.',o:['an','a','the','some'],a:0 },
        { q:'They ___ my friends.',o:['are','is','am','be'],a:0 },
      ],
    },
    words: [],
    reading: {
      text: 'It is Anna’s first day at ELC. In the morning she meets her teacher. "Hello! Good morning! How are you?" "I am fine, thank you. And you?" "Very well!" Then a boy comes in. "This is Tom. He is your partner." "Nice to meet you, Tom!" "Nice to meet you too!" The class is nice and friendly, and Anna is happy. At the end she says, "Ok, thanks! Goodbye!"',
      q: ['Where is Anna on her first day?', 'Who is Tom?', 'How does Anna feel about the class?'],
    },
    speaking: {
      task: 'Поздоровайся с преподавателем и партнёром: спроси «How are you?», ответь, представь друга, попрощайся. Используй слова урока.',
      opory: ['Hello! Good morning!', 'How are you? — Fine, thanks!', 'This is my friend.', 'Nice to meet you!', 'Ok, goodbye!'],
    },
  },

  2: {
    theme: 'Months & dates · Месяцы и даты',
    grammar: {
      title: 'Present Simple, there is/are, was/were',
      form: 'There are twelve months · My birthday is in May · Yesterday was…',
      table: [
        { rule:'Present Simple', form:'do/does + V · he goes', example:'He goes to school every day.' },
        { rule:'there is / are', form:'there is (1) · there are (много)', example:'There are twelve months.' },
        { rule:'was / were', form:'I/he/she was · we/you/they were', example:'Yesterday was cold.' },
      ],
      examples: ['There are twelve months in a year.', 'My birthday is in May.', 'He goes to school every day.', 'Is there a bank near here?', 'Last year I was in London.'],
      test: [
        { q:'___ you like coffee?',        o:['Do','Does','Are','Is'], a:0 },
        { q:'He ___ to school every day.', o:['goes','go','is going','went'], a:0 },
        { q:'___ there a bank near here?', o:['Is','Are','Do','Has'], a:0 },
        { q:'I ___ swim very well.',       o:['can','am','do','have'], a:0 },
      ],
    },
    words: [],
    reading: {
      text: 'There are twelve months in a year, and every month is special for someone. My favourite month is May, because the weather is warm and my birthday is in May too. In winter, in December, there is snow and a big holiday. Last year I was in London in December — it was cold but beautiful. Yesterday I looked at the calendar and saw that summer is near again.',
      q: ['How many months are there in a year?', 'Why does the writer like May?', 'Where was the writer last year in December?'],
    },
    speaking: {
      task: 'Назови месяцы по порядку. Скажи свой любимый месяц и когда твой день рождения. Используй слова урока.',
      opory: ['There are twelve months of the year.', 'My favourite month is…', 'Yesterday was…', 'Last year I was…'],
    },
  },

  3: {
    theme: 'Countries & languages · Страны и языки',
    grammar: {
      title: 'Past Simple, сравнительная степень, артикль a/an',
      form: '-ed / was–were · a country, an international job · bigger than',
      table: [
        { rule:'Past Simple', form:'V-ed · went / had / saw', example:'Last year I had a job.' },
        { rule:'Comparative', form:'-er / more … than', example:'Learning was harder than work.' },
        { rule:'a / an', form:'a job · an international job', example:'I had an international job.' },
      ],
      examples: ['Last year I travelled to many countries.', 'I had an international job.', 'Learning a language was harder than my old job.', 'France is bigger than Italy.', 'Every morning I read a newspaper.'],
      test: [
        { q:'Yesterday we ___ to the cinema.', o:['went','go','have gone','were going'], a:0 },
        { q:'She is ___ than her sister.',     o:['taller','more tall','tallest','tall'], a:0 },
        { q:'Listen! The baby ___.',           o:['is crying','cries','cry','cried'], a:0 },
        { q:'I have ___ been to Paris.',       o:['never','ever','yet','already'], a:0 },
      ],
    },
    words: [],
    reading: {
      text: 'Last year I had an international job, and I travelled to many countries. France, Germany, Italy and Japan all have a different language and culture. For me, learning a new language was harder than my old job, but much more interesting. Every morning I read a newspaper and wrote a short letter to my family. My English is not bad now, because I practise every day. People often ask me, "Can you spell your name?" — and I always can.',
      q: ['What kind of job did the writer have last year?', 'Was learning a language easier or harder than the old job?', 'Why is the writer’s English not bad now?'],
    },
    speaking: {
      task: 'Расскажи про страны и языки: какие страны знаешь, какой язык учишь, была ли у тебя работа. Используй слова урока.',
      opory: ['… is a country.', 'Every country has a language.', 'Last year I had a job.', 'My English is not bad, because…'],
    },
  },

  4: {
    theme: 'Meeting people · Знакомство и вежливость',
    grammar: {
      title: 'Present Perfect, 1st conditional, quantifiers',
      form: 'I have met… · We have a lot in common · If you…, I will…',
      table: [
        { rule:'Present Perfect', form:'have/has + V3', example:'I have met a new friend.' },
        { rule:'1st conditional', form:'If + Present, will + V', example:'If you smile, you will find friends.' },
        { rule:'Quantifiers', form:'much / many / a lot of', example:'We have a lot in common.' },
      ],
      examples: ['I have already met some interesting people.', 'Have you ever been to this café?', 'If it rains, we will stay at home.', 'If you are sad, cheer up!', 'There isn’t much milk, but we have a lot of coffee.'],
      test: [
        { q:'If it rains, we ___ at home.',  o:['will stay','stay','stayed','would stay'], a:0 },
        { q:'I ___ here since 2015.',        o:['have lived','live','lived','am living'], a:0 },
        { q:'While I ___, the phone rang.',  o:['was cooking','cooked','cook','have cooked'], a:0 },
        { q:'There isn’t ___ milk in the fridge.', o:['much','many','a lot','few'], a:0 },
      ],
    },
    words: [],
    reading: {
      text: 'I have just moved to a big, cosmopolitan city, and I have already met some interesting people. Yesterday I met an attractive couple at a café; we have a lot in common and talked for hours. "Pleased to meet you!" "My pleasure!" They invited me to dinner, but I said, "Thank you so much, but I can’t come tonight. Perhaps another time?" "Of course. Have a good weekend!" Making friends in a new city is not easy, but if you smile and stay open, you will find your people. So never mind the bad days — cheer up!',
      q: ['Where has the writer just moved?', 'Why couldn’t the writer come to dinner?', 'What advice does the writer give about making friends?'],
    },
    speaking: {
      task: 'Познакомься вежливо: поприветствуй пару, скажи что у вас много общего, вежливо откажись от встречи, пожелай хороших выходных. Используй слова урока.',
      opory: ['I have met…', 'We have a lot in common.', 'Pleased to meet you! — My pleasure!', 'I can’t come tonight. Perhaps another time.'],
    },
  },

  5: {
    theme: 'Busy city life · Жизнь в большом городе',
    grammar: {
      title: '2nd conditional, used to, Present Perfect Continuous',
      form: 'If I had…, I would… · I used to… · everything costs a fortune',
      table: [
        { rule:'2nd conditional', form:'If + Past, would + V', example:'If I had time, I would relax.' },
        { rule:'used to', form:'used to + V (прошлая привычка)', example:'I used to have more free time.' },
        { rule:'Present Perfect Cont.', form:'have been + V-ing', example:'I have been waiting for an hour.' },
      ],
      examples: ['If I had more time, I would leave the city.', 'If I were rich, I would travel a lot.', 'I used to play tennis when I was young.', 'I have been waiting for an hour.', 'Everything costs a fortune here.'],
      test: [
        { q:'If I ___ rich, I would travel a lot.', o:['were','am','was being','will be'], a:0 },
        { q:'I ___ for an hour and I’m still waiting.', o:['have been waiting','have waited','am waiting','wait'], a:0 },
        { q:'When I arrived, the film ___ already started.', o:['had','has','was','did'], a:0 },
        { q:'I ___ play tennis when I was young.', o:['used to','use to','am used to','was used to'], a:0 },
      ],
    },
    words: [],
    reading: {
      text: 'My life in the city is hectic. I have a well-paid job, but everything costs a fortune and I always get stuck in traffic. I used to have much more free time when I was a student. Now my friends and I only text each other: "Hurry up, we’re late!" "Hang on a sec!" "What about a bit later?" Yesterday I saw a gorgeous celebrity in an advert for a quiet island, and I thought: if I had more time and money, I would leave the city and take better care of myself. Sometimes the noise is too much — but I can’t stand boredom either, so here I stay.',
      q: ['Why is the writer’s life hectic?', 'What did the writer use to have more of?', 'What would the writer do if they had more time and money?'],
    },
    speaking: {
      task: 'Расскажи о жизни в большом городе: работа, пробки, дорого ли всё. Добавь 2nd conditional: If I had…, I would… Используй слова урока.',
      opory: ['My life is hectic.', 'Everything costs a fortune.', 'I get stuck in traffic.', 'If I had more time, I would…'],
    },
  },

  6: {
    theme: 'Jobs & money · Работа и деньги',
    grammar: {
      title: 'Пассивный залог, 3rd conditional, модальные предположения',
      form: 'was planned / was paid · If I had…, I would have… · must be',
      table: [
        { rule:'Passive', form:'be + V3 (by …)', example:'The budget was planned by the manager.' },
        { rule:'3rd conditional', form:'If + Past Perfect, would have + V3', example:'If I had saved, I wouldn’t have worried.' },
        { rule:'Модальные предположения', form:'must / can’t + be / have V3', example:'You must be tired.' },
      ],
      examples: ['The whole budget was planned by the manager.', 'A small fee was paid at the end of the month.', 'If I had stayed, I would have wasted years.', 'She isn’t answering — she must have left.', 'The report must be finished today.'],
      test: [
        { q:'If he had studied, he ___ the exam.', o:['would have passed','would pass','passed','will pass'], a:0 },
        { q:'The bridge ___ in 1995.',             o:['was built','built','has built','is building'], a:0 },
        { q:'You’ve worked all day — you ___ be tired.', o:['must','can','should','would'], a:0 },
        { q:'The woman ___ bag was stolen called the police.', o:['whose','who','which','that'], a:0 },
      ],
    },
    words: [],
    reading: {
      text: 'My first job was monotonous, repetitive and tedious — the same tasks were done every single day. The whole budget was planned by the manager, and only a small fee was paid to us at the end of the month. I tried to save, but my savings were always spent too quickly. One day I made a mistake and I was fined; a week later I was sacked. Looking back, it was a blessing. If I had stayed in that boring job, I would have wasted years of my life. Now I run my own small business — the money is not guaranteed, but at last the work has meaning.',
      q: ['How was the writer’s first job?', 'What two things happened to the writer there?', 'What would have happened if the writer had stayed in that job?'],
    },
    speaking: {
      task: 'Опиши скучную работу и деньги в пассиве (The job was…, A fee was paid…) и добавь 3rd conditional (If I had…, I would have…). Используй слова урока.',
      opory: ['The job was monotonous and tedious.', 'The budget was planned by…', 'I was sacked.', 'If I had saved…, I wouldn’t have…'],
    },
  },

  7: {
    theme: 'Casual talk & travel · Неформальная речь и путешествия',
    grammar: {
      title: 'Инверсия, wish/regret, used to',
      form: 'Never had I seen… · I wish I could… · We used to hang out…',
      table: [
        { rule:'Инверсия', form:'Never / Rarely + aux + subject', example:'Never had I seen such a view.' },
        { rule:'wish / regret', form:'I wish + Past / Past Perfect', example:'I wish I could go back.' },
        { rule:'Mixed conditional', form:'If + Past Perfect, would + V (сейчас)', example:'If I had gone, I’d be there now.' },
      ],
      examples: ['Never had I imagined such a trip.', 'Rarely do we meet people like that.', 'I wish I could stay longer.', 'If I had taken that job, I would be living in Paris now.', 'She wishes she had studied harder.'],
      test: [
        { q:'If I had taken that job, I ___ in Paris now.', o:['would be living','would have lived','will live','lived'], a:0 },
        { q:'Never ___ such a beautiful view.',            o:['have I seen','I have seen','I saw','did I see'], a:0 },
        { q:'She wishes she ___ harder at school.',        o:['had studied','studied','studies','would study'], a:0 },
        { q:'The report ___ by the time the boss arrived.',o:['had been finished','was finished','has been finished','finished'], a:0 },
      ],
    },
    words: [],
    reading: {
      text: 'Never had I imagined that a two-week trip could change me so much. "Hey buddy, hop in!" my host brother said on the first day, and we zoomed down to the beach. The views were awesome and spectacular, the air was crisp, and the colours were so vivid that I still remember them. The roads were bumpy, and we spent hours wandering around small villages, talking about everything and nothing. "Get it?" he would ask. "Kind of," I always laughed. Now that I am home, I wish I could go back. Rarely do we meet people who feel like family after only a fortnight — but I did.',
      q: ['How long was the trip?', 'How did the writer feel about the views?', 'What does the writer wish now?'],
    },
    speaking: {
      task: 'Расскажи о крутой поездке неформально (awesome, spectacular, hang out, host family). Добавь инверсию (Never had I…) и wish (I wish I…). Используй слова урока.',
      opory: ['My trip was awesome!', 'We used to hang out…', 'Never had I seen…', 'I wish I could…'],
    },
  },
};

/* Авто-картинка по английскому слову (фолбэк). loremflickr отдаёт фото по тегу. */
window.wordImage = function(en){
  const tag = encodeURIComponent(String(en).trim().split(/\s+/).join(','));
  return `https://loremflickr.com/400/300/${tag}`;
};

/* Реальные слова + авторские иллюстрации из словаря ELC (dict-words.js), если загружен. */
if (window.ELC_DICT_WORDS) {
  for (const n of Object.keys(window.ELC_LESSONS)) {
    const d = window.ELC_DICT_WORDS[n];
    if (d && d.length) window.ELC_LESSONS[n].words = d;
  }
}
/* URL картинки слова: реальная из словаря, иначе авто-поиск. */
window.wordImageFor = function(w){
  if (w && w.img) return encodeURI((window.DICT_ORIGIN || '') + w.img);
  return window.wordImage((w && w.en) || '');
};

/* Порядок шагов урока. teacherRole=null → авто-этап (мини-тест), без преподавателя. */
window.ELC_STEPS = [
  { key:'level-set',     title:'Разговор · уровень',      teacherRole:'placement', phase:'level' },
  { key:'tour',          title:'Тур по школе',            teacherRole:'tour',     phase:'tour' },
  { key:'words-cards',   title:'Слова · карточки',        teacherRole:'words',    phase:'words' },
  { key:'grammar',       title:'Грамматика · преподаватель', teacherRole:'grammar', phase:'grammar' },
  { key:'reading',       title:'Чтение · преподаватель',  teacherRole:'reading',  phase:'reading' },
  { key:'speaking',      title:'Спикинг · преподаватель', teacherRole:'speaking', phase:'speaking' },
  { key:'registrar',     title:'Регистратор · итоги',     teacherRole:'registrar', phase:'final' },
];

window.ROLE_LABELS = { placement:'Разговор', tour:'Тур', words:'Слова', grammar:'Грамматика', reading:'Чтение', speaking:'Спикинг', registrar:'Регистратор' };

/* Физический класс, куда подойти студенту по каждому заданию. */
window.ROLE_CLASS = { words:'Класс Слов', grammar:'Класс Грамматики', reading:'Класс Conversation', speaking:'Класс Conversation' };
