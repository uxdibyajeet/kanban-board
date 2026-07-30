// generates the UI for columns
const generateColums = (() => {
  const colNames = ["backlogs", "to dos", "in progress", "done"];
  const boardContainer = document.querySelector(".board");
  colNames.forEach((col) => {
    const colHeader = document.createElement("div");
    const column = document.createElement("div");
    const colName = document.createElement("h2");

    colName.textContent = col;

    colName.setAttribute("class", "col-header-text");
    colHeader.setAttribute("class", "col-header");
    colHeader.appendChild(colName);
    column.setAttribute("class", "column");
    column.appendChild(colHeader);
    boardContainer.appendChild(column);
  });
})();

// Add task modal
const addTaskBtn = document.querySelector("#add-task");
const addModal = document.querySelector("#add-modal");
addTaskBtn.addEventListener("click", (event) => {
  addModal.showModal();
});

// factor: create tasks
let tasks = [];
const createTasks = (title, details, duedate, priority) => {
  return [title, details, duedate, priority];
};
