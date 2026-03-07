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
- **Styling**: SCSS
- **i18n**: vue-i18n

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

**Memo Schema:**
```typescript
interface Memo {
  id: number;           // Primary key
  content: string;      // Content
  tags: string;         // Tags (comma-separated)
  created_at: string;   // Created time (ISO)
  updated_at: string;   // Updated time (ISO)
  deleted_at?: string;  // Deletion time (soft delete)
}
```

**Database locations:**
- macOS: `~/Library/Application Support/com.openflomo.app/`
- Windows: `%APPDATA%\com.openflomo.app\`
- Linux: `~/.local/share/com.openflomo.app/`

### State Management

- Pinia store (`src/stores/memoStore.ts`) manages all memo state including:
  - Pagination with infinite scroll
  - Filtering (by tag, search query)
  - Batch selection and operations
  - Trash/recycle bin management
  - Statistics (total, today, heatmap data)

- Settings store (`src/stores/settingsStore.ts`) manages:
  - `isDarkMode` - Dark mode toggle
  - `locale` - Current language
  - `version` - App version
  - `isMac` - Platform detection

### Multi-language

- i18n support via `vue-i18n`
- Language files in `src/locales/` (en.json, zh-CN.json, ja.json)
- Configured in `src/i18n/index.ts`
- Supported locales: `zh-CN` (简体中文), `en` (English), `ja` (日本語)

### Tauri Plugins

- `tauri-plugin-sql` - SQLite database
- `tauri-plugin-dialog` - Native file dialogs
- `tauri-plugin-fs` - File system access
- `tauri-plugin-opener` - Open external links

## File Structure

```
OpenFlomo/
├── public/                  # Static assets
│   ├── version.json         # Version config
│   └── *.svg               # Icons
├── src/                    # Frontend source
│   ├── main.ts             # Vue app entry
│   ├── App.vue             # Root component
│   ├── router/index.ts     # Vue Router (/, /settings)
│   ├── styles/main.scss    # Global styles
│   ├── services/database.ts # SQLite service
│   ├── composables/useToast.ts # Toast wrapper
│   ├── utils/markdown.ts   # Markdown parser
│   ├── stores/
│   │   ├── memoStore.ts    # Memo state
│   │   └── settingsStore.ts # Settings state
│   ├── i18n/index.ts       # i18n config
│   ├── locales/            # Language files
│   │   ├── en.json
│   │   ├── zh-CN.json
│   │   └── ja.json
│   ├── views/
│   │   ├── HomeView.vue    # Main view
│   │   └── SettingsView.vue # Settings page
│   └── components/
│       ├── Layout/
│       │   ├── TagSidebar.vue # Sidebar with tags
│       │   └── Heatmap.vue    # Activity heatmap
│       ├── Memo/
│       │   ├── MemoInput.vue      # Input component
│       │   ├── MemoList.vue       # List component
│       │   ├── MemoCard.vue       # Card component
│       │   └── MemoEditDialog.vue # Edit dialog
│       └── DataModal.vue     # Import/export modal
├── src-tauri/              # Tauri backend (Rust)
│   ├── src/
│   │   ├── main.rs        # Rust entry
│   │   └── lib.rs         # Plugins setup
│   ├── Cargo.toml         # Rust dependencies
│   ├── tauri.conf.json    # Tauri config
│   └── capabilities/      # Permission config
├── docs/                   # Documentation
│   ├── ProjectStructure.md
│   ├── CrossPlatform.md
│   ├── Optimization.md
│   └── PRD.md
└── package.json
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
10. **Multi-language** - English, Simplified Chinese, Japanese
11. **Batch operations** - Batch select, delete, restore, export

## Tauri Configuration

- Window: 1000x700, minimum 800x600, centered on launch
- App identifier: `com.openflomo.app`
- Database migrations handled in frontend `database.ts` init

## Development Guidelines

- Prioritize speed and minimal friction for recording
- New users should complete "record + tag + find" without tutorial
- Keep UI/UX lightweight - this is a "light" product
- Data must be exportable/backupable
- Tag syntax: Use `#tag` in content (e.g., `#工作 #想法`)
- Use PrimeVue components for new UI elements (Dropdown, Toast, DatePicker)
- All user-facing strings must use i18n keys (no hardcoded text)
- Replace browser `alert()` with Toast notifications
