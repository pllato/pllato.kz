// Конфигурация Firebase для фронта.
// На Этапе 0 файл может оставаться пустым — приложение запустится в DEMO-режиме
// (логин складывается в localStorage). Когда создашь Firebase-проект,
// замени значения ниже и в Authentication → Sign-in method включи Email/Password.
//
// Где взять значения: Firebase Console → твой проект → ⚙ Project settings →
// раздел "Your apps" → Web app → Firebase SDK snippet → Config.
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
