// Конфигурация Firebase для фронта Pllato CRM.
// Значения публичные (apiKey не секрет — безопасность на Firebase Security Rules).
// Если эти поля пустые — отправка через worker падает с "Нет активной Firebase-сессии".
window.PLLATO_FIREBASE_CONFIG = {
  apiKey: "AIzaSyC3Cw3nX6b1zpE1-lqW1whwUsPPUQ7TIhc",
  authDomain: "pllato-crm.firebaseapp.com",
  databaseURL: "https://pllato-crm-default-rtdb.firebaseio.com",
  projectId: "pllato-crm",
  storageBucket: "pllato-crm.firebasestorage.app",
  messagingSenderId: "690738857241",
  appId: "1:690738857241:web:2356e97c435656890ab188"
};

// URL развёрнутого Cloudflare Worker (см. /worker).
window.PLLATO_API_BASE = "https://pllato-comm.uurraa.workers.dev";
