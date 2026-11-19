import fs from 'node:fs';
import path from 'node:path';
import { Logger } from '../utils/logger.js';
import { ensureDir, readTextSafe, writeTextSafe, calculateHash } from '../utils/files.js';
import { extractPdfText } from '../utils/pdf.js';

export interface RequirementItem {
  id: string;
  title: string;
  description: string;
  source: string;
  status: 'confirmed' | 'assumed' | 'changed';
  date: string;
  tags?: string[];
}

export class IntakeEngine {
  private hubDir: string;

  constructor(hubDir: string = process.cwd()) {
    this.hubDir = path.resolve(hubDir);
  }

  get inboxDir(): string {
    return path.join(this.hubDir, 'inbox');
  }

  get requirementsDir(): string {
    return path.join(this.hubDir, 'requirements');
  }

  get ledgerPath(): string {
    return path.join(this.requirementsDir, 'LEDGER.md');
  }

  /**
   * Scans inbox directories for incoming client files
   */
  scanInbox(): { docs: string[]; screens: string[]; notes: string[] } {
    const docsDir = path.join(this.inboxDir, 'docs');
    const screensDir = path.join(this.inboxDir, 'screens');
    const notesDir = path.join(this.inboxDir, 'notes');

    ensureDir(docsDir);
    ensureDir(screensDir);
    ensureDir(notesDir);

    const getFiles = (dir: string) =>
      fs.existsSync(dir)
        ? fs.readdirSync(dir).filter((f) => !f.startsWith('.') && fs.statSync(path.join(dir, f)).isFile())
        : [];

    return {
      docs: getFiles(docsDir),
      screens: getFiles(screensDir),
      notes: getFiles(notesDir),
    };
  }

  /**
   * Sanitizes input to prevent prompt injection and cleans formatting
   */
  sanitizeContent(rawText: string): string {
    return rawText
      .replace(/<system>/gi, '&lt;system&gt;')
      .replace(/<\/system>/gi, '&lt;/system&gt;')
      .replace(/<instruction>/gi, '&lt;instruction&gt;')
      .replace(/<\/instruction>/gi, '&lt;/instruction&gt;');
  }

  /**
   * Ingests a raw document (pdf, txt, md) into the requirements repository
   */
  processFile(filePath: string, category: 'docs' | 'notes'): string {
    let raw = '';
    const ext = path.extname(filePath).toLowerCase();

    if (ext === '.pdf') {
      raw = extractPdfText(filePath);
    } else {
      raw = readTextSafe(filePath) || '';
    }

    if (!raw.trim()) return '';

    const sanitized = this.sanitizeContent(raw);
    const fileName = path.basename(filePath, path.extname(filePath));
    const targetPath = path.join(this.requirementsDir, 'specs', `${category}-${fileName}.md`);

    const wrapped = `<!-- Auto-converted by SliceSmith Intake -->\n<!-- Source: ${filePath} -->\n<!-- Hash: ${calculateHash(raw)} -->\n\n<client_data>\n${sanitized}\n</client_data>\n`;

    writeTextSafe(targetPath, wrapped);
    return targetPath;
  }

  /**
   * Reads or initializes the requirements ledger
   */
  loadLedger(): RequirementItem[] {
    const content = readTextSafe(this.ledgerPath);
    if (!content) return [];

    const items: RequirementItem[] = [];
    const lines = content.split('\n');

    for (const line of lines) {
      // Parse markdown table row: | R-001 | Title | Source | Status | Date |
      const match = line.match(/^\|\s*(R-\d+)\s*\|\s*([^|]+)\|\s*([^|]+)\|\s*([^|]+)\|\s*([^|]+)\|/);
      if (match) {
        const [, id, title, source, status, date] = match;
        if (id.trim() !== 'ID') {
          items.push({
            id: id.trim(),
            title: title.trim(),
            description: title.trim(),
            source: source.trim(),
            status: status.trim() as any,
            date: date.trim(),
          });
        }
      }
    }

    return items;
  }

  /**
   * Saves updated items back to LEDGER.md
   */
  saveLedger(items: RequirementItem[]): void {
    ensureDir(this.requirementsDir);
    let md = `# 📋 SliceSmith Requirements Ledger\n\n`;
    md += `> **Source of Truth**: All tasks cite these requirement IDs. Agents read only cited items, not raw briefs.\n\n`;
    md += `| ID | Requirement | Source | Status | Date |\n`;
    md += `|---|---|---|---|---|\n`;

    for (const item of items) {
      md += `| ${item.id} | ${item.title} | ${item.source} | ${item.status} | ${item.date} |\n`;
    }

    writeTextSafe(this.ledgerPath, md);
  }

  /**
   * Generates next requirement ID (e.g., R-001, R-002...)
   */
  getNextId(existing: RequirementItem[]): string {
    const maxNum = existing.reduce((max, item) => {
      const num = parseInt(item.id.replace('R-', ''), 10);
      return isNaN(num) ? max : Math.max(max, num);
    }, 0);
    return `R-${String(maxNum + 1).padStart(3, '0')}`;
  }
}

