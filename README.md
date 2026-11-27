# Torvo — Glass Sidebar

An original rebuild of the "Torvo" glass sidebar component showcase, built from a
video description. All code in this project was written from scratch for this rebuild;
no third-party source code was copied.

## What it is

A full working demo app shell whose star is a dark glassmorphism sidebar that
collapses to icons. Very dark background (`#0B0F14` / `#111827`) with glass panels
(white/5 blur, white/10 borders) and violet/cyan accents for active states.

## Features

- **Collapsible glass sidebar** — toggles between 264px and icon-only 76px with a
  300ms `cubic-bezier(0.22, 1, 0.36, 1)` width transition.
- **Navigation** — Dashboard, Tasks, Activities (badge: 23), Teams, Projects,
  Calendar. Each item switches the main content to a real working view.
- **Projects section** — Mobile Banking App and Brand Refresh, each with a colored dot.
- **User card** — Ava Chen, Product Designer, with avatar initials and the collapse toggle.
- **Dashboard** — greeting, 4 stat cards (12 active projects, 8 tasks due today,
  6 team online, 34.5 hours logged) and a recent-activity feed.
- **Tasks** — checkable task list (toggle done), add-task input, clear-completed,
  remaining/done counts.
- **Activities** — 23 entries matching the sidebar badge, filterable by
  All / Comments / Updates.
- **Teams** — member cards with roles and online/offline status.
- **Projects** — four project cards with progress bars, status pills and due dates.
- **Calendar** — November 2026 month grid (Nov 1, 2026 is a Sunday); clicking a day
  shows that day's events.
- **Search** — the header search filters the list of the current view.
- **Bilingual EN/AR** — full interface in English and Arabic with RTL layout;
  the language preference is saved.
- **Persistence** — sidebar state, current view, tasks and selected day are saved
  in `localStorage` under `torvo-state-v1`; language under `torvo-lang`.
- All data is labelled demo data. No placeholder text is used anywhere.

## Tech

React 19 + TypeScript + Vite + Tailwind CSS v4, `@phosphor-icons/react` icons,
Manrope font.

## Run

```bash
npm run build   # typecheck + production build
npm run dev     # local dev server
npm run preview # serve the production build
```

## Originality note

This is an original implementation inspired by a short video of the Torvo sidebar
concept. The layout, code, copy and demo data are all original; no paid template
or source code was used.
