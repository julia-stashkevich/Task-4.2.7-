/** @format */

// Слушаем событие DOMContentLoaded, чтобы убедиться, что весь HTML загружен перед выполнением JavaScript кода
document.addEventListener("DOMContentLoaded", () => {
  // Получаем элемент с id "app", в который будем добавлять содержимое
  const app = document.getElementById("app");

  // Добавляем структуру нашего приложения: заголовок, поле ввода и два контейнера для автокомплита и списка репозиториев
  app.innerHTML = `
      <h1 class ="title">Поиск репозиториев GitHub</h1>
      <input type="text" id="repoInput" class="repo-input" placeholder="Введите название репозитория..." autocomplete="off">
      <div id="autocomplete-list"></div>
      <div class="repo-list" id="repoList"></div>
  `;

  // Получаем ссылки на элементы введенного поля, списка автокомплита и списка репозиториев
  const input = document.getElementById("repoInput");
  const autocompleteList = document.getElementById("autocomplete-list");
  const repoList = document.getElementById("repoList");

  // Массив для хранения добавленных репозиториев
  let repos = [];

  // Функция "debounce" для ограничения количества вызовов функции за определенный промежуток времени
  function debounce(func, delay) {
    let timer; // Переменная для хранения таймера
    return function (...args) {
      // Возвращаем новую функцию
      const context = this; // Сохраняем контекст
      clearTimeout(timer); // Сбрасываем таймер, если функция вызывается снова
      timer = setTimeout(() => func.apply(context, args), delay); // Устанавливаем новый таймер
    };
  }

  // Асинхронная функция для получения репозиториев с API GitHub на основе введенного запроса
  const fetchRepositories = async (query) => {
    // Если поле ввода пустое, скрываем список автокомплита и выходим из функции
    if (!query) {
      autocompleteList.style.display = "none";
      return;
    }

    // Выполняем запрос к API GitHub с введенным пользователем запросом
    const response = await fetch(
      `https://api.github.com/search/repositories?q=${query}&sort=stars&order=desc`
    );

    // Преобразуем ответ в формате JSON
    const data = await response.json();

    // Вызываем функцию для отображения результатов автокомплита
    displayAutocomplete(data.items);
  };

  // Функция для отображения элементов автокомплита
  const displayAutocomplete = (items) => {
    // Очищаем предыдущие элементы в списке автокомплита
    autocompleteList.innerHTML = "";

    // Если нет полученных элементов, скрываем список и выходим из функции
    if (items.length === 0) {
      autocompleteList.style.display = "none";
      return;
    }

    // Ограничиваем количество отображаемых элементов до 5
    items.slice(0, 5).forEach((item) => {
      // Создаем новый div элемент для каждого элемента автокомплита
      const div = document.createElement("div");

      // Устанавливаем текст элемента как название репозитория
      div.textContent = item.name;

      // Добавляем класс стиля для элемента
      div.classList.add("autocomplete-item");

      // При клике на элемент добавляем репозиторий в список и очищаем поле ввода
      div.onclick = () => {
        addRepository(item);
        input.value = ""; // Очищаем поле ввода
        autocompleteList.style.display = "none"; // Скрываем список автокомплита
      };

      // Добавляем созданный div в контейнер списка автокомплита
      autocompleteList.appendChild(div);
    });

    // Показываем список автокомплита
    autocompleteList.style.display = "block";
  };

  // Функция для добавления репозитория в массив и отображения списка
  const addRepository = (repo) => {
    // Проверяем, не добавлен ли уже репозиторий
    if (!repos.find((r) => r.id === repo.id)) {
      // Добавляем репозиторий в массив
      repos.push({
        id: repo.id,
        name: repo.name,
        owner: repo.owner.login,
        stars: repo.stargazers_count,
      });
      // Обновляем отображение списка репозиториев
      renderRepoList();
    }
  };

  // Функция для отображения списка добавленных репозиториев
  const renderRepoList = () => {
    repoList.innerHTML = repos
      .map(
        (repo) => `
          <div class="repo-item">
              <span>${repo.name} by ${repo.owner} (${repo.stars} ⭐)</span>
              <button class="remove-button" data-id="${repo.id}">Удалить</button>
          </div>
      `
      )
      .join("");

    // Привязка события клика к каждой кнопке "Удалить"
    const removeButtons = document.querySelectorAll(".remove-button");
    removeButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        const repoId = parseInt(e.target.dataset.id, 10);
        removeRepository(repoId);
      });
    });
  };

  // Функция для удаления репозитория из списка
  const removeRepository = (id) => {
    // Фильтруем массив, оставляя только те репозитории, которые не соответствуют удаляемому
    repos = repos.filter((repo) => repo.id !== id);
    // Обновляем отображение списка репозиториев
    renderRepoList();
  };

  // Добавляем обработчик события на поле ввода для выполнения функции с использованием дебаунса
  input.addEventListener(
    "input",
    debounce((event) => {
      // Вызываем функцию для получения репозиториев при вводе текста
      fetchRepositories(event.target.value);
    }, 300) // Задержка в 300 мс перед выполнением функции
  );

  // Добавляем обработчик события на весь документ для скрытия списка автокомплита при клике вне его
  document.addEventListener("click", (e) => {
    // Проверяем, кликнули ли вне списка автокомплита и поля ввода
    if (!autocompleteList.contains(e.target) && e.target !== input) {
      autocompleteList.style.display = "none"; // Скрываем список автокомплита
    }
  });
});
