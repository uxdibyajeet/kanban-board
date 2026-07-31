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

  // adds task add form
  const addForm = document.querySelector("#add-form");

  const addTask = (event) => {
    event.preventDefault();

    const taskName = addForm.elements["task_name"]?.value;
    const taskDueDate = addForm.elements["due_date"]?.value;
    const taskPriority = addForm.elements["task_priority"]?.value;
    const taskDescription = addForm.elements["task_description"]?.value;

    const newTask = createTasks(
      taskName,
      taskDescription,
      taskDueDate,
      taskPriority,
    );

    tasks.push(newTask);
    addForm.reset();
    addModal.close();
    updateTotalTasksBadge();
    generateCard();
  };

  // event listners
  addForm.addEventListener("submit", addTask);

  return { createTasks, addForm, getTasks };
})();

const updateTotalTasksBadge = () => {
  const badge = document.querySelector("#count-badge");
  const totalTasks = kanbanInit.getTasks().length;
  badge.setAttribute("class", "info-badge");
  badge.textContent = totalTasks;
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
    // const badge = document.createElement("span");

    colName.textContent = col;

    // adds icons to the button element
    btn.innerHTML = `
        <svg class="icon" viewBox="0 0 24 24" fill="none">
            <use href="#img-plus"></use>
        </svg>`;

    btn.classList.add("btn", "secondary", "btn-icon-only", "small", "hidden");
    colName.setAttribute("class", "col-header-text");
    // badge.setAttribute("class", "info-badge");
    // colName.appendChild(badge);
    colHeader.setAttribute("class", "col-header");
    colHeader.append(colName, btn);
    column.setAttribute("class", "column");
    cardContainer.setAttribute("id", "card-container");
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
const generateCard = () => {
  const cardArr = kanbanInit.getTasks();
  const board = document.querySelector(".board");
  const cardContainer = board.querySelectorAll("#card-container");
  cardContainer[0].innerHTML = "";

  cardArr.forEach((card) => {
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
        <p>${card.dueDate}</p>`;
      } else if (container.getAttribute("id") === "priority") {
        container.innerHTML = `
        <svg class="icon-sm" viewBox="0 0 24 24" fill="none">
            <use href="#img-calendar"></use>
        </svg>`;
      }

      metaDataDiv.appendChild(container);
    });

    title.textContent = card.title;
    desc.textContent = card.details;

    cardBody.append(title, desc, priorityBar, metaDataDiv);

    // adding classes
    cardBody.setAttribute("class", "card");
    priorityBar.setAttribute("class", "priority-bar");
    cardContainer[0].appendChild(cardBody);

    // adding utility class to indicate task priority
    if (card.priority === "high") {
      priorityBar.classList.add("high");
    } else if (card.priority === "medium") {
      priorityBar.classList.add("medium");
    } else {
      priorityBar.classList.add("low");
    }
  });
};
