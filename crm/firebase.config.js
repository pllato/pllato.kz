// Конфигурация Firebase для фронта.
// На Этапе 0 файл может оставаться пустым — приложение запустится в DEMO-режиме
// (логин складывается в localStorage). Когда создашь Firebase-проект,
// замени значения ниже и в Authentication → Sign-in method включи Email/Password.
//
// Где взять значения: Firebase Console → твой проект → ⚙ Project settings →
// раздел "Your apps" → Web app → Firebase SDK snippet → Config.
window.PLLATO_FIREBASE_CONFIG = {
  apiKey: "",
  authDomain: "",
  databaseURL: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

// URL развёрнутого Cloudflare Worker (см. /worker).
window.PLLATO_API_BASE = "https://pllato-comm.uurraa.workers.dev";
