// Panels stay mounted: switching sections must preserve drafts and existing handlers.
export function mountDealCardNavigation(root) {
  const overview = root.querySelector('[data-card-panel="overview"] .dc-grid');
  let mobileSections;
  const setOverview = name => {
    if (!overview) return;
    overview.dataset.mobileSection = name;
    mobileSections?.querySelectorAll('button').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.section === name));
    });
  };
  if (overview && !root.querySelector('.dc-mobile-overview')) {
    mobileSections = document.createElement('nav');
    mobileSections.className = 'dc-mobile-overview';
    mobileSections.setAttribute('aria-label', 'Обзор клиента');
    for (const [name, label] of [['client', 'Клиент и дела'], ['chat', 'Переписка']]) {
      const button = document.createElement('button');
      button.type = 'button'; button.textContent = label; button.dataset.section = name;
      button.onclick = () => setOverview(name);
      mobileSections.appendChild(button);
    }
    overview.before(mobileSections);
    setOverview('client');
  }
  const tabs = [...root.querySelectorAll('[data-card-tab]')];
  const panels = [...root.querySelectorAll('[data-card-panel]')];
  const activate = name => {
    if (!panels.some(panel => panel.dataset.cardPanel === name)) return;
    tabs.forEach(tab => {
      const selected = tab.dataset.cardTab === name;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
    panels.forEach(panel => { panel.hidden = panel.dataset.cardPanel !== name; });
  };
  tabs.forEach((tab, index) => {
    tab.onclick = () => activate(tab.dataset.cardTab);
    tab.onkeydown = event => {
      const next = event.key === 'ArrowRight' ? (index + 1) % tabs.length
        : event.key === 'ArrowLeft' ? (index + tabs.length - 1) % tabs.length
        : event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : null;
      if (next === null) return;
      event.preventDefault();
      activate(tabs[next].dataset.cardTab);
      tabs[next].focus();
    };
  });
  root.querySelectorAll('.dc-more').forEach(menu => {
    menu.addEventListener('keydown', event => {
      if (event.key !== 'Escape') return;
      event.stopPropagation();
      menu.open = false;
      menu.querySelector('summary').focus();
    });
    menu.addEventListener('click', event => {
      if (event.target.closest('button')) menu.open = false;
    });
  });
  return {
    activate,
    reveal(selector) {
      const element = root.querySelector(selector);
      if (!element) return null;
      const panel = element.closest('[data-card-panel]');
      if (panel) activate(panel.dataset.cardPanel);
      if (element.closest('.dc-right')) setOverview('chat');
      else if (element.closest('.dc-left')) setOverview('client');
      for (let parent = element; parent && parent !== root; parent = parent.parentElement) {
        if (parent.tagName === 'DETAILS') parent.open = true;
      }
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return element;
    },
  };
}
