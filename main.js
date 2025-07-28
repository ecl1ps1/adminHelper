// --- Tabs ---
const links = document.querySelectorAll('nav a[data-tab]');
const tabs = document.querySelectorAll('.tab');

function activateTab(tabId) {
  links.forEach(link => link.classList.remove('active'));
  tabs.forEach(tab => tab.classList.remove('active'));

  const activeLink = document.querySelector(`nav a[data-tab="${tabId}"]`);
  const activeTab = document.querySelector(`.tab#${tabId}`);

  if (activeLink && activeTab) {
    activeLink.classList.add('active');
    activeTab.classList.add('active');
    history.replaceState(null, '', `#${tabId}`);
  } else {
    const defaultLink = document.querySelector('nav a[data-tab="dashboard"]');
    const defaultTab = document.querySelector('.tab#dashboard');
    if (defaultLink && defaultTab) {
      defaultLink.classList.add('active');
      defaultTab.classList.add('active');
      history.replaceState(null, '', '#dashboard');
    }
  }
}

links.forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const tabId = link.dataset.tab;
    activateTab(tabId);
  });
});

const initial = location.hash.replace('#', '');
if (initial) {
  activateTab(initial);
} else {
  activateTab('online');
}

// --- Auto Date Range on Input ---
document.getElementById('logsInput').addEventListener('input', () => {
  const raw = document.getElementById('logsInput').value.trim();
  const lines = raw.split(/\r?\n/).filter(Boolean);
  const dates = [];

  const lineRegex = /^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2}).*?Игрок\s+(.+?)\s+вышел.*?время сессии:\s+(\d{2}):(\d{2}):(\d{2})/i;

  for (const line of lines) {
    const m = line.match(lineRegex);
    if (m) {
      const [_, d, t] = m;
      const dt = new Date(`${d}T${t}`);
      if (!isNaN(dt)) dates.push(dt);
    }
  }

  if (dates.length) {
    const min = new Date(Math.min(...dates));
    const max = new Date(Math.max(...dates));
    document.getElementById('dateFrom').value = min.toISOString().slice(0, 10);
    document.getElementById('dateTo').value = max.toISOString().slice(0, 10);
  }
});

// --- Online calc ---
const calcBtn = document.getElementById('calcBtn');
const resultsEl = document.getElementById('results');

calcBtn.addEventListener('click', () => {
  const raw = document.getElementById('logsInput').value.trim();
  const dateFrom = document.getElementById('dateFrom').value;
  const dateTo = document.getElementById('dateTo').value;
  const timeFrom = (document.getElementById('timeFrom').value || '00:00:00').trim();
  const timeTo = (document.getElementById('timeTo').value || '23:59:59').trim();

  if (!raw) {
    showResult('Пустые логи.');
    return;
  }

  const lines = raw.split(/\r?\n/).filter(Boolean);
  const lineRegex = /^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2}).*?Игрок\s+(.+?)\s+вышел.*?время сессии:\s+(\d{2}):(\d{2}):(\d{2})/i;

  const filterByDate = dateFrom && dateTo;
  const startDate = filterByDate ? new Date(dateFrom + 'T00:00:00') : null;
  const endDate = filterByDate ? new Date(dateTo + 'T23:59:59') : null;

  const [tfH, tfM, tfS = 0] = timeFrom.split(':').map(Number);
  const [ttH, ttM, ttS = 0] = timeTo.split(':').map(Number);
  const fromSeconds = tfH * 3600 + tfM * 60 + tfS;
  const toSeconds = ttH * 3600 + ttM * 60 + ttS;

  let totalSeconds = 0;
  let sessions = 0;
  const players = new Map(); // ник -> { seconds, sessions }
  const rejected = [];
  const debug = [];

  for (const line of lines) {
    const m = line.match(lineRegex);
    if (!m) {
      rejected.push(line);
      continue;
    }

    const [_, d, t, nick, hh, mm, ss] = m;
    const exitTime = new Date(`${d}T${t}`);
    if (isNaN(exitTime)) {
      rejected.push(line);
      continue;
    }

    if (filterByDate && (exitTime < startDate || exitTime > endDate)) {
      debug.push(`Сессия ${nick} (${exitTime.toISOString()}): пропущена, вне диапазона дат`);
      continue;
    }

    const sessionSeconds = (+hh) * 3600 + (+mm) * 60 + (+ss);
    const sessionStart = new Date(exitTime.getTime() - sessionSeconds * 1000);

    const rangeStart = new Date(exitTime);
    rangeStart.setHours(0, 0, 0, 0);
    rangeStart.setSeconds(rangeStart.getSeconds() + fromSeconds);

    const rangeEnd = new Date(exitTime);
    rangeEnd.setHours(0, 0, 0, 0);
    rangeEnd.setSeconds(rangeEnd.getSeconds() + toSeconds);

    const actualStart = new Date(Math.max(sessionStart.getTime(), rangeStart.getTime()));
    const actualEnd = new Date(Math.min(exitTime.getTime(), rangeEnd.getTime()));

    let secondsInWindow = 0;
    if (actualEnd > actualStart) {
      secondsInWindow = Math.floor((actualEnd - actualStart) / 1000);
      debug.push(`Сессия ${nick} (${sessionStart.toISOString()} - ${exitTime.toISOString()}): ${secondsInWindow} сек`);
      totalSeconds += secondsInWindow;
      sessions++;

      if (!players.has(nick)) {
        players.set(nick, { seconds: 0, sessions: 0 });
      }
      players.get(nick).seconds += secondsInWindow;
      players.get(nick).sessions += 1;
    } else {
      debug.push(`Сессия ${nick} (${sessionStart.toISOString()} - ${exitTime.toISOString()}): пропущена, вне окна времени`);
    }
  }

  const human = secondsToHMS(totalSeconds);
  const avg = sessions ? secondsToHMS(Math.floor(totalSeconds / sessions)) : '00:00:00';

  let html = `
<strong>Общая статистика</strong><br>
Всего онлайн: <strong>${human}</strong><br>
Сессий учтено: <strong>${sessions}</strong><br>
Уникальных игроков: <strong>${players.size}</strong><br>
Средняя сессия: <strong>${avg}</strong>
  `.trim();

  let perPlayerHTML = `<details style="margin-top:10px"><summary>Статистика по игрокам (${players.size})</summary><table border="1" cellpadding="4" cellspacing="0"><tr><th>Ник</th><th>Сессий</th><th>Онлайн</th><th>Средняя сессия</th></tr>`;
  for (const [nick, data] of [...players.entries()].sort((a, b) => b[1].seconds - a[1].seconds)) {
    const avgTime = secondsToHMS(Math.floor(data.seconds / data.sessions));
    perPlayerHTML += `<tr><td>${escapeHtml(nick)}</td><td>${data.sessions}</td><td>${secondsToHMS(data.seconds)}</td><td>${avgTime}</td></tr>`;
  }
  perPlayerHTML += `</table></details>`;
  html += perPlayerHTML;

  if (rejected.length) {
    html += `<details style="margin-top:10px"><summary>Строки не распознаны (${rejected.length})</summary><pre>${escapeHtml(rejected.join('\n'))}</pre></details>`;
  }

  if (debug.length) {
    html += `<details style="margin-top:10px"><summary>Отладка</summary><pre>${escapeHtml(debug.join('\n'))}</pre></details>`;
  }

  showResult(html, true);
});

// --- Utils ---
function showResult(html, isHTML = false) {
  resultsEl.hidden = false;
  if (isHTML) {
    resultsEl.innerHTML = html;
  } else {
    resultsEl.textContent = html;
  }
}

function secondsToHMS(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[m]));
}
