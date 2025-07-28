// --- Tabs ---
// Получаем все ссылки и вкладки
const links = document.querySelectorAll('nav a[data-tab]');
const tabs = document.querySelectorAll('.tab');

// Функция активации вкладки по ID
function activateTab(tabId) {
  // Снимаем активность со всех вкладок и ссылок
  links.forEach(link => link.classList.remove('active'));
  tabs.forEach(tab => tab.classList.remove('active'));

  // Находим нужную вкладку и ссылку по ID
  const activeLink = document.querySelector(`nav a[data-tab="${tabId}"]`);
  const activeTab = document.querySelector(`.tab#${tabId}`);

  if (activeLink && activeTab) {
    // Активируем выбранную вкладку
    activeLink.classList.add('active');
    activeTab.classList.add('active');
    history.replaceState(null, '', `#${tabId}`);
  } else {
    // Если вкладка не найдена — активируем по умолчанию (dashboard)
    const defaultLink = document.querySelector('nav a[data-tab="dashboard"]');
    const defaultTab = document.querySelector('.tab#dashboard');
    if (defaultLink && defaultTab) {
      defaultLink.classList.add('active');
      defaultTab.classList.add('active');
      history.replaceState(null, '', '#dashboard');
    }
  }
}

// Назначаем обработчик нажатия на ссылки — активация вкладок
links.forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const tabId = link.dataset.tab;
    activateTab(tabId);
  });
});

// При загрузке страницы активируем вкладку из URL или dashboard
const initial = location.hash.replace('#', '');
if (initial) {
  activateTab(initial);
} else {
  activateTab('online');
}

// --- Online calc ---
// Кнопка запуска расчёта и элемент для вывода результатов
const calcBtn = document.getElementById('calcBtn');
const resultsEl = document.getElementById('results');

// Основной обработчик клика на кнопку
calcBtn.addEventListener('click', () => {
  const raw = document.getElementById('logsInput').value.trim(); // Сырые логи
  const dateFrom = document.getElementById('dateFrom').value;
  const dateTo = document.getElementById('dateTo').value;
  const timeFrom = (document.getElementById('timeFrom').value || '00:00:00').trim();
  const timeTo = (document.getElementById('timeTo').value || '23:59:59').trim();

  // Проверка на пустые логи
  if (!raw) {
    showResult('Пустые логи.');
    return;
  }

  // Разбиваем логи по строкам
  const lines = raw.split(/\r?\n/).filter(Boolean);

  // Регулярка для парсинга строки лога
  const lineRegex = /^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2}).*?Игрок\s+(.+?)\s+вышел.*?время сессии:\s+(\d{2}):(\d{2}):(\d{2})/i;

  // Флаг фильтрации по дате
  const filterByDate = dateFrom && dateTo;
  const startDate = filterByDate ? new Date(dateFrom + 'T00:00:00') : null;
  const endDate = filterByDate ? new Date(dateTo + 'T23:59:59') : null;

  // Время в секундах от начала суток
  const [tfH, tfM, tfS = 0] = timeFrom.split(':').map(Number);
  const [ttH, ttM, ttS = 0] = timeTo.split(':').map(Number);
  const fromSeconds = tfH * 3600 + tfM * 60 + tfS;
  const toSeconds = ttH * 3600 + ttM * 60 + ttS;

  // Счётчики
  let totalSeconds = 0;
  let sessions = 0;
  const players = new Set();
  const rejected = []; // нераспознанные строки
  const debug = [];    // для отладки

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

    // Фильтрация по дате выхода, если даты указаны
    if (filterByDate && (exitTime < startDate || exitTime > endDate)) {
      debug.push(`Сессия ${nick} (${exitTime.toISOString()}): пропущена, вне диапазона дат`);
      continue;
    }

    // Время сессии в секундах и начало сессии
    const sessionSeconds = (+hh) * 3600 + (+mm) * 60 + (+ss);
    const sessionStart = new Date(exitTime.getTime() - sessionSeconds * 1000);

    // Вычисляем границы окна времени в рамках этого дня
    const rangeStart = new Date(exitTime);
    rangeStart.setHours(0, 0, 0, 0);
    rangeStart.setSeconds(rangeStart.getSeconds() + fromSeconds);

    const rangeEnd = new Date(exitTime);
    rangeEnd.setHours(0, 0, 0, 0);
    rangeEnd.setSeconds(rangeEnd.getSeconds() + toSeconds);

    // Пересечение интервалов [sessionStart - exitTime] и [rangeStart - rangeEnd]
    const actualStart = new Date(Math.max(sessionStart.getTime(), rangeStart.getTime()));
    const actualEnd = new Date(Math.min(exitTime.getTime(), rangeEnd.getTime()));

    let secondsInWindow = 0;
    if (actualEnd > actualStart) {
      secondsInWindow = Math.floor((actualEnd - actualStart) / 1000);
      debug.push(`Сессия ${nick} (${sessionStart.toISOString()} - ${exitTime.toISOString()}): ${secondsInWindow} сек`);
      totalSeconds += secondsInWindow;
      sessions++;
      players.add(nick);
    } else {
      debug.push(`Сессия ${nick} (${sessionStart.toISOString()} - ${exitTime.toISOString()}): пропущена, вне окна времени`);
    }
  }

  // Готовим HTML-результат
  const human = secondsToHMS(totalSeconds);
  const avg = sessions ? secondsToHMS(Math.floor(totalSeconds / sessions)) : '00:00:00';

  let html = `
<strong>Результат</strong><br>
Всего онлайн: <strong>${human}</strong><br>
Сессий учтено: <strong>${sessions}</strong><br>
Уникальных игроков: <strong>${players.size}</strong><br>
Средняя сессия: <strong>${avg}</strong>
  `.trim();

  // Неудачные строки
  if (rejected.length) {
    html += `<details style="margin-top:10px"><summary>Строки не распознаны (${rejected.length})</summary><pre>${escapeHtml(rejected.join('\n'))}</pre></details>`;
  }

  // Отладочная информация
  if (debug.length) {
    html += `<details style="margin-top:10px"><summary>Отладка</summary><pre>${escapeHtml(debug.join('\n'))}</pre></details>`;
  }

  showResult(html, true);
});

// Показывает результат в блоке
function showResult(html, isHTML = false) {
  resultsEl.hidden = false;
  if (isHTML) {
    resultsEl.innerHTML = html;
  } else {
    resultsEl.textContent = html;
  }
}

// Перевод секунд в формат HH:MM:SS
function secondsToHMS(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
}

// Экранирует HTML-спецсимволы
function escapeHtml(str) {
  return str.replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[m]));
}
