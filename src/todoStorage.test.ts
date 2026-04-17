import { describe, expect, it } from "vitest";
import { loadTodos, saveTodos, type Todo } from "./todoStorage";

function makeMemoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear(): void {
      map.clear();
    },
    getItem(key: string): string | null {
      return map.has(key) ? map.get(key)! : null;
    },
    key(index: number): string | null {
      return [...map.keys()][index] ?? null;
    },
    removeItem(key: string): void {
      map.delete(key);
    },
    setItem(key: string, value: string): void {
      map.set(key, value);
    },
  };
}

describe("todoStorage", () => {
  it("round-trips valid todos", () => {
    const storage = makeMemoryStorage();
    const sample: Todo[] = [
      {
        id: "a",
        title: "Essay draft",
        dueDate: "2026-04-20",
        completed: false,
        createdAt: "2026-04-17T12:00:00.000Z",
      },
      {
        id: "b",
        title: "No due date",
        dueDate: null,
        completed: true,
        createdAt: "2026-04-16T12:00:00.000Z",
      },
    ];
    saveTodos(sample, storage);
    expect(loadTodos(storage)).toEqual(sample);
  });

  it("ignores invalid stored payloads", () => {
    const storage = makeMemoryStorage();
    storage.setItem("student-todo-list:v1", "not-json");
    expect(loadTodos(storage)).toEqual([]);
  });

  it("filters out malformed todo entries", () => {
    const storage = makeMemoryStorage();
    storage.setItem(
      "student-todo-list:v1",
      JSON.stringify([
        { id: "ok", title: "Good", dueDate: null, completed: false, createdAt: "2026-04-17T00:00:00.000Z" },
        { id: "", title: "Bad id", dueDate: null, completed: false },
        { title: "Bad shape" },
      ]),
    );
    const loaded = loadTodos(storage);
    expect(loaded).toHaveLength(1);
    expect(loaded[0]?.id).toBe("ok");
  });
});
