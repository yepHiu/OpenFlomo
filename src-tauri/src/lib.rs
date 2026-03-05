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
        Migration {
            version: 2,
            description: "add_deleted_at_column",
            sql: "ALTER TABLE memos ADD COLUMN deleted_at TEXT;",
            kind: MigrationKind::Up,
        },
    ];

    // 根据是否为 debug 构建区分开发/正式环境数据库
    #[cfg(debug_assertions)]
    let db_name = "openflomo_dev.db";
    #[cfg(not(debug_assertions))]
    let db_name = "openflomo.db";

    let db_url = format!("sqlite:{}", db_name);

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations(&db_url, migrations)
                .build(),
        )
        .setup(move |app| {
            // 开发模式下修改窗口标题
            #[cfg(debug_assertions)]
            {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.set_title("OpenFlomo - Dev");
                }
            }

            // 获取应用数据目录并打印
            match app.path().app_data_dir() {
                Ok(app_data_dir) => {
                    println!("[OpenFlomo] App data dir: {:?}", app_data_dir);
                    let db_path = app_data_dir.join(db_name);
                    println!("[OpenFlomo] DB path: {:?}", db_path);
                    println!("[OpenFlomo] Mode: {}", if cfg!(debug_assertions) { "Development" } else { "Production" });
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
