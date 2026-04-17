export type Todo = {
  id: string;
  title: string;
  /** ISO date string (YYYY-MM-DD) or null when no due date */
  dueDate: string | null;
  completed: boolean;
  createdAt: string;
};

const STORAGE_KEY = "student-todo-list:v1";

function safeParse(raw: string | null): unknown {
  if (raw == null || raw === "") return null;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

function isTodoRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeDueDate(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string") return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  return value;
}

function normalizeTodo(raw: unknown): Todo | null {
  if (!isTodoRecord(raw)) return null;
  const id = raw.id;
  const title = raw.title;
  if (!isNonEmptyString(id) || !isNonEmptyString(title)) return null;
  const dueDate = normalizeDueDate(raw.dueDate);
  const completed = Boolean(raw.completed);
  const createdAt =
    typeof raw.createdAt === "string" && raw.createdAt.length > 0
      ? raw.createdAt
      : new Date().toISOString();
  return { id, title: title.trim(), dueDate, completed, createdAt };
}

export function loadTodos(storage: Storage = localStorage): Todo[] {
  const parsed = safeParse(storage.getItem(STORAGE_KEY));
  if (!Array.isArray(parsed)) return [];
  const todos: Todo[] = [];
  for (const item of parsed) {
    const todo = normalizeTodo(item);
    if (todo) todos.push(todo);
  }
  return todos;
}

export function saveTodos(todos: Todo[], storage: Storage = localStorage): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

export function createTodoId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
