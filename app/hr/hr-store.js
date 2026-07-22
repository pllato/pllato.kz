/* HRStore — абстракция хранилища оценок кандидатов и настроек.
   Панель работает ТОЛЬКО через этот API. Сейчас backend = localStorage;
   при подключении сервера (Firebase RTDB) меняется только этот файл.
   Модель записи кандидата (evaluation):
   { id, code, name, fam, kp, decision, notes,
     interview:{scores:{}}, biodata:{confirmed:{},overrides:{}},
     createdAt, updatedAt, updatedBy } */
(function () {
  const CKEY = 'hr_v2_candidates';   // { id: rec }
  const SKEY = 'hr_v2_settings';
  const listeners = [];

  function readAll() { try { return JSON.parse(localStorage.getItem(CKEY) || '{}'); } catch (e) { return {}; } }
  function writeAll(obj) { localStorage.setItem(CKEY, JSON.stringify(obj)); emit(); }
  function emit() { listeners.forEach(cb => { try { cb(); } catch (e) {} }); }
  const now = () => new Date().toISOString();

  const HRStore = {
    mode: 'local',
    backendLabel: 'локально в браузере',

    init() { window.addEventListener('storage', e => { if (e.key === CKEY || e.key === SKEY) emit(); }); return Promise.resolve(); },

    // --- пользователь (в локальном режиме — условный «этот браузер») ---
    user() {
      let name = localStorage.getItem('hr_local_user');
      if (!name) { name = 'Этот компьютер'; }
      return { email: 'local', name: name };
    },
    setLocalUser(name) { localStorage.setItem('hr_local_user', name || 'Этот компьютер'); },
    onUserChange() {},
    signIn() { return Promise.resolve(this.user()); },
    signOut() { return Promise.resolve(); },

    // --- кандидаты ---
    saveCandidate(rec) {
      const all = readAll();
      const u = this.user();
      rec.updatedAt = now(); rec.updatedBy = u.name || u.email;
      if (!rec.createdAt) rec.createdAt = rec.updatedAt;
      all[rec.id] = rec; writeAll(all);
      return Promise.resolve(rec);
    },
    getCandidate(id) { return Promise.resolve(readAll()[id] || null); },
    listCandidates() { return Promise.resolve(Object.values(readAll())); },
    deleteCandidate(id) { const all = readAll(); delete all[id]; writeAll(all); return Promise.resolve(); },

    // --- настройки ---
    getSettings() { try { return Promise.resolve(JSON.parse(localStorage.getItem(SKEY) || '{}')); } catch (e) { return Promise.resolve({}); } },
    saveSettings(s) { localStorage.setItem(SKEY, JSON.stringify(s)); emit(); return Promise.resolve(s); },

    onChange(cb) { listeners.push(cb); return () => { const i = listeners.indexOf(cb); if (i >= 0) listeners.splice(i, 1); }; },
  };

  window.HRStore = HRStore;
})();
