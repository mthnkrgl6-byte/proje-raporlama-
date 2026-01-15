const STORAGE_KEY = "assignment-dashboard";

const defaultState = {
  users: [
    { id: "u1", name: "Ege Bölge Müdürü" },
    { id: "u2", name: "Marmara Bölge Müdürü" },
    { id: "u3", name: "İç Anadolu Bölge Müdürü" },
    { id: "u4", name: "Karadeniz Bölge Müdürü" },
  ],
  categories: [
    { id: "c1", name: "Personel Yönetimi" },
    { id: "c2", name: "Depo Yönetimi" },
    { id: "c3", name: "Finans" },
  ],
  tasks: [
    {
      id: "t1",
      title: "Aylık stok sayım raporu",
      categoryId: "c2",
      dueDate: "2024-12-15",
      interval: "Aylık",
      details: "Depo stokları ve sapma raporları paylaşılacak.",
      assignments: {
        u1: "pending",
        u2: "done",
        u3: "pending",
        u4: "failed",
      },
    },
  ],
};

const elements = {
  totalTasks: document.getElementById("totalTasks"),
  totalCategories: document.getElementById("totalCategories"),
  totalUsers: document.getElementById("totalUsers"),
  taskForm: document.getElementById("taskForm"),
  categorySelect: document.getElementById("categorySelect"),
  userCheckboxes: document.getElementById("userCheckboxes"),
  categoryList: document.getElementById("categoryList"),
  newCategoryInput: document.getElementById("newCategoryInput"),
  addCategoryButton: document.getElementById("addCategoryButton"),
  newUserInput: document.getElementById("newUserInput"),
  addUserButton: document.getElementById("addUserButton"),
  userList: document.getElementById("userList"),
  taskList: document.getElementById("taskList"),
  filterCategory: document.getElementById("filterCategory"),
  filterStatus: document.getElementById("filterStatus"),
};

const loadState = () => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return structuredClone(defaultState);
  }
  try {
    const parsed = JSON.parse(raw);
    return {
      users: parsed.users ?? structuredClone(defaultState.users),
      categories: parsed.categories ?? structuredClone(defaultState.categories),
      tasks: parsed.tasks ?? structuredClone(defaultState.tasks),
    };
  } catch (error) {
    return structuredClone(defaultState);
  }
};

const saveState = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

let state = loadState();

const buildCategoryOptions = () => {
  const options = state.categories
    .map((category) => `<option value="${category.id}">${category.name}</option>`)
    .join("");

  elements.categorySelect.innerHTML = options;
  elements.filterCategory.innerHTML =
    `<option value="all">Tümü</option>` + options;
};

const buildUserCheckboxes = () => {
  elements.userCheckboxes.innerHTML = state.users
    .map(
      (user) => `
      <label class="user-chip">
        <input type="checkbox" name="assignees" value="${user.id}" checked />
        ${user.name}
      </label>
    `,
    )
    .join("");
};

const updateSummary = () => {
  elements.totalTasks.textContent = state.tasks.length;
  elements.totalCategories.textContent = state.categories.length;
  elements.totalUsers.textContent = state.users.length;
};

const categoryNameById = (id) => {
  return state.categories.find((category) => category.id === id)?.name ?? "-";
};

const taskCompletionState = (task) => {
  const statuses = Object.values(task.assignments);
  if (!statuses.length) {
    return "pending";
  }
  if (statuses.every((status) => status === "done")) {
    return "completed";
  }
  return "pending";
};

const formatDate = (value) => {
  if (!value) {
    return "Süre belirtilmedi";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const renderCategoryList = () => {
  elements.categoryList.innerHTML = state.categories
    .map(
      (category) => `
      <li class="category-item">
        <span>${category.name}</span>
        <button type="button" data-id="${category.id}" class="edit-category">Düzenle</button>
      </li>
    `,
    )
    .join("");
};

const renderUserList = () => {
  elements.userList.innerHTML = state.users
    .map(
      (user) => `
      <li class="category-item">
        <span>${user.name}</span>
        <button type="button" data-id="${user.id}" class="edit-user">Düzenle</button>
      </li>
    `,
    )
    .join("");
};

const renderTasks = () => {
  const filterCategory = elements.filterCategory.value;
  const filterStatus = elements.filterStatus.value;

  const filteredTasks = state.tasks.filter((task) => {
    const categoryMatch = filterCategory === "all" || task.categoryId === filterCategory;
    const statusMatch =
      filterStatus === "all" || taskCompletionState(task) === filterStatus;
    return categoryMatch && statusMatch;
  });

  if (filteredTasks.length === 0) {
    elements.taskList.innerHTML =
      "<div class=\"task-card\">Filtrelere uygun görev bulunamadı.</div>";
    return;
  }

  elements.taskList.innerHTML = filteredTasks
    .map((task) => {
      const completion = taskCompletionState(task);
      const completionLabel =
        completion === "completed" ? "Tümü tamamlandı" : "Tamamlanmayı bekliyor";

      const assignedUsers = state.users.filter((user) => task.assignments[user.id]);
      const assignmentsHtml = assignedUsers
        .map((user) => {
          const status = task.assignments[user.id] ?? "pending";
          const statusLabel =
            status === "done" ? "Tamamlandı" : status === "failed" ? "Yapılmadı" : "Beklemede";
          const statusClass =
            status === "done" ? "done" : status === "failed" ? "" : "pending";

          return `
            <div class="assignment-card">
              <div class="assignment-header">
                <span>${user.name}</span>
                <span class="status-pill ${statusClass}">${statusLabel}</span>
              </div>
              <div class="assignment-actions">
                <button class="done" data-task="${task.id}" data-user="${user.id}" data-status="done">✓</button>
                <button class="fail" data-task="${task.id}" data-user="${user.id}" data-status="failed">✕</button>
                <button class="reset" data-task="${task.id}" data-user="${user.id}" data-status="pending">↺</button>
              </div>
            </div>
          `;
        })
        .join("");

      return `
        <article class="task-card">
          <div class="task-meta">
            <h3>${task.title}</h3>
            <span class="completion-status">${completionLabel}</span>
          </div>
          <div class="badges">
            <span class="badge">${categoryNameById(task.categoryId)}</span>
            <span class="badge">${task.interval}</span>
            <span class="badge">${formatDate(task.dueDate)}</span>
          </div>
          <p class="task-details">${task.details || "Açıklama eklenmedi."}</p>
          ${
            assignmentsHtml
              ? `<div class="assignment-list">${assignmentsHtml}</div>`
              : `<div class="task-details">Bu görev için kullanıcı ataması yok.</div>`
          }
        </article>
      `;
    })
    .join("");
};

const refreshUI = () => {
  buildCategoryOptions();
  buildUserCheckboxes();
  renderCategoryList();
  renderUserList();
  renderTasks();
  updateSummary();
};

const addCategory = (name) => {
  const trimmed = name.trim();
  if (!trimmed) {
    return;
  }
  const exists = state.categories.some(
    (category) => category.name.toLowerCase() === trimmed.toLowerCase(),
  );
  if (exists) {
    return;
  }
  const newCategory = {
    id: `c${crypto.randomUUID().slice(0, 6)}`,
    name: trimmed,
  };
  state.categories.push(newCategory);
  saveState();
  refreshUI();
};

const updateCategory = (id, name) => {
  const trimmed = name.trim();
  if (!trimmed) {
    return;
  }
  const category = state.categories.find((item) => item.id === id);
  if (!category) {
    return;
  }
  category.name = trimmed;
  saveState();
  refreshUI();
};

const addUser = (name) => {
  const trimmed = name.trim();
  if (!trimmed) {
    return;
  }
  const exists = state.users.some((user) => user.name.toLowerCase() === trimmed.toLowerCase());
  if (exists) {
    return;
  }
  const newUser = {
    id: `u${crypto.randomUUID().slice(0, 6)}`,
    name: trimmed,
  };
  state.users.push(newUser);
  saveState();
  refreshUI();
};

const updateUser = (id, name) => {
  const trimmed = name.trim();
  if (!trimmed) {
    return;
  }
  const user = state.users.find((item) => item.id === id);
  if (!user) {
    return;
  }
  user.name = trimmed;
  saveState();
  refreshUI();
};

const addTask = (data) => {
  const selectedUsers = data.assignees ?? [];
  const assignments = selectedUsers.reduce((acc, userId) => {
    acc[userId] = "pending";
    return acc;
  }, {});

  const newTask = {
    id: `t${crypto.randomUUID().slice(0, 6)}`,
    title: data.title,
    categoryId: data.category,
    dueDate: data.dueDate,
    interval: data.interval,
    details: data.details,
    assignments,
  };

  state.tasks.unshift(newTask);
  saveState();
  refreshUI();
};

const updateAssignmentStatus = (taskId, userId, status) => {
  const task = state.tasks.find((item) => item.id === taskId);
  if (!task) {
    return;
  }
  task.assignments[userId] = status;
  saveState();
  renderTasks();
  updateSummary();
};

const setupListeners = () => {
  elements.taskForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(elements.taskForm);
    const data = Object.fromEntries(formData.entries());
    data.assignees = formData.getAll("assignees");

    if (!data.assignees.length) {
      alert("En az bir kullanıcı seçmelisiniz.");
      return;
    }

    addTask(data);
    elements.taskForm.reset();
    buildUserCheckboxes();
  });

  elements.addCategoryButton.addEventListener("click", () => {
    addCategory(elements.newCategoryInput.value);
    elements.newCategoryInput.value = "";
  });

  elements.addUserButton.addEventListener("click", () => {
    addUser(elements.newUserInput.value);
    elements.newUserInput.value = "";
  });

  elements.categoryList.addEventListener("click", (event) => {
    const button = event.target.closest(".edit-category");
    if (!button) {
      return;
    }
    const id = button.dataset.id;
    const category = state.categories.find((item) => item.id === id);
    if (!category) {
      return;
    }
    const newName = prompt("Kategori adını güncelleyin:", category.name);
    if (newName) {
      updateCategory(id, newName);
    }
  });

  elements.userList.addEventListener("click", (event) => {
    const button = event.target.closest(".edit-user");
    if (!button) {
      return;
    }
    const id = button.dataset.id;
    const user = state.users.find((item) => item.id === id);
    if (!user) {
      return;
    }
    const newName = prompt("Kullanıcı adını güncelleyin:", user.name);
    if (newName) {
      updateUser(id, newName);
    }
  });

  elements.taskList.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-task]");
    if (!button) {
      return;
    }
    updateAssignmentStatus(button.dataset.task, button.dataset.user, button.dataset.status);
  });

  elements.filterCategory.addEventListener("change", renderTasks);
  elements.filterStatus.addEventListener("change", renderTasks);
};

refreshUI();
setupListeners();
