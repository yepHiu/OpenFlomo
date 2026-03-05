import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

// 生成版本号：年.月.日-编译时间-release/dev
function generateVersion() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const time = String(now.getTime()).slice(-6); // 取后6位作为编译时间标识

  // 检测是否为 release 构建
  const isRelease = process.argv.includes('--release');

  const suffix = isRelease ? 'release' : 'dev';
  return `${year}.${month}.${day}-${time}-${suffix}`;
}

// 生成 semver 版本号（供 Tauri 使用，年份取后两位）
function generateSemVer() {
  const now = new Date();
  const year = String(now.getFullYear()).slice(-2); // 取后两位
  const month = now.getMonth() + 1;
  const day = now.getDate();
  return `${year}.${month}.${day}`;
}

const version = generateVersion();
const semver = generateSemVer();
console.log(`[Version] Generated version: ${version}, semver: ${semver}`);

// 更新 package.json
const packageJsonPath = join(process.cwd(), 'package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
packageJson.version = version;
writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
console.log('[Version] Updated package.json');

// 更新 tauri.conf.json（使用 semver 格式）
const tauriConfPath = join(process.cwd(), 'src-tauri', 'tauri.conf.json');
const tauriConf = JSON.parse(readFileSync(tauriConfPath, 'utf-8'));
tauriConf.version = semver;
writeFileSync(tauriConfPath, JSON.stringify(tauriConf, null, 2) + '\n');
console.log('[Version] Updated tauri.conf.json');

// 创建 version.json 供前端运行时读取
const publicDir = join(process.cwd(), 'public');
if (!existsSync(publicDir)) {
  mkdirSync(publicDir, { recursive: true });
}
const versionJsonPath = join(publicDir, 'version.json');
writeFileSync(versionJsonPath, JSON.stringify({ version, buildTime: new Date().toISOString() }, null, 2) + '\n');
console.log('[Version] Created version.json');
