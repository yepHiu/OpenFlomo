use tauri::Manager;
use tauri_plugin_sql::{Migration, MigrationKind};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![
        Migration {
            version: 1,
            description: "create_memos_table",
            sql: "CREATE TABLE IF NOT EXISTS memos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                content TEXT NOT NULL,
                tags TEXT DEFAULT '',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );",
            kind: MigrationKind::Up,
        },
    ];

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:openflomo.db", migrations)
                .build(),
        )
        .setup(|app| {
            // 获取应用数据目录并打印
            match app.path().app_data_dir() {
                Ok(app_data_dir) => {
                    println!("[OpenFlomo] App data dir: {:?}", app_data_dir);
                    // 检查数据库文件是否存在
                    let db_path = app_data_dir.join("openflomo.db");
                    println!("[OpenFlomo] DB path: {:?}", db_path);
                }
                Err(e) => {
                    println!("[OpenFlomo] Failed to get app data dir: {:?}", e);
                }
            }
            println!("[OpenFlomo] App setup complete, SQL plugin loaded");
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
