# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OpenFlomo is an open-source alternative to Flomo (浮墨笔记), a lightweight note-taking and inspiration management tool. Core philosophy: "record first, organize later" - making it easy to capture ideas quickly and connect them through review.

## Tech Stack

- **Desktop Framework**: Tauri v2
- **Frontend**: Vue 3 + TypeScript + Vite
- **UI Library**: PrimeVue with Aura theme
- **State Management**: Pinia
- **Database**: SQLite (via tauri-plugin-sql)

## Commands

```bash
# Install dependencies
npm install

# Run development server
npm run tauri dev

# Build for production (includes TypeScript check)
npm run tauri build

# Type check only
npm run build
```

## Architecture

- **Web-first approach**: Desktop app using WebView2
- **Data strategy**: Local SQLite database, stored in app data directory
- **Bright color scheme**: Light blue (#4FC3F7), Light green (#81C784), Light orange (#FFB74D)

### Data Layer

- Database service (`src/services/database.ts`) uses singleton pattern with lazy loading
- Uses `@tauri-apps/plugin-sql` to connect to SQLite
- Database file: `openflomo.db` in app data directory
- Memo schema: `id`, `content`, `tags` (comma-separated), `created_at`, `updated_at`
- All database operations are async and return typed `Memo` objects

## Implemented Features (MVP)

1. **Minimal recording** - Input box with `#tag` syntax support
2. **Card list** - Reverse chronological display with time-relative labels
3. **Multi-level tags** - Extract tags from content automatically
4. **Tag filtering** - Sidebar shows all tags with counts
5. **Search** - Search across content and tags
6. **Edit/Delete** - Click card to edit, delete with confirmation
7. **Statistics** - Total count and today's count display

## File Structure

```
src/
├── main.ts                 # Vue app entry, config PrimeVue/Pinia/Router
├── App.vue                 # Root component
├── router/index.ts         # Vue Router config
├── styles/main.scss        # Bright theme styles
├── services/database.ts    # SQLite database service
├── stores/memoStore.ts     # Pinia state management
├── views/HomeView.vue      # Main home view
└── components/
    ├── Layout/TagSidebar.vue    # Left sidebar with tags
    └── Memo/
        ├── MemoInput.vue       # Input component
        ├── MemoList.vue        # List component
        ├── MemoCard.vue        # Card component
        └── MemoEditDialog.vue  # Edit dialog

src-tauri/
├── src/main.rs            # Rust entry
├── src/lib.rs             # Tauri plugins setup with SQL migrations
├── Cargo.toml             # Rust dependencies
└── tauri.conf.json        # Tauri configuration
```

## Development Guidelines

- Prioritize speed and minimal friction for recording
- New users should complete "record + tag + find" without tutorial
- Keep UI/UX lightweight - this is a "light" product
- Data must be exportable/backupable
- Tag syntax: Use `#tag` in content (e.g., `#工作 #想法`)

## Tauri Configuration

- Database migrations defined in `src-tauri/src/lib.rs`
- Window configuration in `src-tauri/tauri.conf.json`
- App uses WebView2 on Windows
