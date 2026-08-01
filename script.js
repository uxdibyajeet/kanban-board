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
      try {
        tasks = JSON.parse(savedData);
      } catch (error) {
        console.error("Corrupted localStorage data, clearing...", error);
        localStorage.removeItem("kanban_tasks");
        tasks = [];
      }
    } else {
      try {
        const response = await fetch("./tasks.json");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Response is not valid JSON");
        }
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
  };

  // NEW: Update a task's stage after drag-and-drop
  const moveTask = (taskId, newStage) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task && task.stage !== newStage) {
      task.stage = newStage;
      saveToStorage();
    }
  };

  const addForm = document.querySelector("#add-form");

  const addTask = (event) => {
    event.preventDefault();

    const taskName = addForm.elements["task_name"]?.value.trim();
    const taskDueDate = addForm.elements["due_date"]?.value;
    const taskPriority = addForm.elements["task_priority"]?.value;
    const taskDescription = addForm.elements["task_description"]?.value;
    const taskStatus = addForm.elements["task_status"]?.value;

    if (!taskName) {
      alert("Task name is required.");
      return;
    }

    const validPriorities = ["low", "medium", "high"];
    if (!validPriorities.includes(taskPriority)) {
      console.error("Invalid priority:", taskPriority);
      return;
    }

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

    return newTask;
  };

  if (addForm) {
    addForm.addEventListener("submit", (event) => {
      const newTask = addTask(event);
      if (newTask) {
        insertSingleCard(newTask);
        updateBadges();
      }
    });
  }

  return {
    createTasks,
    addForm,
    getTasks,
    loadInitialData,
    deleteTask,
    moveTask,
  };
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
      btn.setAttribute("aria-label", `Add task to ${col.label}`);

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
      cardContainer.dataset.name = col.id;

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
  cardActionBtn.setAttribute("aria-label", "Task actions");
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

  priorityBar.className = `priority-bar ${task.priority}`;

  title.textContent = task.title;
  desc.textContent = task.details;

  cardBody.append(cardActionBtn, title, desc, priorityBar, metaDataDiv);

  return cardBody;
};

// Efficient single-card operations
const insertSingleCard = (task) => {
  const container = document.querySelector(
    `.card-container[data-name="${task.stage}"]`,
  );
  if (container) {
    container.appendChild(generateCard(task));
  }
};

const removeSingleCard = (taskId) => {
  const card = document.querySelector(`.card[data-id="${taskId}"]`);
  if (card) {
    card.remove();
  }
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

// Full re-render (only used for initial load)
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

// ═══════════════════════════════════════════════════════════
// DRAG AND DROP — SortableJS
// ═══════════════════════════════════════════════════════════

const initSortable = () => {
  // Guard: bail if SortableJS isn't loaded (e.g. CDN failed)
  if (typeof Sortable === "undefined") {
    console.warn("SortableJS not loaded. Drag and drop disabled.");
    return;
  }

  const containers = document.querySelectorAll(".card-container");

  containers.forEach((container) => {
    new Sortable(container, {
      group: "kanban", // Allows dragging between columns
      animation: 150, // Smooth slide animation (ms)
      ghostClass: "dragging", // CSS class while dragging
      delay: 0,
      delayOnTouchOnly: true, // Only delay on touch devices
      touchStartThreshold: 5,

      onEnd: (evt) => {
        const card = evt.item;
        const taskId = card.dataset.id;
        const newStage = evt.to.dataset.name; // Destination column
        const oldStage = evt.from.dataset.name; // Source column

        // Only update if the card actually moved to a different column
        if (newStage !== oldStage && taskId) {
          kanbanInit.moveTask(taskId, newStage);
          updateBadges();
        }
      },
    });
  });
};

// Dropdown helpers
let activeDropdown = null;

const closeDropdown = () => {
  if (activeDropdown) {
    activeDropdown.remove();
    activeDropdown = null;
    document
      .querySelectorAll(".action-btn[aria-expanded='true']")
      .forEach((btn) => {
        btn.setAttribute("aria-expanded", "false");
      });
  }
};

const actionDropDown = (button) => {
  const dropDown = document.createElement("ul");
  dropDown.className = "dropdown-menu floating-dropdown";

  const card = button.closest(".card");
  const cardId = card?.dataset.id;

  const createMenuItem = (iconID, label, onClick) => {
    const li = document.createElement("li");
    const textSpan = document.createElement("span");
    textSpan.textContent = label;
    li.append(createIcons(iconID, "icon-sm"), textSpan);

    li.style.cursor = "pointer";
    li.addEventListener("click", (e) => {
      e.stopPropagation();
      onClick();
      closeDropdown();
    });
    return li;
  };

  dropDown.append(
    createMenuItem("img-edit-01", "Edit", () => {
      console.log("Edit clicked for card:", cardId);
      // TODO: Wire up edit modal
    }),
    createMenuItem("img-file-02", "View Details", () => {
      console.log("View Details clicked for card:", cardId);
      // TODO: Wire up detail view
    }),
    createMenuItem("img-trash-02", "Delete", () => {
      if (cardId) {
        kanbanInit.deleteTask(cardId);
        removeSingleCard(cardId);
        updateBadges();
      }
    }),
  );

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
        closeDropdown();
      }

      if (!isExpanded) {
        actionBtn.setAttribute("aria-expanded", "true");
        const menu = actionDropDown(actionBtn);
        document.body.appendChild(menu);
        activeDropdown = menu;
      }
    }
  });
}

// Close dropdown when clicking outside
document.addEventListener("click", (e) => {
  if (!e.target.closest(".action-btn") && activeDropdown) {
    closeDropdown();
  }
});

// Close dropdown with Escape key
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && activeDropdown) {
    closeDropdown();
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
  initSortable(); // Fire up drag and drop after cards are on the board
};

initApp();
