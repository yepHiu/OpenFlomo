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

# Run development server (auto-updates version)
npm run tauri dev

# Build for production (includes TypeScript check)
npm run tauri build

# Type check only
npm run build
```

## Architecture

- **Web-first approach**: Desktop app using WebView2 on Windows
- **Data strategy**: Local SQLite database, stored in app data directory
- **Bright color scheme**: Light blue (#4FC3F7), Light green (#81C784), Light orange (#FFB74D)

### Data Layer

- Database service (`src/services/database.ts`) uses singleton pattern with lazy loading
- Uses `@tauri-apps/plugin-sql` to connect to SQLite
- Database file: `openflomo.db` (prod) or `openflomo_dev.db` (dev) in app data directory
- Memo schema: `id`, `content`, `tags` (comma-separated), `created_at`, `updated_at`, `deleted_at` (soft delete)
- All database operations are async and return typed `Memo` objects

### State Management

- Pinia store (`src/stores/memoStore.ts`) manages all memo state including:
  - Pagination with infinite scroll
  - Filtering (by tag, search query)
  - Batch selection and operations
  - Trash/recycle bin management
  - Statistics (total, today, heatmap data)

### Multi-language

- i18n support via `vue-i18n`
- Language files in `src/locales/` (en.json, zh-CN.json)
- Configured in `src/i18n/index.ts`

## File Structure

```
src/
├── main.ts                 # Vue app entry, config PrimeVue/Pinia/Router/i18n
├── App.vue                 # Root component
├── router/index.ts         # Vue Router config (home, settings)
├── styles/main.scss        # Bright theme styles
├── services/database.ts    # SQLite database service
├── stores/
│   ├── memoStore.ts        # Pinia memo state management
│   └── settingsStore.ts   # Settings state
├── i18n/index.ts           # Internationalization config
├── locales/                # Language files
│   ├── en.json
│   └── zh-CN.json
├── views/
│   ├── HomeView.vue        # Main home view
│   └── SettingsView.vue   # Settings view
└── components/
    ├── Layout/
    │   ├── TagSidebar.vue  # Left sidebar with tags
    │   └── Heatmap.vue    # Activity heatmap
    ├── Memo/
    │   ├── MemoInput.vue       # Input component
    │   ├── MemoList.vue        # List component
    │   ├── MemoCard.vue        # Card component
    │   └── MemoEditDialog.vue  # Edit dialog
    └── DataModal.vue      # Import/export modal

src-tauri/
├── src/
│   ├── main.rs            # Rust entry
│   └── lib.rs             # Tauri plugins setup
├── Cargo.toml             # Rust dependencies
└── tauri.conf.json        # Tauri configuration
```

## Implemented Features

1. **Minimal recording** - Input box with `#tag` syntax support
2. **Card list** - Reverse chronological display with relative time labels
3. **Multi-level tags** - Extract tags from content automatically
4. **Tag filtering** - Sidebar shows all tags with counts
5. **Search** - Search across content and tags
6. **Edit/Delete** - Click card to edit, delete with confirmation
7. **Statistics** - Total count, today's count, and heatmap display
8. **Trash/Recycle bin** - Soft delete with 30-day expiration
9. **Export** - Export to JSON or Markdown format
10. **Multi-language** - English and Simplified Chinese

## Tauri Configuration

- Plugins: `tauri-plugin-sql` (SQLite), `tauri-plugin-dialog`, `tauri-plugin-fs`, `tauri-plugin-opener`
- Window: 1000x700, minimum 800x600, centered on launch
- Database migrations handled in frontend `database.ts` init

## Development Guidelines

- Prioritize speed and minimal friction for recording
- New users should complete "record + tag + find" without tutorial
- Keep UI/UX lightweight - this is a "light" product
- Data must be exportable/backupable
- Tag syntax: Use `#tag` in content (e.g., `#工作 #想法`)
