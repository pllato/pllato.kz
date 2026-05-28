const TRAINER_URL = 'https://pllato.kz/trainer/elc/';

export function renderElcTrainer(container) {
  container.innerHTML = `
    <div class="elc-trainer-wrap">
      <div class="elc-trainer-bar">
        <span class="elc-trainer-badge">🎓 Тренажёр ELC</span>
        <a class="doc-btn" href="${TRAINER_URL}" target="_blank" rel="noopener">
          Открыть в новой вкладке ↗
        </a>
      </div>
      <iframe
        class="elc-trainer-frame"
        src="${TRAINER_URL}"
        title="ELC English Sales Trainer"
        allow="microphone; speech-recognition"
        allowfullscreen
      ></iframe>
    </div>
  `;
}
