const kanbanInit = (() => {
  // factor: create tasks
  let tasks = [];
  const createTasks = (title, details, dueDate, priority, stage) => {
    return {
      title,
      details,
      dueDate: dueDate || "no due date",
      priority,
      stage,
    };
  };

  // get tasks
  const getTasks = () => {
    return tasks;
  };

  // localStorage and JSON helper function
  const saveToStorage = () => {
    localStorage.setItem("kanban_tasks", JSON.stringify(tasks));
  };

  const loadInitalData = async () => {
    const savedData = localStorage.getItem("kanban_tasks");

    if (savedData) {
      // if data exists in localStorage
      tasks = JSON.parse(savedData);
    } else {
      //else, fetch from tasks.json
      try {
        const response = await fetch("./tasks.json");
        tasks = await response.json();
        saveToStorage(); // initial data to localStorage
      } catch (error) {
        console.error("Could not load tasks.json", error);
        tasks = []; //fallback to empty array
      }
    }
  };

  // adds task add form
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
    updateBadges();
    appendCard();
  };

  // event listners
  addForm.addEventListener("submit", addTask);

  return { createTasks, addForm, getTasks, loadInitalData };
})();

const updateBadges = () => {
  const totalTaskBadge = document.querySelector("#count-badge");
  const totalTasks = kanbanInit.getTasks().length;
  totalTaskBadge.setAttribute("class", "info-badge");
  totalTaskBadge.textContent = totalTasks;
};

// Add task modal
const addTaskBtn = document.querySelector("#add-task");
const addModal = document.querySelector("#add-modal");
addTaskBtn.addEventListener("click", (event) => {
  kanbanInit.addForm.reset();
  addModal.showModal();
});

// close add modal via close btn
const closeAddModalBtn = document.querySelector("#close-add-modal");
closeAddModalBtn.addEventListener("click", () => {
  addModal.close();
});

// generates the UI for columns
const generateColums = (() => {
  const colNames = ["backlogs", "to dos", "in progress", "done"];
  const boardContainer = document.querySelector(".board");

  colNames.forEach((col) => {
    const colHeader = document.createElement("div");
    const column = document.createElement("div");
    const colName = document.createElement("h2");
    const btn = document.createElement("button");
    const cardContainer = document.createElement("div");
    const badge = document.createElement("span");

    colName.textContent = col;

    // adds icons to the button element
    btn.innerHTML = `
        <svg class="icon" viewBox="0 0 24 24" fill="none">
            <use href="#img-plus"></use>
        </svg>`;

    btn.classList.add("btn", "secondary", "btn-icon-only", "small", "hidden");
    colName.setAttribute("class", "col-header-text");
    badge.setAttribute("class", "info-badge");
    colName.appendChild(badge);
    colHeader.setAttribute("class", "col-header");
    colHeader.append(colName, btn);
    column.setAttribute("class", "column");
    cardContainer.setAttribute("class", "card-container");

    column.append(colHeader, cardContainer);
    boardContainer.appendChild(column);

    colHeader.addEventListener("mouseenter", () => {
      btn.classList.remove("hidden");
    });
    colHeader.addEventListener("mouseleave", () => {
      btn.classList.add("hidden");
    });
  });
})();

// generate cards
const generateCard = (task) => {
  const cardBody = document.createElement("div");
  const title = document.createElement("h3");
  const desc = document.createElement("p");
  const priorityBar = document.createElement("span");

  // meta data
  const metaDataDiv = document.createElement("div"); //this container stores other data
  metaDataDiv.setAttribute("class", "card-meta-data");
  const metaData = ["priority", "dueDate"];
  metaData.forEach((item) => {
    const container = document.createElement("span");

    container.setAttribute("class", item);
    container.setAttribute("id", item);

    if (container.getAttribute("id") === "dueDate") {
      container.innerHTML = `
        <svg class="icon-sm" viewBox="0 0 24 24" fill="none">
            <use href="#img-calendar"></use>
        </svg>
        <p>${task.dueDate}</p>`;
    } else if (container.getAttribute("id") === "priority") {
      const dotIndicator = document.createElement("span");
      dotIndicator.setAttribute("class", "dot");
      const label = document.createElement("p");

      // semantic color change for the priority badge
      if (task.priority === "high") {
        dotIndicator.classList.add("high");
        label.textContent = "high";
      } else if (task.priority === "medium") {
        dotIndicator.classList.add("medium");
        label.textContent = "medium";
      } else {
        dotIndicator.classList.add("low");
        label.textContent = "low";
      }

      container.append(dotIndicator, label);
    }

    metaDataDiv.appendChild(container);

    // adding classes
    cardBody.setAttribute("class", "card");
    priorityBar.setAttribute("class", "priority-bar");

    // adding utility class to indicate task priority
    if (task.priority === "high") {
      priorityBar.classList.add("high");
    } else if (task.priority === "medium") {
      priorityBar.classList.add("medium");
    } else {
      priorityBar.classList.add("low");
    }
  });

  title.textContent = task.title;
  desc.textContent = task.details;

  cardBody.append(title, desc, priorityBar, metaDataDiv);

  return cardBody;
};

// append card to its respective status
const appendCard = () => {
  const tasksCreated = kanbanInit.getTasks();
  const names = ["backlogs", "to_dos", "in_progress", "done"];
  const cardContainer = document.querySelectorAll(".card-container");

  // assigning names to card containers with "data-*"
  cardContainer.forEach((container, i) => {
    container.innerHTML = "";
    if (names[i]) {
      container.dataset.name = names[i];
    }
  });

  // append card to a perticular column via "data-name"
  tasksCreated.forEach((task) => {
    const matchedContainer = Array.from(cardContainer).find((container) => {
      return container.dataset.name == task.stage;
    });

    if (matchedContainer) {
      const card = generateCard(task);
      matchedContainer.appendChild(card);
    }
  });
};

// initialize app on page load
const initApp = async () => {
  await kanbanInit.loadInitalData();
  updateBadges();
  appendCard();
};

initApp();
