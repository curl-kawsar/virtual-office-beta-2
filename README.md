# Student Todo List

A small, dependency-free todo list for students. Add tasks with an optional due date, mark them complete, or delete them. The app runs entirely in the browser—no backend.

## Persistence

Todos are stored in **`localStorage`** under the key `student-todo-list:v1`. Data stays on this device and browser; clearing site data for this site removes the list.

## Requirements

- [Node.js](https://nodejs.org/) 20 or newer

## Install

```bash
npm install
```

## Run (development)

```bash
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`). The dev server supports hot reload while you edit files.

## Build and preview (production)

```bash
npm run build
npm run preview
```

## Lint and tests

```bash
npm run lint
npm test
```

## How to use the app

1. **Add a todo**: Enter a short **title**. Optionally pick a **due date** for assignments, then click **Add**.
2. **Complete a todo**: Use the checkbox on the left to toggle between done and not done.
3. **Delete a todo**: Click **Delete** on the row you want to remove.

Open tasks are listed before completed ones. Due dates are highlighted when they are overdue or within the next few days.

## Scripts

| Command           | Description                    |
| ----------------- | ------------------------------ |
| `npm run dev`     | Start Vite dev server          |
| `npm run build`   | Typecheck and production build |
| `npm run preview` | Serve the production build     |
| `npm run lint`    | ESLint                         |
| `npm test`        | Vitest unit tests              |

## Tech stack

- [Vite](https://vitejs.dev/) + [TypeScript](https://www.typescriptlang.org/) (plain DOM for a minimal footprint)
- [ESLint](https://eslint.org/) flat config
- [Vitest](https://vitest.dev/) for unit tests
