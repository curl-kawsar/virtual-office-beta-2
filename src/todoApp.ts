import { createTodoId, loadTodos, saveTodos, type Todo } from "./todoStorage";

function parseLocalDate(ymd: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const date = new Date(y, mo, d);
  if (date.getFullYear() !== y || date.getMonth() !== mo || date.getDate() !== d) {
    return null;
  }
  return date;
}

function startOfToday(): Date {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}

function formatDueLabel(isoDate: string): string {
  const due = parseLocalDate(isoDate);
  if (!due) return isoDate;
  return due.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function dueMetaHtml(dueIso: string, completed: boolean): string {
  if (completed) {
    return `<div class="todo-meta">Due ${escapeHtml(formatDueLabel(dueIso))}</div>`;
  }
  const due = parseLocalDate(dueIso);
  if (!due) {
    return `<div class="todo-meta">Due ${escapeHtml(dueIso)}</div>`;
  }
  const today = startOfToday();
  const diffDays = Math.round((due.getTime() - today.getTime()) / 86400000);
  const shortDate = due.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  if (diffDays < 0) {
    return `<div class="todo-meta todo-meta--overdue">Overdue (${escapeHtml(shortDate)})</div>`;
  }
  if (diffDays === 0) {
    return `<div class="todo-meta todo-meta--soon">Due today (${escapeHtml(shortDate)})</div>`;
  }
  if (diffDays <= 3) {
    const dayWord = diffDays === 1 ? "day" : "days";
    return `<div class="todo-meta todo-meta--soon">Due in ${diffDays} ${dayWord} (${escapeHtml(shortDate)})</div>`;
  }
  return `<div class="todo-meta">Due ${escapeHtml(shortDate)}</div>`;
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
        const dueMeta = todo.dueDate == null ? "" : dueMetaHtml(todo.dueDate, todo.completed);
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
