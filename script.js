/** @format */

document.addEventListener("DOMContentLoaded", () => {
  const app = document.getElementById("app");
  app.innerHTML = `
      <h1 class ="title">Поиск репозиториев GitHub</h1>
      <input type="text" id="repoInput" class="repo-input" placeholder="Введите название репозитория..." autocomplete="off">
      <div id="autocomplete-list"></div>
      <div class="repo-list" id="repoList"></div>
  `;

  const input = document.getElementById("repoInput");
  const autocompleteList = document.getElementById("autocomplete-list");
  const repoList = document.getElementById("repoList");

  let repos = [];

  function debounce(func, delay) {
    let timer;
    return function (...args) {
      const context = this;
      clearTimeout(timer);
      timer = setTimeout(() => func.apply(context, args), delay);
    };
  }

  const fetchRepositories = async (query) => {
    if (!query) {
      autocompleteList.style.display = "none";
      return;
    }

    const response = await fetch(
      `https://api.github.com/search/repositories?q=${query}&sort=stars&order=desc`
    );
    const data = await response.json();

    displayAutocomplete(data.items);
  };

  const displayAutocomplete = (items) => {
    autocompleteList.innerHTML = "";

    if (items.length === 0) {
      autocompleteList.style.display = "none";
      return;
    }

    items.slice(0, 5).forEach((item) => {
      const div = document.createElement("div");
      div.textContent = item.name;
      div.classList.add("autocomplete-item");

      div.onclick = () => {
        addRepository(item);
        input.value = "";
        autocompleteList.style.display = "none";
      };

      autocompleteList.appendChild(div);
    });

    autocompleteList.style.display = "block";
  };

  const addRepository = (repo) => {
    if (!repos.find((r) => r.id === repo.id)) {
      repos.push({
        id: repo.id,
        name: repo.name,
        owner: repo.owner.login,
        stars: repo.stargazers_count,
      });
      renderRepoList();
    }
  };

  const getRepositories = (query) => {
    if (!query) {
      autocompleteList.style.display = "none";
      return;
    }
    fetchRepositories(query);
  };

  input.addEventListener("keydown", (event) => {
    if (event.key === " " && input.value.trim() === "") {
      event.preventDefault();
    }
  });

  input.addEventListener(
    "input",
    debounce((event) => {
      getRepositories(event.target.value);
    }, 400)
  );

  const renderRepoList = () => {
    repoList.innerHTML = "";
    repos.forEach((repo) => {
      const repoItemHTML = `
        <div class="repo-item">
          <span>${repo.name} by ${repo.owner} (${repo.stars} ⭐)</span>
          <button class="remove-button" data-id="${repo.id}">Удалить</button>
        </div>
      `;
      repoList.insertAdjacentHTML("beforeend", repoItemHTML);
    });
    setupRemoveButtons();
  };

  const setupRemoveButtons = () => {
    const removeButtons = document.querySelectorAll(".remove-button");
    removeButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        const repoId = parseInt(e.target.dataset.id, 10);
        removeRepository(repoId);
      });
    });
  };

  const removeRepository = (id) => {
    repos = repos.filter((repo) => repo.id !== id);
    renderRepoList();
  };

  document.addEventListener("click", (e) => {
    if (!autocompleteList.contains(e.target) && e.target !== input) {
      autocompleteList.style.display = "none";
    }
  });
});
