import fs from 'node:fs';
import path from 'node:path';
import { ensureDir, readTextSafe, writeTextSafe } from '../utils/files.js';

export interface LedgerEntry {
  id: string;
  timestamp: string;
  projectId: string;
  slice: string;
  taskId: string;
  role: string;
  runner: string;
  model: string;
  tokensIn: number;
  tokensOut: number;
  tokensCached: number;
  costEstimatedUsd: number;
  retries: number;
  outcome: 'SUCCESS' | 'FAILED' | 'ESCALATED';
}

export class TokenLedger {
  private hubDir: string;

  constructor(hubDir: string = process.cwd()) {
    this.hubDir = path.resolve(hubDir);
  }

  get ledgerFilePath(): string {
    return path.join(this.hubDir, '.slicesmith', 'token-ledger.json');
  }

  /**
   * Loads all ledger entries
   */
  loadEntries(): LedgerEntry[] {
    const raw = readTextSafe(this.ledgerFilePath);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  /**
   * Records a completed task execution run
   */
  record(entry: Omit<LedgerEntry, 'id' | 'timestamp'>): LedgerEntry {
    const entries = this.loadEntries();
    const fullEntry: LedgerEntry = {
      ...entry,
      id: `RUN-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
    };

    entries.push(fullEntry);
    writeTextSafe(this.ledgerFilePath, JSON.stringify(entries, null, 2));
    return fullEntry;
  }

  /**
   * Generates a summary report of tokens and cost
   */
  getSummary(): {
    totalRuns: number;
    totalTokensIn: number;
    totalTokensOut: number;
    totalTokensCached: number;
    totalCostUsd: number;
    byModel: Record<string, { runs: number; tokens: number; cost: number }>;
    byTask: Record<string, { runs: number; tokens: number }>;
  } {
    const entries = this.loadEntries();
    let totalTokensIn = 0;
    let totalTokensOut = 0;
    let totalTokensCached = 0;
    let totalCostUsd = 0;
    const byModel: Record<string, { runs: number; tokens: number; cost: number }> = {};
    const byTask: Record<string, { runs: number; tokens: number }> = {};

    for (const e of entries) {
      totalTokensIn += e.tokensIn;
      totalTokensOut += e.tokensOut;
      totalTokensCached += e.tokensCached || 0;
      totalCostUsd += e.costEstimatedUsd;

      // By model
      if (!byModel[e.model]) {
        byModel[e.model] = { runs: 0, tokens: 0, cost: 0 };
      }
      byModel[e.model].runs += 1;
      byModel[e.model].tokens += e.tokensIn + e.tokensOut;
      byModel[e.model].cost += e.costEstimatedUsd;

      // By task
      if (!byTask[e.taskId]) {
        byTask[e.taskId] = { runs: 0, tokens: 0 };
      }
      byTask[e.taskId].runs += 1;
      byTask[e.taskId].tokens += e.tokensIn + e.tokensOut;
    }

    return {
      totalRuns: entries.length,
      totalTokensIn,
      totalTokensOut,
      totalTokensCached,
      totalCostUsd,
      byModel,
      byTask,
    };
  }
}

