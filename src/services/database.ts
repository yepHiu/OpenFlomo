import Database from "@tauri-apps/plugin-sql";
import { appDataDir, join } from "@tauri-apps/api/path";

// 开发环境日志
const isDev = import.meta.env.DEV;
const devLog = (fn: () => void) => {
  if (isDev) fn();
};

export interface Memo {
  id: number;
  content: string;
  tags: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

let db: Database | null = null;

async function getDb(): Promise<Database> {
  if (!db) {
    devLog(() => console.log("[DB] Loading database..."));
    try {
      // 使用与后端相同的应用数据目录
      const dataDir = await appDataDir();
      // 根据环境使用不同数据库名（与后端保持一致）
      const isDevEnv = import.meta.env.DEV;
      const dbName = isDevEnv ? "openflomo_dev.db" : "openflomo.db";
      const dbPath = await join(dataDir, dbName);
      devLog(() => console.log("[DB] Database path:", dbPath));
      devLog(() => console.log("[DB] Mode:", isDevEnv ? "Development" : "Production"));
      db = await Database.load(`sqlite:${dbPath}`);

      // 初始化表（如果不存在）
      await initTable();

      devLog(() => console.log("[DB] Database loaded successfully"));
    } catch (e) {
      console.error("[DB] Failed to load database:", e);
      throw new Error("数据库加载失败: " + e);
    }
  }
  return db;
}

// 初始化数据库表
async function initTable() {
  if (!db) return;

  try {
    // 创建表（如果不存在）
    await db.execute(`
      CREATE TABLE IF NOT EXISTS memos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT NOT NULL,
        tags TEXT DEFAULT '',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT
      )
    `);

    // 检查 deleted_at 列是否存在，不存在则添加
    try {
      await db.execute("SELECT deleted_at FROM memos LIMIT 1");
    } catch {
      await db.execute("ALTER TABLE memos ADD COLUMN deleted_at TEXT");
      devLog(() => console.log("[DB] Added deleted_at column"));
    }

    devLog(() => console.log("[DB] Table initialized"));
  } catch (e) {
    console.error("[DB] Failed to init table:", e);
  }
}

// 获取所有未删除的 memo
export async function getAllMemos(): Promise<Memo[]> {
  devLog(() => console.log("[DB] Getting all memos..."));
  const database = await getDb();
  try {
    const result = await database.select<Memo[]>(
      "SELECT * FROM memos WHERE deleted_at IS NULL ORDER BY created_at DESC"
    );
    devLog(() => console.log("[DB] Memos fetched:", result.length, result));
    return result;
  } catch (e) {
    console.error("[DB] Failed to get memos:", e);
    throw new Error("获取记录失败: " + e);
  }
}

// 分页获取未删除的 memo
export async function getMemosByPage(offset: number, limit: number): Promise<Memo[]> {
  devLog(() => console.log("[DB] Getting memos by page:", offset, limit));
  const database = await getDb();
  try {
    const result = await database.select<Memo[]>(
      "SELECT * FROM memos WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT ? OFFSET ?",
      [limit, offset]
    );
    devLog(() => console.log("[DB] Memos fetched:", result.length, "offset:", offset));
    return result;
  } catch (e) {
    console.error("[DB] Failed to get memos by page:", e);
    throw e;
  }
}

// 获取 memo 总数（可选是否包含回收站）
export async function getMemoCount(includeTrash: boolean = false): Promise<number> {
  const database = await getDb();
  try {
    let sql = "SELECT COUNT(*) as count FROM memos";
    if (!includeTrash) {
      sql += " WHERE deleted_at IS NULL";
    }
    const result = await database.select<{ count: number }[]>(sql);
    return result[0]?.count || 0;
  } catch (e) {
    console.error("[DB] Failed to get memo count:", e);
    throw e;
  }
}

// 导出选项接口
export interface ExportOptions {
  format: "json" | "markdown";
  startDate?: string;
  endDate?: string;
  tags?: string[];
  ids?: number[];
}

// 根据 ID 数组获取 memo（用于批量导出）
export async function getMemoByIds(ids: number[]): Promise<Memo[]> {
  if (ids.length === 0) return [];
  const database = await getDb();
  const placeholders = ids.map(() => "?").join(",");
  try {
    const result = await database.select<Memo[]>(
      `SELECT * FROM memos WHERE id IN (${placeholders}) ORDER BY created_at DESC`,
      ids
    );
    return result;
  } catch (e) {
    console.error("[DB] Failed to get memos by ids:", e);
    throw e;
  }
}

// 根据条件获取 memo（用于导出，只包含未删除的）
export async function getMemosByFilter(options: ExportOptions): Promise<Memo[]> {
  const database = await getDb();
  let sql = "SELECT * FROM memos WHERE deleted_at IS NULL";
  const params: (string | number)[] = [];

  if (options.ids && options.ids.length > 0) {
    const placeholders = options.ids.map(() => "?").join(",");
    sql += ` AND id IN (${placeholders})`;
    params.push(...options.ids);
  }

  if (options.startDate) {
    sql += " AND date(created_at) >= date(?)";
    params.push(options.startDate);
  }

  if (options.endDate) {
    sql += " AND date(created_at) <= date(?)";
    params.push(options.endDate);
  }

  if (options.tags && options.tags.length > 0) {
    const tagConditions = options.tags.map(() => "tags LIKE ?").join(" OR ");
    sql += ` AND (${tagConditions})`;
    options.tags.forEach((tag) => params.push(`%${tag}%`));
  }

  sql += " ORDER BY created_at DESC";

  try {
    const result = await database.select<Memo[]>(sql, params);
    devLog(() => console.log("[DB] Memos fetched by filter:", result.length));
    return result;
  } catch (e) {
    console.error("[DB] Failed to get memos by filter:", e);
    throw e;
  }
}

// 转换为 Markdown 格式
function formatAsMarkdown(memos: Memo[]): string {
  let md = "# OpenFlomo 导出\n\n";
  md += `> 导出时间: ${new Date().toLocaleString()}\n\n`;
  md += `> 共 ${memos.length} 条记录\n\n---\n\n`;

  for (const memo of memos) {
    md += `## ${memo.created_at.replace("T", " ").slice(0, 16)}\n\n`;
    if (memo.tags) {
      const tags = memo.tags.split(",").filter((t) => t.trim());
      if (tags.length > 0) {
        md += tags.map((t) => `#${t.trim()}`).join(" ") + "\n\n";
      }
    }
    md += `${memo.content}\n\n`;
    md += "---\n\n";
  }

  return md;
}

// 创建 memo
export async function createMemo(content: string, tags: string): Promise<Memo> {
  devLog(() => console.log("[DB] Creating memo:", content, tags));
  const database = await getDb();
  const now = new Date().toISOString();

  try {
    const result = await database.execute(
      "INSERT INTO memos (content, tags, created_at, updated_at) VALUES (?, ?, ?, ?)",
      [content, tags, now, now]
    );
    devLog(() => console.log("[DB] Memo created, id:", result.lastInsertId));

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
    throw new Error("创建记录失败: " + e);
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
    "UPDATE memos SET content = ?, tags = ?, updated_at =? WHERE id = ?",
    [content, tags, now, id]
  );
}

// 软删除 memo（移动到回收站）
export async function softDeleteMemo(id: number): Promise<void> {
  const database = await getDb();
  const now = new Date().toISOString();
  await database.execute(
    "UPDATE memos SET deleted_at = ? WHERE id = ?",
    [now, id]
  );
}

// 从回收站恢复 memo
export async function restoreMemo(id: number): Promise<void> {
  const database = await getDb();
  await database.execute(
    "UPDATE memos SET deleted_at = NULL WHERE id = ?",
    [id]
  );
}

// 永久删除 memo
export async function permanentDeleteMemo(id: number): Promise<void> {
  const database = await getDb();
  await database.execute("DELETE FROM memos WHERE id = ?", [id]);
}

// 获取回收站中的 memo
export async function getTrashMemos(): Promise<Memo[]> {
  devLog(() => console.log("[DB] Getting trash memos..."));
  const database = await getDb();
  try {
    const result = await database.select<Memo[]>(
      "SELECT * FROM memos WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC"
    );
    devLog(() => console.log("[DB] Trash memos fetched:", result.length));
    return result;
  } catch (e) {
    console.error("[DB] Failed to get trash memos:", e);
    throw e;
  }
}

// 获取回收站 memo 数量
export async function getTrashCount(): Promise<number> {
  const database = await getDb();
  try {
    const result = await database.select<{ count: number }[]>(
      "SELECT COUNT(*) as count FROM memos WHERE deleted_at IS NOT NULL"
    );
    return result[0]?.count || 0;
  } catch (e) {
    console.error("[DB] Failed to get trash count:", e);
    throw e;
  }
}

// 清理超过30天的回收站内容
export async function cleanExpiredTrash(): Promise<number> {
  const database = await getDb();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const expiredDate = thirtyDaysAgo.toISOString();

  try {
    const result = await database.execute(
      "DELETE FROM memos WHERE deleted_at IS NOT NULL AND deleted_at < ?",
      [expiredDate]
    );
    devLog(() => console.log("[DB] Cleaned expired trash:", result.rowsAffected));
    return result.rowsAffected;
  } catch (e) {
    console.error("[DB] Failed to clean expired trash:", e);
    throw e;
  }
}

// 搜索未删除的 memo
export async function searchMemos(keyword: string): Promise<Memo[]> {
  const database = await getDb();
  const searchPattern = `%${keyword}%`;
  const result = await database.select<Memo[]>(
    "SELECT * FROM memos WHERE deleted_at IS NULL AND (content LIKE ? OR tags LIKE ?) ORDER BY created_at DESC",
    [searchPattern, searchPattern]
  );
  return result;
}

// 获取今日记录数（未删除）
export async function getTodayCount(): Promise<number> {
  const database = await getDb();
  const today = new Date().toISOString().split("T")[0];
  const result = await database.select<{ count: number }[]>(
    "SELECT COUNT(*) as count FROM memos WHERE deleted_at IS NULL AND date(created_at) = date(?)",
    [today]
  );
  return result[0]?.count || 0;
}

// 热力图数据项
export interface HeatmapItem {
  date: string;
  count: number;
}

// 获取过去40天的热力图数据（未删除）
export async function getHeatmapData(): Promise<HeatmapItem[]> {
  const database = await getDb();
  const result = await database.select<HeatmapItem[]>(
    `SELECT date(created_at) as date, COUNT(*) as count
     FROM memos
     WHERE deleted_at IS NULL AND date(created_at) >= date('now', '-40 days')
     GROUP BY date(created_at)
     ORDER BY date ASC`
  );
  return result;
}

// 导出数据格式
export interface ExportData {
  version: string;
  exportedAt: string;
  memos: {
    content: string;
    tags: string;
    created_at: string;
  }[];
}

// 导出 memo（支持格式和范围选择）
export async function exportMemos(options: ExportOptions): Promise<{ content: string; filename: string }> {
  const memos = await getMemosByFilter(options);
  const exportedAt = new Date().toISOString();

  let content: string;
  let filename: string;
  const dateStr = new Date().toISOString().split("T")[0];

  if (options.format === "markdown") {
    content = formatAsMarkdown(memos);
    filename = `openflomo-export-${dateStr}.md`;
  } else {
    const data: ExportData = {
      version: "1.0",
      exportedAt,
      memos: memos.map((m) => ({
        content: m.content,
        tags: m.tags,
        created_at: m.created_at,
      })),
    };
    content = JSON.stringify(data, null, 2);
    filename = `openflomo-export-${dateStr}.json`;
  }

  return { content, filename };
}

// 导入 memo
export async function importMemos(data: ExportData): Promise<number> {
  const database = await getDb();

  if (!data.memos || !Array.isArray(data.memos)) {
    throw new Error("无效的导入数据格式");
  }

  let importedCount = 0;

  for (const memo of data.memos) {
    const now = new Date().toISOString();
    await database.execute(
      "INSERT INTO memos (content, tags, created_at, updated_at) VALUES (?, ?, ?, ?)",
      [memo.content, memo.tags || "", memo.created_at || now, now]
    );
    importedCount++;
  }

  return importedCount;
}
