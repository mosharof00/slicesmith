import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export function calculateHash(content: string | Buffer): string {
  return crypto.createHash('sha256').update(content).digest('hex').slice(0, 12);
}

export function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

export function readTextSafe(filePath: string): string | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}

export function writeTextSafe(filePath: string, content: string): void {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, 'utf-8');
}

export function listFilesRecursive(dir: string, exclude: string[] = ['node_modules', '.git', 'dist', '.build']): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;

  function walk(currentDir: string) {
    const list = fs.readdirSync(currentDir);
    for (const file of list) {
      if (exclude.includes(file)) continue;
      const fullPath = path.join(currentDir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        walk(fullPath);
      } else {
        results.push(fullPath);
      }
    }
  }

  walk(dir);
  return results;
}

