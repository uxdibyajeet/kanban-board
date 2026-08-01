const kanbanInit = (() => {
  let tasks = [];

  const createTasks = (title, details, dueDate, priority, stage) => {
    return {
      id: crypto.randomUUID(),
      title,
      details,
      dueDate: dueDate || "no due date",
      priority: priority || "low",
      stage,
    };
  };

  const getTasks = () => [...tasks];

  const saveToStorage = () => {
    localStorage.setItem("kanban_tasks", JSON.stringify(tasks));
  };

  const loadInitialData = async () => {
    const savedData = localStorage.getItem("kanban_tasks");

    if (savedData) {
      tasks = JSON.parse(savedData);
    } else {
      try {
        const response = await fetch("./tasks.json");
        tasks = await response.json();
        saveToStorage();
      } catch (error) {
        console.error("Could not load tasks.json", error);
        tasks = [];
      }
    }
  };

  const deleteTask = (taskId) => {
    tasks = tasks.filter((task) => task.id !== taskId);
    saveToStorage();
    appendCard();
    updateBadges();
  };

  const addForm = document.querySelector("#add-form");

  const addTask = (event) => {
    event.preventDefault();

    const taskName = addForm.elements["task_name"]?.value;
    const taskDueDate = addForm.elements["due_date"]?.value;
    const taskPriority = addForm.elements["task_priority"]?.value;
    const taskDescription = addForm.elements["task_description"]?.value;
    const taskStatus = addForm.elements["task_status"]?.value;

    const newTask = createTasks(
      taskName,
      taskDescription,
      taskDueDate,
      taskPriority,
      taskStatus,
    );

    tasks.push(newTask);
    saveToStorage();

    addForm.reset();
    addModal.close();
    appendCard();
    updateBadges();
  };

  if (addForm) {
    addForm.addEventListener("submit", addTask);
  }

  return { createTasks, addForm, getTasks, loadInitialData, deleteTask };
})();

// SVG Helper
const createIcons = (iconId, size) => {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", size);
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");

  const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
  use.setAttribute("href", `#${iconId}`);

  svg.appendChild(use);
  return svg;
};

// Column Generator
const generateColumns = (() => {
  const STAGES = [
    { id: "backlogs", label: "backlogs" },
    { id: "to_dos", label: "to dos" },
    { id: "in_progress", label: "in progress" },
    { id: "done", label: "done" },
  ];

  const returnStages = () => STAGES;

  const boardContainer = document.querySelector(".board");

  if (boardContainer) {
    STAGES.forEach((col) => {
      const colHeader = document.createElement("div");
      const column = document.createElement("div");
      const colName = document.createElement("h2");
      const btn = document.createElement("button");
      const cardContainer = document.createElement("div");

      colName.textContent = col.label;
      btn.appendChild(createIcons("img-plus", "icon-sm"));

      btn.classList.add(
        "btn",
        "secondary",
        "btn-icon-only",
        "small",
        "hidden",
        "add-to-col",
      );

      colName.setAttribute("class", "col-header-text");
      colHeader.setAttribute("class", "col-header");
      colHeader.append(colName, btn);

      column.setAttribute("class", "column");
      cardContainer.setAttribute("class", "card-container");
      cardContainer.dataset.name = col.id; // Assign dataset directly at build time!

      column.append(colHeader, cardContainer);
      boardContainer.appendChild(column);

      colHeader.addEventListener("mouseenter", () =>
        btn.classList.remove("hidden"),
      );
      colHeader.addEventListener("mouseleave", () =>
        btn.classList.add("hidden"),
      );
    });
  }

  return { returnStages };
})();

// Card Generator
const generateCard = (task) => {
  const cardBody = document.createElement("div");
  const title = document.createElement("h3");
  const desc = document.createElement("p");
  const priorityBar = document.createElement("span");

  cardBody.className = "card";
  cardBody.dataset.id = task.id;

  const cardActionBtn = document.createElement("button");
  cardActionBtn.setAttribute("aria-expanded", "false");
  cardActionBtn.classList.add(
    "btn",
    "secondary",
    "btn-icon-only",
    "extra-small",
    "card-action-position",
    "action-btn",
  );
  cardActionBtn.appendChild(createIcons("img-dots-horizontal", "icon-sm"));

  const metaDataDiv = document.createElement("div");
  metaDataDiv.setAttribute("class", "card-meta-data");

  // Priority indicator
  const prioritySpan = document.createElement("span");
  prioritySpan.className = "priority";
  const dotIndicator = document.createElement("span");
  dotIndicator.className = `dot ${task.priority}`;
  const priorityLabel = document.createElement("p");
  priorityLabel.textContent = task.priority;
  prioritySpan.append(dotIndicator, priorityLabel);

  // Due Date indicator
  const dueDateSpan = document.createElement("span");
  dueDateSpan.className = "dueDate";
  const dueDateLabel = document.createElement("p");
  dueDateLabel.textContent = task.dueDate;
  dueDateSpan.append(createIcons("img-calendar", "icon-sm"), dueDateLabel);

  metaDataDiv.append(prioritySpan, dueDateSpan);

  // Set priority bar class once
  priorityBar.className = `priority-bar ${task.priority}`;

  title.textContent = task.title;
  desc.textContent = task.details;

  cardBody.append(cardActionBtn, title, desc, priorityBar, metaDataDiv);

  return cardBody;
};

// Badges Update
const updateBadges = () => {
  const allTasks = kanbanInit.getTasks();

  const pageTitle = document.querySelector("#page-title");
  if (pageTitle) {
    let pageBadge = pageTitle.querySelector(".info-badge");
    if (!pageBadge) {
      pageBadge = document.createElement("span");
      pageBadge.setAttribute("class", "info-badge");
      pageTitle.appendChild(pageBadge);
    }
    pageBadge.textContent = allTasks.length;
  }

  const cardContainers = document.querySelectorAll(".card-container");
  cardContainers.forEach((container) => {
    const stageName = container.dataset.name;
    const column = container.closest(".column");
    const colHeader = column?.querySelector(".col-header-text");

    if (colHeader && stageName) {
      const count = allTasks.filter((task) => task.stage === stageName).length;
      let badge = colHeader.querySelector(".info-badge");
      if (!badge) {
        badge = document.createElement("span");
        badge.setAttribute("class", "info-badge");
        colHeader.appendChild(badge);
      }
      badge.textContent = count;
    }
  });
};

// Render Cards
const appendCard = () => {
  const tasksCreated = kanbanInit.getTasks();
  const cardContainers = document.querySelectorAll(".card-container");

  cardContainers.forEach((container) => {
    container.innerHTML = "";
  });

  tasksCreated.forEach((task) => {
    const matchedContainer = Array.from(cardContainers).find(
      (container) => container.dataset.name === task.stage,
    );

    if (matchedContainer) {
      const card = generateCard(task);
      matchedContainer.appendChild(card);
    }
  });
};

// Floating Menu Handler
let activeDropdown = null;

const actionDropDown = (button) => {
  const options = ["Edit", "View Details", "Delete"];
  const dropDown = document.createElement("ul");
  dropDown.className = "dropdown-menu floating-dropdown";

  const card = button.closest(".card");
  if (card) {
    dropDown.dataset.cardId = card.dataset.id;
  }

  options.forEach((option) => {
    const li = document.createElement("li");
    li.textContent = option;
    dropDown.appendChild(li);
  });

  const rect = button.getBoundingClientRect();
  dropDown.style.position = "fixed";
  dropDown.style.top = `${rect.bottom}px`;
  dropDown.style.left = `${rect.left}px`;
  dropDown.style.zIndex = "9999";

  return dropDown;
};

// Global Event Listeners
const board = document.querySelector(".board");
if (board) {
  board.addEventListener("click", (event) => {
    const actionBtn = event.target.closest(".action-btn");

    if (actionBtn) {
      const isExpanded = actionBtn.getAttribute("aria-expanded") === "true";

      if (activeDropdown) {
        activeDropdown.remove();
        activeDropdown = null;
      }

      if (!isExpanded) {
        actionBtn.setAttribute("aria-expanded", "true");
        const menu = actionDropDown(actionBtn);
        document.body.appendChild(menu);
        activeDropdown = menu;
      } else {
        actionBtn.setAttribute("aria-expanded", "false");
      }
    }
  });
}

// Global click handling for dropdown dismissal and menu actions
document.addEventListener("click", (e) => {
  const menuItem = e.target.closest(".floating-dropdown li");

  if (menuItem && activeDropdown) {
    const action = menuItem.textContent.trim().toLowerCase();
    const cardId = activeDropdown.dataset.cardId;

    if (action === "delete" && cardId) {
      kanbanInit.deleteTask(cardId);
    }

    activeDropdown.remove();
    activeDropdown = null;

    document
      .querySelectorAll(".action-btn[aria-expanded='true']")
      .forEach((btn) => {
        btn.setAttribute("aria-expanded", "false");
      });
    return;
  }

  if (!e.target.closest(".action-btn") && activeDropdown) {
    activeDropdown.remove();
    activeDropdown = null;
    document
      .querySelectorAll(".action-btn[aria-expanded='true']")
      .forEach((btn) => {
        btn.setAttribute("aria-expanded", "false");
      });
  }
});

// Modal Listeners
const addTaskBtn = document.querySelector("#add-task");
const addModal = document.querySelector("#add-modal");
const closeAddModalBtn = document.querySelector("#close-add-modal");

if (addTaskBtn && addModal) {
  addTaskBtn.addEventListener("click", () => {
    kanbanInit.addForm?.reset();
    addModal.showModal();
  });
}

if (closeAddModalBtn && addModal) {
  closeAddModalBtn.addEventListener("click", () => {
    addModal.close();
  });
}

// App Init
const initApp = async () => {
  await kanbanInit.loadInitialData();
  appendCard();
  updateBadges();
};

initApp();
