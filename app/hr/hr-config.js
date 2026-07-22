/* Конфигурация HR-системы (отдельная от CRM).
   ЗАПОЛНИТЬ ОДИН РАЗ после создания собственного Firebase-проекта для найма
   и деплоя воркера. До заполнения панель работает в локальном режиме.

   Как получить значения firebase — см. hr-worker/README.md, раздел
   «Свой Firebase-проект». Все значения ПУБЛИЧНЫЕ (их можно коммитить),
   защита доступа — на стороне воркера (проверка токена + список команды). */
window.HR_CONFIG = {
  // 1) Конфиг веб-приложения из вашего Firebase-проекта для HR
  //    (Firebase Console → Project settings → Your apps → SDK setup → Config).
  firebase: {
    apiKey: "",
    authDomain: "",           // например hr-pllato.firebaseapp.com
    projectId: "",            // например hr-pllato  (ДОЛЖЕН совпадать с FIREBASE_PROJECT_ID в воркере)
    appId: "",
    messagingSenderId: "",
  },
  // 2) Адрес развёрнутого HR-воркера (из вывода `wrangler deploy`)
  workerUrl: "https://pllato-hr-worker.uurraa.workers.dev",
};
