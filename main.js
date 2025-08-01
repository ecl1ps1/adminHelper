/* ----------------------------------- */
/* Инициализация канваса для звёзд     */
/* ----------------------------------- */
const canvas = document.getElementById('stars'); // Получает элемент канваса по ID для анимации звёзд
const ctx = canvas.getContext('2d'); // Создаёт 2D-контекст для рисования на канвасе
const links = document.querySelectorAll("nav a[data-tab]"); // Выбирает все ссылки навигации с атрибутом data-tab
const tabs = document.querySelectorAll(".tab"); // Выбирает все элементы вкладок с классом tab
const graph = document.querySelector('#chartsContainer'); // Получает контейнер для графиков по ID

let width, height, stars; // Объявляет переменные для ширины, высоты и массива звёзд

/* ----------------------------------- */
/* Обработка изменения размера окна    */
/* ----------------------------------- */
function resize() {
  width = canvas.width = window.innerWidth; // Устанавливает ширину канваса равной ширине окна
  height = canvas.height = window.innerHeight; // Устанавливает высоту канваса равной высоте окна
}
window.addEventListener('resize', resize); // Добавляет слушатель события изменения размера окна
resize(); // Вызывает функцию resize при загрузке страницы для начальной настройки

/* ----------------------------------- */
/* Создание звёзд                     */
/* ----------------------------------- */
function createStars(count) {
  stars = []; // Инициализирует пустой массив для хранения звёзд
  for (let i = 0; i < count; i++) { // Цикл для создания указанного количества звёзд
    stars.push({ // Добавляет объект звезды в массив
      x: Math.random() * width, // Задаёт случайную X-координату в пределах ширины канваса
      y: Math.random() * height, // Задаёт случайную Y-координату в пределах высоты канваса
      radius: Math.random() * 1.2 + 0.2, // Задаёт случайный радиус от 0.2 до 1.4
      speedY: Math.random() * 0.3 + 0.05, // Задаёт случайную скорость движения вниз от 0.05 до 0.35
      alpha: Math.random() * 0.5 + 0.3 // Задаёт случайную прозрачность от 0.3 до 0.8
    });
  }
}

/* ----------------------------------- */
/* Отрисовка и анимация звёзд         */
/* ----------------------------------- */
function drawStars() {
  ctx.clearRect(0, 0, width, height); // Очищает весь канвас перед новой отрисовкой
  for (let s of stars) { // Перебирает все звёзды в массиве
    ctx.beginPath(); // Начинает новый путь для рисования
    ctx.arc(s.x, s.y, s.radius, 0, 2 * Math.PI); // Рисует круг (звезду) с заданными координатами и радиусом
    ctx.fillStyle = `rgba(255,255,255,${s.alpha})`; // Устанавливает белый цвет с прозрачностью для заливки
    ctx.fill(); // Заполняет звезду цветом
    s.y += s.speedY; // Перемещает звезду вниз на величину скорости
    if (s.y > height) s.y = 0; // Если звезда вышла за нижнюю границу, перемещает её наверх
  }
  requestAnimationFrame(drawStars); // Запрашивает следующий кадр анимации
}

createStars(150); // Создаёт 150 звёзд для начальной анимации
drawStars(); // Запускает функцию анимации звёзд

/* ----------------------------------- */
/* Управление вкладками               */
/* ----------------------------------- */
function activateTab(tabId) {
  links.forEach((link) => link.classList.remove("active")); // Удаляет класс active у всех ссылок навигации
  tabs.forEach((tab) => tab.classList.remove("active")); // Удаляет класс active у всех вкладок

  const activeLink = document.querySelector(`nav a[data-tab="${tabId}"]`); // Находит ссылку с указанным data-tab
  const activeTab = document.querySelector(`.tab#${tabId}`); // Находит вкладку с указанным ID

  if (activeLink && activeTab) { // Проверяет, существуют ли ссылка и вкладка
    activeLink.classList.add("active"); // Добавляет класс active для подсветки ссылки
    activeTab.classList.add("active"); // Добавляет класс active для отображения вкладки
    history.replaceState(null, "", `#${tabId}`); // Обновляет хэш в URL без перезагрузки страницы
  } else { // Если вкладка не найдена, активирует вкладку по умолчанию
    const defaultLink = document.querySelector('nav a[data-tab="dashboard"]'); // Находит ссылку на вкладку dashboard
    const defaultTab = document.querySelector(".tab#dashboard"); // Находит вкладку dashboard
    if (defaultLink && defaultTab) { // Проверяет, существуют ли ссылка и вкладка по умолчанию
      defaultLink.classList.add("active"); // Активирует ссылку dashboard
      defaultTab.classList.add("active"); // Активирует вкладку dashboard
      history.replaceState(null, "", "#dashboard"); // Устанавливает хэш #dashboard в URL
    }
  }
}

links.forEach((link) => { // Перебирает все ссылки навигации
  link.addEventListener("click", (e) => { // Добавляет слушатель клика для каждой ссылки
    e.preventDefault(); // Отменяет стандартное поведение ссылки (переход по URL)
    const tabId = link.dataset.tab; // Получает ID вкладки из атрибута data-tab
    activateTab(tabId); // Вызывает функцию активации вкладки
  });
});

const initial = location.hash.replace("#", ""); // Получает хэш из URL, убирая символ #
if (initial) { // Если хэш присутствует
  activateTab(initial); // Активирует вкладку, указанную в хэше
} else { // Если хэша нет
  activateTab("online"); // Активирует вкладку online по умолчанию
}

/* ----------------------------------- */
/* Автоматическое определение дат      */
/* ----------------------------------- */
document.getElementById("logsInput").addEventListener("input", () => { // Слушает изменения в поле ввода логов
  const raw = document.getElementById("logsInput").value.trim(); // Получает текст логов, убирая пробелы
  const lines = raw.split(/\r?\n/).filter(Boolean); // Разделяет текст на строки, удаляя пустые
  const dates = []; // Создаёт массив для хранения дат

  // Регулярное выражение для стандартного формата логов
  const standardRegex =
    /^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2}).*?Игрок\s+(.+?)\s+вышел с сервера.*?время сессии:\s+(\d{2}):(\d{2}):(\d{2})/i;
  // Регулярное выражение для альтернативной строки с датой
  const altDateRegex =
    /^\d+\s*\|\s*(\d{2}\.\d{2}\.\d{4})\s+(\d{2}:\d{2}:\d{2})$/;
  // Регулярное выражение для альтернативной строки сессии
  const altSessionRegex =
    /^Игрок\s+(.+?)\s+вышел с сервера.*?время сессии:\s+(\d{2}):(\d{2}):(\d{2})/i;

  for (let i = 0; i < lines.length; i++) { // Перебирает все строки логов
    const line = lines[i].trim(); // Убирает пробелы в начале и конце строки

    let m = line.match(standardRegex); // Проверяет строку на соответствие стандартному формату
    if (m) { // Если строка соответствует
      const [_, d, t] = m; // Извлекает дату и время
      const dt = new Date(`${d}T${t}Z`); // Создаёт объект Date в формате UTC
      if (!isNaN(dt)) dates.push(dt); // Если дата валидна, добавляет её в массив
      continue; // Переходит к следующей строке
    }

    m = line.match(altSessionRegex); // Проверяет строку на соответствие альтернативному формату сессии
    if (m) { // Если строка соответствует
      let nextDateTime = null; // Переменная для хранения следующей даты
      for (let j = i + 1; j < lines.length; j++) { // Ищет следующую строку с датой
        const nextLine = lines[j].trim(); // Убирает пробелы в следующей строке
        const dateMatch = nextLine.match(altDateRegex); // Проверяет на соответствие формату даты
        if (dateMatch) { // Если найдена строка с датой
          const [_, date, time] = dateMatch; // Извлекает дату и время
          const [day, month, year] = date.split("."); // Разделяет дату на компоненты
          nextDateTime = `${year}-${month}-${day} ${time}`; // Формирует строку даты
          break; // Прерывает поиск
        }
      }
      if (nextDateTime) { // Если дата найдена
        const [d, t] = nextDateTime.split(" "); // Разделяет дату и время
        const dt = new Date(`${d}T${t}Z`); // Создаёт объект Date
        if (!isNaN(dt)) dates.push(dt); // Если дата валидна, добавляет её
      }
    }
  }

  if (dates.length) { // Если найдены даты
    const min = new Date(Math.min(...dates)); // Находит минимальную дату
    const max = new Date(Math.max(...dates)); // Находит максимальную дату
    document.getElementById("dateFrom").value = min.toISOString().slice(0, 10); // Устанавливает начальную дату
    document.getElementById("dateTo").value = max.toISOString().slice(0, 10); // Устанавливает конечную дату
  }
});

/* ----------------------------------- */
/* Расчёт онлайна                     */
/* ----------------------------------- */
const calcBtn = document.getElementById("calcBtn"); // Получает кнопку "Рассчитать"
const resultsEl = document.getElementById("results"); // Получает контейнер для результатов
const chartsContainer = document.getElementById("chartsContainer"); // Получает контейнер для графиков

calcBtn.addEventListener("click", () => { // Слушает клик по кнопке
  const raw = document.getElementById("logsInput").value.trim(); // Получает текст логов
  const dateFrom = document.getElementById("dateFrom").value; // Получает начальную дату
  const dateTo = document.getElementById("dateTo").value; // Получает конечную дату
  const timeFrom = (
    document.getElementById("timeFrom").value || "00:00:00"
  ).trim(); // Получает начальное время, по умолчанию 00:00:00
  const timeTo = (document.getElementById("timeTo").value || "23:59:59").trim(); // Получает конечное время, по умолчанию 23:59:59

  if (!raw) { // Проверяет, пустые ли логи
    showResult("Пустые логи."); // Показывает сообщение об ошибке
    return; // Прерывает выполнение
  }

  const lines = raw.split(/\r?\n/).filter(Boolean); // Разделяет логи на строки, убирая пустые
  // Регулярные выражения для обработки логов
  const standardRegex =
    /^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2}).*?Игрок\s+(.+?)\s+вышел с сервера.*?время сессии:\s+(\d{2}):(\d{2}):(\d{2})/i;
  const altDateRegex =
    /^\d+\s*\|\s*(\d{2}\.\d{2}\.\d{4})\s+(\d{2}:\d{2}:\d{2})$/;
  const altSessionRegex =
    /^Игрок\s+(.+?)\s+вышел с сервера.*?время сессии:\s+(\d{2}):(\d{2}):(\d{2})/i;

  const filterByDate = dateFrom && dateTo; // Проверяет, указан ли диапазон дат
  const startDate = filterByDate ? new Date(dateFrom + "T00:00:00Z") : null; // Создаёт начальную дату
  const endDate = filterByDate ? new Date(dateTo + "T23:59:59Z") : null; // Создаёт конечную дату

  const [tfH, tfM, tfS = 0] = timeFrom.split(":").map(Number); // Разделяет начальное время на часы, минуты, секунды
  const [ttH, ttM, ttS = 0] = timeTo.split(":").map(Number); // Разделяет конечное время на часы, минуты, секунды
  const fromSeconds = tfH * 3600 + tfM * 60 + tfS; // Переводит начальное время в секунды
  const toSeconds = ttH * 3600 + ttM * 60 + ttS; // Переводит конечное время в секунды

  let totalSeconds = 0; // Инициализирует общее время онлайна
  let sessions = 0; // Инициализирует количество сессий
  const players = new Map(); // Создаёт Map для хранения данных игроков
  const playerDaily = new Map(); // Создаёт Map для хранения ежедневных данных игроков
  const rejected = []; // Создаёт массив для отклонённых строк
  const debug = []; // Создаёт массив для отладочной информации

  for (let i = 0; i < lines.length; i++) { // Перебирает все строки логов
    const line = lines[i].trim(); // Убирает пробелы в строке

    let m = line.match(standardRegex); // Проверяет стандартный формат
    if (m) { // Если строка соответствует
      const [_, d, t, nick, hh, mm, ss] = m; // Извлекает дату, время, ник и длительность сессии
      const exitTime = new Date(`${d}T${t}Z`); // Создаёт дату выхода игрока
      if (isNaN(exitTime)) { // Проверяет валидность даты
        rejected.push(line); // Добавляет строку в отклонённые
        debug.push(`Некорректная дата в строке: ${line}`); // Логирует ошибку
        continue;
      }

      const sessionSeconds = +hh * 3600 + +mm * 60 + +ss; // Вычисляет длительность сессии в секундах
      const sessionStart = new Date(exitTime.getTime() - sessionSeconds * 1000); // Вычисляет время начала сессии

      debug.push(
        `Обработка сессии ${nick}: начало ${sessionStart.toISOString()}, конец ${exitTime.toISOString()}, длительность ${sessionSeconds} сек`
      ); // Логирует информацию о сессии

      if (filterByDate && (exitTime < startDate || sessionStart > endDate)) { // Проверяет, попадает ли сессия в диапазон дат
        debug.push(
          `Сессия ${nick} (${sessionStart.toISOString()} - ${exitTime.toISOString()}): пропущена, полностью вне диапазона дат ${dateFrom} - ${dateTo}`
        ); // Логирует пропуск сессии
        continue;
      }

      if (!players.has(nick)) { // Проверяет, есть ли игрок в Map
        players.set(nick, { seconds: 0, sessions: 0 }); // Инициализирует данные игрока
        playerDaily.set(nick, new Map()); // Инициализирует ежедневные данные игрока
      }

      const startDay = new Date(sessionStart); // Создаёт дату начала сессии
      startDay.setUTCHours(0, 0, 0, 0); // Устанавливает начало дня
      const endDay = new Date(exitTime); // Создаёт дату конца сессии
      endDay.setUTCHours(0, 0, 0, 0); // Устанавливает начало дня

      let currentDay = new Date(startDay); // Начинает с первого дня сессии
      let sessionCounted = false; // Флаг для учёта сессии

      while (currentDay <= endDay) { // Перебирает все дни сессии
        if (filterByDate && (currentDay < startDate || currentDay > endDate)) { // Проверяет, попадает ли день в диапазон
          debug.push(
            `Сессия ${nick} (${sessionStart.toISOString()} - ${exitTime.toISOString()}): пропущен день ${currentDay
              .toISOString()
              .slice(0, 10)}, вне диапазона дат ${dateFrom} - ${dateTo}`
          ); // Логирует пропуск дня
          currentDay.setUTCDate(currentDay.getUTCDate() + 1); // Переходит к следующему дню
          continue;
        }

        const dayStart = new Date(currentDay); // Начало текущего дня
        const dayEnd = new Date(currentDay); // Конец текущего дня
        dayEnd.setUTCHours(23, 59, 59, 999); // Устанавливает конец дня

        const dayStartTime = new Date(
          Math.max(sessionStart.getTime(), dayStart.getTime())
        ); // Начало сессии в текущем дне
        const dayEndTime = new Date(
          Math.min(exitTime.getTime(), dayEnd.getTime())
        ); // Конец сессии в текущем дне

        const rangeStart = new Date(currentDay); // Начало временного окна
        rangeStart.setUTCSeconds(fromSeconds); // Устанавливает начальное время
        const rangeEnd = new Date(currentDay); // Конец временного окна
        rangeEnd.setUTCSeconds(toSeconds); // Устанавливает конечное время

        const actualStart = new Date(
          Math.max(dayStartTime.getTime(), rangeStart.getTime())
        ); // Фактическое начало в окне
        const actualEnd = new Date(
          Math.min(dayEndTime.getTime(), rangeEnd.getTime())
        ); // Фактический конец в окне

        let secondsInWindow = 0; // Инициализирует время в окне
        if (actualEnd > actualStart) { // Если окно валидно
          secondsInWindow = Math.floor((actualEnd - actualStart) / 1000); // Вычисляет время в секундах

          totalSeconds += secondsInWindow; // Добавляет к общему времени
          players.get(nick).seconds += secondsInWindow; // Добавляет к времени игрока

          if (!sessionCounted && currentDay.getTime() === startDay.getTime()) { // Если сессия ещё не учтена
            players.get(nick).sessions += 1; // Увеличивает количество сессий игрока
            sessions++; // Увеличивает общее количество сессий
            debug.push(
              `Сессия ${nick} (${sessionStart.toISOString()} - ${exitTime.toISOString()}): учтено ${secondsInWindow} сек на ${currentDay
                .toISOString()
                .slice(0, 10)} (новая сессия)`
            ); // Логирует новую сессию
          } else {
            debug.push(
              `Сессия ${nick} (${sessionStart.toISOString()} - ${exitTime.toISOString()}): учтено ${secondsInWindow} сек на ${currentDay
                .toISOString()
                .slice(0, 10)}`
            ); // Логирует учтённое время
          }

          const dateStr = currentDay.toISOString().slice(0, 10); // Формирует строку даты
          const dailyMap = playerDaily.get(nick); // Получает Map ежедневных данных
          dailyMap.set(dateStr, (dailyMap.get(dateStr) || 0) + secondsInWindow); // Добавляет время для дня
        } else {
          debug.push(
            `Сессия ${nick} (${sessionStart.toISOString()} - ${exitTime.toISOString()}): пропущена для ${currentDay
              .toISOString()
              .slice(0, 10)}, вне временного окна ${timeFrom}-${timeTo}`
          ); // Логирует пропуск из-за временного окна
        }

        currentDay.setUTCDate(currentDay.getUTCDate() + 1); // Переходит к следующему дню
      }
      continue;
    }

    m = line.match(altSessionRegex); // Проверяет альтернативный формат сессии
    if (m) { // Если строка соответствует
      const [_, nick, hh, mm, ss] = m; // Извлекает ник и длительность сессии
      let nextDateTime = null; // Переменная для хранения даты
      for (let j = i + 1; j < lines.length; j++) { // Ищет следующую строку с датой
        const nextLine = lines[j].trim(); // Убирает пробелы
        const dateMatch = nextLine.match(altDateRegex); // Проверяет формат даты
        if (dateMatch) { // Если найдена дата
          const [_, date, time] = dateMatch; // Извлекает дату и время
          const [day, month, year] = date.split("."); // Разделяет дату
          nextDateTime = `${year}-${month}-${day} ${time}`; // Формирует строку даты
          break;
        }
      }
      if (!nextDateTime) { // Если дата не найдена
        rejected.push(line); // Добавляет строку в отклонённые
        debug.push(`Нет даты после строки сессии: ${line}`); // Логирует ошибку
        continue;
      }

      const [d, t] = nextDateTime.split(" "); // Разделяет дату и время
      const exitTime = new Date(`${d}T${t}Z`); // Создаёт дату выхода
      if (isNaN(exitTime)) { // Проверяет валидность даты
        rejected.push(line); // Добавляет строку в отклонённые
        debug.push(
          `Некорректная дата для альтернативной строки: ${line}, использовалась дата ${nextDateTime}`
        ); // Логирует ошибку
        continue;
      }

      const sessionSeconds = +hh * 3600 + +mm * 60 + +ss; // Вычисляет длительность сессии
      const sessionStart = new Date(exitTime.getTime() - sessionSeconds * 1000); // Вычисляет начало сессии

      debug.push(
        `Обработка сессии ${nick} (альтернативный формат): начало ${sessionStart.toISOString()}, конец ${exitTime.toISOString()}, длительность ${sessionSeconds} сек`
      ); // Логирует информацию о сессии

      if (filterByDate && (exitTime < startDate || sessionStart > endDate)) { // Проверяет диапазон дат
        debug.push(
          `Сессия ${nick} (${sessionStart.toISOString()} - ${exitTime.toISOString()}): пропущена, полностью вне диапазона дат ${dateFrom} - ${dateTo}`
        ); // Логирует пропуск
        continue;
      }

      if (!players.has(nick)) { // Проверяет наличие игрока
        players.set(nick, { seconds: 0, sessions: 0 }); // Инициализирует данные игрока
        playerDaily.set(nick, new Map()); // Инициализирует ежедневные данные
      }

      const startDay = new Date(sessionStart); // Начало сессии
      startDay.setUTCHours(0, 0, 0, 0); // Устанавливает начало дня
      const endDay = new Date(exitTime); // Конец сессии
      endDay.setUTCHours(0, 0, 0, 0); // Устанавливает начало дня

      let currentDay = new Date(startDay); // Начинает с первого дня
      let sessionCounted = false; // Флаг для учёта сессии

      while (currentDay <= endDay) { // Перебирает дни сессии
        if (filterByDate && (currentDay < startDate || currentDay > endDate)) { // Проверяет диапазон дат
          debug.push(
            `Сессия ${nick} (${sessionStart.toISOString()} - ${exitTime.toISOString()}): пропущен день ${currentDay
              .toISOString()
              .slice(0, 10)}, вне диапазона дат ${dateFrom} - ${dateTo}`
          ); // Логирует пропуск дня
          currentDay.setUTCDate(currentDay.getUTCDate() + 1); // Переходит к следующему дню
          continue;
        }

        const dayStart = new Date(currentDay); // Начало дня
        const dayEnd = new Date(currentDay); // Конец дня
        dayEnd.setUTCHours(23, 59, 59, 999); // Устанавливает конец дня

        const dayStartTime = new Date(
          Math.max(sessionStart.getTime(), dayStart.getTime())
        ); // Начало сессии в дне
        const dayEndTime = new Date(
          Math.min(exitTime.getTime(), dayEnd.getTime())
        ); // Конец сессии в дне

        const rangeStart = new Date(currentDay); // Начало временного окна
        rangeStart.setUTCSeconds(fromSeconds); // Устанавливает начальное время
        const rangeEnd = new Date(currentDay); // Конец временного окна
        rangeEnd.setUTCSeconds(toSeconds); // Устанавливает конечное время

        const actualStart = new Date(
          Math.max(dayStartTime.getTime(), rangeStart.getTime())
        ); // Фактическое начало
        const actualEnd = new Date(
          Math.min(dayEndTime.getTime(), rangeEnd.getTime())
        ); // Фактический конец

        let secondsInWindow = 0; // Инициализирует время в окне
        if (actualEnd > actualStart) { // Если окно валидно
          secondsInWindow = Math.floor((actualEnd - actualStart) / 1000); // Вычисляет время в секундах

          totalSeconds += secondsInWindow; // Добавляет к общему времени
          players.get(nick).seconds += secondsInWindow; // Добавляет к времени игрока

          if (!sessionCounted && currentDay.getTime() === startDay.getTime()) { // Если сессия ещё не учтена
            players.get(nick).sessions += 1; // Увеличивает количество сессий
            sessions++; // Увеличивает общее количество сессий
            debug.push(
              `Сессия ${nick} (${sessionStart.toISOString()} - ${exitTime.toISOString()}): учтено ${secondsInWindow} сек на ${currentDay
                .toISOString()
                .slice(0, 10)} (новая сессия)`
            ); // Логирует новую сессию
          } else {
            debug.push(
              `Сессия ${nick} (${sessionStart.toISOString()} - ${exitTime.toISOString()}): учтено ${secondsInWindow} сек на ${currentDay
                .toISOString()
                .slice(0, 10)}`
            ); // Логирует учтённое время
          }

          const dateStr = currentDay.toISOString().slice(0, 10); // Формирует строку даты
          const dailyMap = playerDaily.get(nick); // Получает Map ежедневных данных
          dailyMap.set(dateStr, (dailyMap.get(dateStr) || 0) + secondsInWindow); // Добавляет время
        } else {
          debug.push(
            `Сессия ${nick} (${sessionStart.toISOString()} - ${exitTime.toISOString()}): пропущена для ${currentDay
              .toISOString()
              .slice(0, 10)}, вне временного окна ${timeFrom}-${timeTo}`
          ); // Логирует пропуск
        }

        currentDay.setUTCDate(currentDay.getUTCDate() + 1); // Переходит к следующему дню
      }
      continue;
    }

    rejected.push(line); // Добавляет нераспознанную строку в отклонённые
    debug.push(`Строка не распознана: ${line}`); // Логирует ошибку
  }

  if (filterByDate) { // Если указан диапазон дат
    for (const [nick, dailyMap] of playerDaily) { // Перебирает данные игроков
      let currentDate = new Date(startDate); // Начинает с начальной даты
      while (currentDate <= endDate) { // Перебирает все дни в диапазоне
        const dateStr = currentDate.toISOString().slice(0, 10); // Формирует строку даты
        if (!dailyMap.has(dateStr)) { // Проверяет, есть ли данные для дня
          dailyMap.set(dateStr, 0); // Устанавливает нулевое время
          debug.push(`Добавлен день ${dateStr} для ${nick} с 0 сек онлайна`); // Логирует добавление
        }
        currentDate.setUTCDate(currentDate.getUTCDate() + 1); // Переходит к следующему дню
      }
    }
  }

  for (const [nick, dailyMap] of playerDaily) { // Перебирает ежедневные данные
    debug.push(
      `Содержимое playerDaily для ${nick}: ${JSON.stringify([
        ...dailyMap.entries(),
      ])}`
    ); // Логирует содержимое Map
  }

  const human = secondsToHMS(totalSeconds); // Преобразует общее время в ЧЧ:ММ:СС
  const avg = sessions
    ? secondsToHMS(Math.floor(totalSeconds / sessions))
    : "00:00:00"; // Вычисляет среднее время сессии

  let html = `
<strong>Общая статистика</strong><br>
Всего онлайн: <strong>${human}</strong><br>
Сессий учтено: <strong>${sessions}</strong><br>
Уникальных игроков: <strong>${players.size}</strong><br>
Средняя сессия: <strong>${avg}</strong>
  `.trim(); // Формирует HTML с общей статистикой

  let perPlayerHTML = `<details style="margin-top:10px"><summary>Статистика по игрокам (${players.size})</summary><table border="1" cellpadding="4" cellspacing="0"><tr><th>Ник</th><th>Сессий</th><th>Онлайн</th><th>Средняя сессия</th><th>Средний онлайн за день</th></tr>`; // Начинает таблицу игроков
  for (const [nick, data] of [...players.entries()].sort(
    (a, b) => b[1].seconds - a[1].seconds
  )) { // Перебирает игроков, сортируя по убыванию времени
    const avgSessionTime = secondsToHMS(
      Math.floor(data.seconds / data.sessions || 0)
    ); // Вычисляет среднее время сессии игрока
    const activeDays = [...playerDaily.get(nick).values()].filter(
      (seconds) => seconds > 0
    ).length; // Подсчитывает активные дни
    const avgDailyOnline =
      activeDays > 0
        ? secondsToHMS(Math.floor(data.seconds / activeDays))
        : "00:00:00"; // Вычисляет средний онлайн за день
    perPlayerHTML += `<tr><td>${escapeHtml(nick)}</td><td>${
      data.sessions
    }</td><td>${secondsToHMS(
      data.seconds
    )}</td><td>${avgSessionTime}</td><td>${avgDailyOnline}</td></tr>`; // Добавляет строку в таблицу
  }
  perPlayerHTML += `</table></details>`; // Завершает таблицу
  html += perPlayerHTML; // Добавляет таблицу к результатам

  if (rejected.length) { // Если есть отклонённые строки
    html += `<details style="margin-top:10px"><summary>Строки не распознаны (${
      rejected.length
    })</summary><pre>${escapeHtml(rejected.join("\n"))}</pre></details>`; // Добавляет их в результаты
  }

  if (debug.length) { // Если есть отладочная информация
    html += `<details style="margin-top:10px"><summary>Отладка</summary><pre>${escapeHtml(
      debug.join("\n")
    )}</pre></details>`; // Добавляет отладку в результаты
  }

  showResult(html, true); // Отображает результаты как HTML

  chartsContainer.innerHTML = ""; // Очищает контейнер графиков

  if (filterByDate && playerDaily.size > 0) { // Если указан диапазон дат и есть данные
    const canvas = document.createElement("canvas"); // Создаёт новый канвас для графика
    canvas.id = "playersChart"; // Устанавливает ID канваса
    chartsContainer.appendChild(canvas); // Добавляет канвас в контейнер

    const dates = []; // Создаёт массив дат для графика
    const start = new Date(startDate); // Начинает с начальной даты
    while (start <= endDate) { // Перебирает дни в диапазоне
      dates.push(start.toISOString().slice(0, 10)); // Добавляет дату в формате YYYY-MM-DD
      start.setUTCDate(start.getUTCDate() + 1); // Переходит к следующему дню
    }

    const datasets = [...playerDaily.entries()].map(
      ([nick, dailyMap], index) => { // Создаёт наборы данных для каждого игрока
        const color = `hsl(${(index * 60) % 360}, 70%, 50%)`; // Генерирует уникальный цвет
        return {
          label: nick, // Метка с ником игрока
          data: dates.map((date) => (dailyMap.get(date) || 0) / 3600), // Данные в часах
          borderColor: color, // Цвет линии
          backgroundColor: `rgba(79, 70, 229, 0.2)`, // Цвет заливки
          fill: true, // Включает заливку под линией
          tension: 0.4, // Устанавливает плавность линии
        };
      }
    );

    graph.classList.remove('hidden'); // Показывает контейнер графиков

    new Chart(canvas, { // Создаёт новый график с помощью Chart.js
      type: "line", // Тип графика — линейный
      data: {
        labels: dates, // Метки по оси X (даты)
        datasets: datasets, // Наборы данных для игроков
      },
      options: {
        plugins: {
          title: {
            display: true, // Показывает заголовок графика
            text: "Онлайн игроков по дням", // Текст заголовка
            color: "#e6e6e6", // Цвет заголовка
            font: { size: 16 }, // Размер шрифта
          },
          legend: { labels: { color: "#e6e6e6" } }, // Цвет меток легенды
        },
        scales: {
          x: {
            title: { display: true, text: "Дата", color: "#e6e6e6" }, // Заголовок оси X
            ticks: { color: "#9aa0ac" }, // Цвет меток оси X
          },
          y: {
            title: { display: true, text: "Онлайн (часы)", color: "#e6e6e6" }, // Заголовок оси Y
            ticks: { color: "#9aa0ac" }, // Цвет меток оси Y
            beginAtZero: true, // Начинает ось Y с нуля
          },
        },
      },
    });
  }
});

/* ----------------------------------- */
/* Вспомогательные функции            */
/* ----------------------------------- */
function showResult(html, isHTML = false) { // Отображает результат в элементе
  resultsEl.hidden = false; // Показывает контейнер результатов
  if (isHTML) { // Если передан HTML
    resultsEl.innerHTML = html; // Вставляет HTML-контент
  } else { // Если передан текст
    resultsEl.textContent = html; // Вставляет текстовый контент
  }
}

function secondsToHMS(sec) { // Преобразует секунды в формат ЧЧ:ММ:СС
  const h = Math.floor(sec / 3600); // Вычисляет часы
  const m = Math.floor((sec % 3600) / 60); // Вычисляет минуты
  const s = sec % 60; // Вычисляет секунды
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":"); // Формирует строку времени
}

function escapeHtml(str) { // Экранирует HTML-символы
  return str.replace(
    /[&<>"']/g,
    (m) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[m])
  ); // Заменяет специальные символы на их HTML-коды
}

/* ----------------------------------- */
/* Управление режимом логов           */
/* ----------------------------------- */
const logTypeSwitcher = document.getElementById("logTypeSwitcher"); // Получает переключатель типа логов
const logsInput = document.getElementById("logsInput"); // Получает поле ввода логов
const logModeLabel = document.getElementById("logModeLabel"); // Получает метку режима логов

const placeholders = { // Объект с примерами логов для плейсхолдеров
  normal: `2025-07-26 21:07:16  Игрок Samuel_Vanore вышел с сервера, время сессии: 00:01:24, авторизация: Есть (Quit)
2025-07-26 19:57:43  Игрок Samuel_Vanore вышел с сервера, время сессии: 00:29:26, авторизация: Есть (Timeout)`,
  alt: `Игрок Samuel_Vanore вышел с сервера, время сессии: 00:07:30, авторизация: Есть (Timeout)
17 | 26.07.2025 21:17:13
Игрок Samuel_Vanore вышел с сервера, время сессии: 00:04:12, авторизация: Есть (Quit)
21 | 26.07.2025 21:56:35`
};

function updateLogModeUI() { // Обновляет интерфейс в зависимости от режима логов
  const isAlt = logTypeSwitcher.checked; // Проверяет состояние переключателя
  document.body.classList.toggle("alt-mode", isAlt); // Переключает класс alt-mode на body
  logModeLabel.textContent = isAlt ? "Лидерские логи" : "Основные логи"; // Обновляет текст метки
  logsInput.placeholder = isAlt ? placeholders.alt : placeholders.normal; // Обновляет плейсхолдер
}

logTypeSwitcher.addEventListener("change", updateLogModeUI); // Слушает изменение переключателя
updateLogModeUI(); // Устанавливает начальный режим при загрузке