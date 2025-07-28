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

  const lineRegex = /^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2}).*?Игрок\s+(.+?)\s+вышел с сервера.*?время сессии:\s+(\d{2}):(\d{2}):(\d{2})/i;

  for (const line of lines) {
    const m = line.match(lineRegex);
    if (m) {
      const [_, d, t] = m;
      const dt = new Date(`${d}T${t}Z`); // Use UTC to avoid timezone issues
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
const chartsContainer = document.getElementById('chartsContainer');

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
  const lineRegex = /^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2}).*?Игрок\s+(.+?)\s+вышел с сервера.*?время сессии:\s+(\d{2}):(\d{2}):(\d{2})/i;

  const filterByDate = dateFrom && dateTo;
  const startDate = filterByDate ? new Date(dateFrom + 'T00:00:00Z') : null;
  const endDate = filterByDate ? new Date(dateTo + 'T23:59:59Z') : null;

  const [tfH, tfM, tfS = 0] = timeFrom.split(':').map(Number);
  const [ttH, ttM, ttS = 0] = timeTo.split(':').map(Number);
  const fromSeconds = tfH * 3600 + tfM * 60 + tfS;
  const toSeconds = ttH * 3600 + ttM * 60 + ttS;

  let totalSeconds = 0;
  let sessions = 0;
  const players = new Map(); // ник -> { seconds, sessions }
  const playerDaily = new Map(); // ник -> { date -> seconds }
  const rejected = [];
  const debug = [];

  for (const line of lines) {
    const m = line.match(lineRegex);
    if (!m) {
      rejected.push(line);
      continue;
    }

    const [_, d, t, nick, hh, mm, ss] = m;
    const exitTime = new Date(`${d}T${t}Z`); // Use UTC
    if (isNaN(exitTime)) {
      rejected.push(line);
      continue;
    }

    const sessionSeconds = (+hh) * 3600 + (+mm) * 60 + (+ss);
    const sessionStart = new Date(exitTime.getTime() - sessionSeconds * 1000);

    debug.push(`Обработка сессии ${nick}: начало ${sessionStart.toISOString()}, конец ${exitTime.toISOString()}, длительность ${sessionSeconds} сек`);

    if (filterByDate && (exitTime < startDate || sessionStart > endDate)) {
      debug.push(`Сессия ${nick} (${sessionStart.toISOString()} - ${exitTime.toISOString()}): пропущена, полностью вне диапазона дат ${dateFrom} - ${dateTo}`);
      continue;
    }

    // Initialize player data
    if (!players.has(nick)) {
      players.set(nick, { seconds: 0, sessions: 0 });
      playerDaily.set(nick, new Map());
    }

    // Process each day in the session
    const startDay = new Date(sessionStart);
    startDay.setUTCHours(0, 0, 0, 0);
    const endDay = new Date(exitTime);
    endDay.setUTCHours(0, 0, 0, 0);

    let currentDay = new Date(startDay);
    let sessionCounted = false;

    while (currentDay <= endDay) {
      // Skip days outside the date range
      if (filterByDate && (currentDay < startDate || currentDay > endDate)) {
        debug.push(`Сессия ${nick} (${sessionStart.toISOString()} - ${exitTime.toISOString()}): пропущен день ${currentDay.toISOString().slice(0, 10)}, вне диапазона дат ${dateFrom} - ${dateTo}`);
        currentDay.setUTCDate(currentDay.getUTCDate() + 1);
        continue;
      }

      // Define the start and end of the current day
      const dayStart = new Date(currentDay);
      const dayEnd = new Date(currentDay);
      dayEnd.setUTCHours(23, 59, 59, 999);

      // Calculate session time within this day
      const dayStartTime = new Date(Math.max(sessionStart.getTime(), dayStart.getTime()));
      const dayEndTime = new Date(Math.min(exitTime.getTime(), dayEnd.getTime()));

      // Apply time filter for the current day
      const rangeStart = new Date(currentDay);
      rangeStart.setUTCSeconds(fromSeconds);
      const rangeEnd = new Date(currentDay);
      rangeEnd.setUTCSeconds(toSeconds);

      const actualStart = new Date(Math.max(dayStartTime.getTime(), rangeStart.getTime()));
      const actualEnd = new Date(Math.min(dayEndTime.getTime(), rangeEnd.getTime()));

      let secondsInWindow = 0;
      if (actualEnd > actualStart) {
        secondsInWindow = Math.floor((actualEnd - actualStart) / 1000);

        totalSeconds += secondsInWindow;
        players.get(nick).seconds += secondsInWindow;

        if (!sessionCounted && currentDay.getTime() === startDay.getTime()) {
          players.get(nick).sessions += 1;
          sessions++;
          sessionCounted = true;
          debug.push(`Сессия ${nick} (${sessionStart.toISOString()} - ${exitTime.toISOString()}): учтено ${secondsInWindow} сек на ${currentDay.toISOString().slice(0, 10)} (новая сессия)`);
        } else {
          debug.push(`Сессия ${nick} (${sessionStart.toISOString()} - ${exitTime.toISOString()}): учтено ${secondsInWindow} сек на ${currentDay.toISOString().slice(0, 10)}`);
        }

        // Aggregate daily data
        const dateStr = currentDay.toISOString().slice(0, 10);
        const dailyMap = playerDaily.get(nick);
        dailyMap.set(dateStr, (dailyMap.get(dateStr) || 0) + secondsInWindow);
      } else {
        debug.push(`Сессия ${nick} (${sessionStart.toISOString()} - ${exitTime.toISOString()}): пропущена для ${currentDay.toISOString().slice(0, 10)}, вне временного окна ${timeFrom}-${timeTo}`);
      }

      // Move to the next day
      currentDay.setUTCDate(currentDay.getUTCDate() + 1);
    }
  }

  // Ensure all days in the date range are included in playerDaily
  if (filterByDate) {
    for (const [nick, dailyMap] of playerDaily) {
      let currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().slice(0, 10);
        if (!dailyMap.has(dateStr)) {
          dailyMap.set(dateStr, 0);
          debug.push(`Добавлен день ${dateStr} для ${nick} с 0 сек онлайна`);
        }
        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
      }
    }
  }

  // Debug playerDaily contents
  for (const [nick, dailyMap] of playerDaily) {
    debug.push(`Содержимое playerDaily для ${nick}: ${JSON.stringify([...dailyMap.entries()])}`);
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
    const avgTime = secondsToHMS(Math.floor(data.seconds / data.sessions || 0));
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

  // Clear previous charts
  chartsContainer.innerHTML = '';

  // Generate charts for each player
  for (const [nick, dailyMap] of [...playerDaily.entries()].sort((a, b) => b[1].size - a[1].size)) {
    // Include all dates from playerDaily that fall within or are processed, but respect date range
    let dates = [...dailyMap.keys()];
    if (filterByDate) {
      dates = dates.filter(date => {
        const d = new Date(date + 'T00:00:00Z');
        return d >= startDate && d <= endDate;
      });
    }
    dates.sort((a, b) => new Date(a) - new Date(b));
    const hours = dates.map(date => (dailyMap.get(date) / 3600).toFixed(2));

    debug.push(`Даты для графика ${nick}: ${JSON.stringify(dates)}`);

    if (dates.length === 0) {
      debug.push(`Пропущен график для ${nick}: нет дат в диапазоне ${dateFrom} - ${dateTo}`);
      continue;
    }

    const canvas = document.createElement('canvas');
    canvas.id = `chart-${nick.replace(/[^a-zA-Z0-9]/g, '')}`;
    chartsContainer.appendChild(canvas);

    // Create Chart.js chart
    new Chart(canvas, {
      type: 'line',
      data: {
        labels: dates,
        datasets: [{
          label: 'Онлайн в день (часы)',
          data: hours,
          borderColor: '#4f46e5',
          backgroundColor: 'rgba(79, 70, 229, 0.2)',
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        plugins: {
          title: {
            display: true,
            text: `Онлайн игрока ${nick}`,
            color: '#e6e6e6',
            font: { size: 16 }
          },
          legend: { labels: { color: '#e6e6e6' } }
        },
        scales: {
          x: {
            title: { display: true, text: 'Дата', color: '#e6e6e6' },
            ticks: { color: '#9aa0ac' }
          },
          y: {
            title: { display: true, text: 'Онлайн (часы)', color: '#e6e6e6' },
            ticks: { color: '#9aa0ac' },
            beginAtZero: true
          }
        }
      }
    });
  }
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