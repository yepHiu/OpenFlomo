import Database from "@tauri-apps/plugin-sql";
import { appDataDir, join } from "@tauri-apps/api/path";

export interface Memo {
  id: number;
  content: string;
  tags: string;
  created_at: string;
  updated_at: string;
}

let db: Database | null = null;

async function getDb(): Promise<Database> {
  if (!db) {
    console.log("[DB] Loading database...");
    try {
      // 使用与后端相同的应用数据目录
      const dataDir = await appDataDir();
      const dbPath = await join(dataDir, "openflomo.db");
      console.log("[DB] Database path:", dbPath);
      db = await Database.load(`sqlite:${dbPath}`);

      // 初始化表（如果不存在）
      await initTable();

      console.log("[DB] Database loaded successfully");
    } catch (e) {
      console.error("[DB] Failed to load database:", e);
      alert("数据库加载失败: " + e);
      throw e;
    }
  }
  return db;
}

// 初始化数据库表
async function initTable() {
  if (!db) return;

  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS memos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT NOT NULL,
        tags TEXT DEFAULT '',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);
    console.log("[DB] Table initialized");
  } catch (e) {
    console.error("[DB] Failed to init table:", e);
  }
}

// 获取所有 memo
export async function getAllMemos(): Promise<Memo[]> {
  console.log("[DB] Getting all memos...");
  const database = await getDb();
  try {
    const result = await database.select<Memo[]>(
      "SELECT * FROM memos ORDER BY created_at DESC"
    );
    console.log("[DB] Memos fetched:", result.length, result);
    return result;
  } catch (e) {
    console.error("[DB] Failed to get memos:", e);
    alert("获取记录失败: " + e);
    throw e;
  }
}

// 创建 memo
export async function createMemo(content: string, tags: string): Promise<Memo> {
  console.log("[DB] Creating memo:", content, tags);
  const database = await getDb();
  const now = new Date().toISOString();

  try {
    const result = await database.execute(
      "INSERT INTO memos (content, tags, created_at, updated_at) VALUES (?, ?, ?, ?)",
      [content, tags, now, now]
    );
    console.log("[DB] Memo created, id:", result.lastInsertId);

    const newMemo: Memo = {
      id: result.lastInsertId as number,
      content,
      tags,
      created_at: now,
      updated_at: now,
    };

    return newMemo;
  } catch (e) {
    console.error("[DB] Failed to create memo:", e);
    alert("创建记录失败: " + e);
    throw e;
  }
}

// 更新 memo
export async function updateMemo(
  id: number,
  content: string,
  tags: string
): Promise<void> {
  const database = await getDb();
  const now = new Date().toISOString();

  await database.execute(
    "UPDATE memos SET content = ?, tags = ?, updated_at = ? WHERE id = ?",
    [content, tags, now, id]
  );
}

// 删除 memo
export async function deleteMemo(id: number): Promise<void> {
  const database = await getDb();
  await database.execute("DELETE FROM memos WHERE id = ?", [id]);
}

// 搜索 memo
export async function searchMemos(keyword: string): Promise<Memo[]> {
  const database = await getDb();
  const searchPattern = `%${keyword}%`;
  const result = await database.select<Memo[]>(
    "SELECT * FROM memos WHERE content LIKE ? OR tags LIKE ? ORDER BY created_at DESC",
    [searchPattern, searchPattern]
  );
  return result;
}

// 获取今日记录数
export async function getTodayCount(): Promise<number> {
  const database = await getDb();
  const today = new Date().toISOString().split("T")[0];
  const result = await database.select<{ count: number }[]>(
    "SELECT COUNT(*) as count FROM memos WHERE date(created_at) = date(?)",
    [today]
  );
  return result[0]?.count || 0;
}

// 热力图数据项
export interface HeatmapItem {
  date: string;
  count: number;
}

// 获取过去40天的热力图数据
export async function getHeatmapData(): Promise<HeatmapItem[]> {
  const database = await getDb();
  const result = await database.select<HeatmapItem[]>(
    `SELECT date(created_at) as date, COUNT(*) as count
     FROM memos
     WHERE date(created_at) >= date('now', '-40 days')
     GROUP BY date(created_at)
     ORDER BY date ASC`
  );
  return result;
}
