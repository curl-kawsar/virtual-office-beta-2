import { createTodoId, loadTodos, saveTodos, type Todo } from "./todoStorage";

function formatDueLabel(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  if (!y || !m || !d) return isoDate;
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function isDueWithinDays(isoDate: string, days: number): boolean {
  const [y, m, d] = isoDate.split("-").map(Number);
  if (!y || !m || !d) return false;
  const due = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  const diffMs = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= days;
}

function isPastDue(isoDate: string): boolean {
  const [y, m, d] = isoDate.split("-").map(Number);
  if (!y || !m || !d) return false;
  const due = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  return due.getTime() < today.getTime();
}

export function mountTodoApp(root: HTMLElement | null): void {
  if (!root) return;

  let todos: Todo[] = loadTodos();

  root.innerHTML = `
    <header class="app-header">
      <h1>Student Todo List</h1>
      <p>Track assignments and tasks. Your list is saved in this browser only.</p>
    </header>
    <section class="card" aria-labelledby="add-heading">
      <h2 id="add-heading" class="sr-only">Add a todo</h2>
      <form id="todo-form" class="form-row">
        <div class="field">
          <label for="todo-title">Title</label>
          <input id="todo-title" name="title" type="text" maxlength="120" required autocomplete="off" placeholder="e.g. Read chapter 4" />
        </div>
        <div class="field">
          <label for="todo-due">Due date <span class="label-hint">(optional)</span></label>
          <input id="todo-due" name="due" type="date" />
        </div>
        <button type="submit" class="btn btn-primary" id="add-btn">Add</button>
      </form>
    </section>
    <div id="list-region" style="margin-top:1rem"></div>
  `;

  const form = root.querySelector<HTMLFormElement>("#todo-form");
  const titleInput = root.querySelector<HTMLInputElement>("#todo-title");
  const dueInput = root.querySelector<HTMLInputElement>("#todo-due");
  const addBtn = root.querySelector<HTMLButtonElement>("#add-btn");
  const listRegion = root.querySelector<HTMLElement>("#list-region");

  if (!form || !titleInput || !dueInput || !addBtn || !listRegion) return;

  const persist = (): void => {
    saveTodos(todos);
  };

  const renderList = (): void => {
    if (todos.length === 0) {
      listRegion.innerHTML =
        '<p class="empty-state" role="status">No todos yet. Add your first task above.</p>';
      return;
    }

    const itemsHtml = todos
      .slice()
      .sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })
      .map((todo) => {
        const completedClass = todo.completed ? "completed" : "";
        const dueMeta =
          todo.dueDate == null
            ? ""
            : (() => {
                const label = formatDueLabel(todo.dueDate);
                let cls = "todo-meta";
                if (!todo.completed && isPastDue(todo.dueDate)) cls += " due-soon";
                else if (!todo.completed && isDueWithinDays(todo.dueDate, 3))
                  cls += " due-soon";
                return `<div class="${cls}">Due ${label}</div>`;
              })();
        const toggleLabel = todo.completed ? "Mark incomplete" : "Mark complete";
        return `
          <li class="todo-item ${completedClass}" data-id="${escapeAttr(todo.id)}">
            <input type="checkbox" class="todo-check" data-action="toggle" aria-label="${escapeAttr(toggleLabel)}" ${todo.completed ? "checked" : ""} />
            <div class="todo-main">
              <div class="todo-title">${escapeHtml(todo.title)}</div>
              ${dueMeta}
            </div>
            <div class="todo-actions">
              <button type="button" class="btn btn-ghost" data-action="delete">Delete</button>
            </div>
          </li>
        `;
      })
      .join("");

    listRegion.innerHTML = `<ul class="todo-list" aria-live="polite">${itemsHtml}</ul>`;
  };

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = titleInput.value.trim();
    if (!title) return;
    const dueRaw = dueInput.value.trim();
    const dueDate = dueRaw === "" ? null : dueRaw;
    todos = [
      {
        id: createTodoId(),
        title,
        dueDate,
        completed: false,
        createdAt: new Date().toISOString(),
      },
      ...todos,
    ];
    persist();
    titleInput.value = "";
    dueInput.value = "";
    titleInput.focus();
    renderList();
  });

  listRegion.addEventListener("change", (e) => {
    const target = e.target as HTMLElement;
    if (!(target instanceof HTMLInputElement)) return;
    if (!target.classList.contains("todo-check")) return;
    const li = target.closest<HTMLLIElement>(".todo-item");
    const id = li?.dataset.id;
    if (!id) return;
    todos = todos.map((t) => (t.id === id ? { ...t, completed: target.checked } : t));
    persist();
    renderList();
  });

  listRegion.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    if (!(target instanceof HTMLButtonElement)) return;
    if (target.dataset.action !== "delete") return;
    const li = target.closest<HTMLLIElement>(".todo-item");
    const id = li?.dataset.id;
    if (!id) return;
    todos = todos.filter((t) => t.id !== id);
    persist();
    renderList();
  });

  renderList();
}

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeAttr(text: string): string {
  return escapeHtml(text).replaceAll("'", "&#39;");
}
