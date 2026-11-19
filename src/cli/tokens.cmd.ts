import path from 'node:path';
import chalk from 'chalk';
import { Logger } from '../utils/logger.js';
import { TokenLedger } from '../core/ledger.js';
import { ConfigManager } from '../core/config.js';

export async function tokensCommand(): Promise<void> {
  Logger.header('SliceSmith Token Ledger & Cost Meter');

  const configPath = ConfigManager.findConfigFile();
  const hubDir = configPath ? path.dirname(configPath) : process.cwd();
  const ledger = new TokenLedger(hubDir);
  const summary = ledger.getSummary();

  console.log(chalk.bold('\nOverall Consumption:'));
  console.log(`  Total Agent Runs:    ${chalk.cyan(summary.totalRuns)}`);
  console.log(`  Input Tokens:        ${chalk.white(summary.totalTokensIn.toLocaleString())}`);
  console.log(`  Output Tokens:       ${chalk.white(summary.totalTokensOut.toLocaleString())}`);
  console.log(`  Cached Tokens:       ${chalk.green(summary.totalTokensCached.toLocaleString())} ${chalk.dim('(Prompt Caching Savings)')}`);
  console.log(`  Total Estimated Cost: ${chalk.bold.green(`$${summary.totalCostUsd.toFixed(4)}`)}`);

  if (Object.keys(summary.byModel).length > 0) {
    console.log(chalk.bold('\nBreakdown by Model:'));
    for (const [model, stats] of Object.entries(summary.byModel)) {
      console.log(`  - ${chalk.bold(model.padEnd(20))}: ${stats.runs} runs | ${stats.tokens.toLocaleString()} tokens | $${stats.cost.toFixed(4)}`);
    }
  } else {
    console.log(chalk.dim('\nNo runs recorded in ledger yet. Runs are tracked automatically when executing tasks.'));
  }
}

