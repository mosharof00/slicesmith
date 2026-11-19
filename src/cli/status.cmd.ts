import fs from 'node:fs';
import path from 'node:path';
import chalk from 'chalk';
import { Logger } from '../utils/logger.js';
import { ConfigManager } from '../core/config.js';
import { readTextSafe } from '../utils/files.js';

export async function statusCommand(): Promise<void> {
  Logger.header('SliceSmith Project Status');

  const configPath = ConfigManager.findConfigFile();
  if (!configPath) {
    Logger.warn('No project.yaml found in current directory tree.');
    return;
  }

  const config = ConfigManager.load(configPath);
  const hubDir = path.dirname(configPath);
  const tasksDir = path.join(hubDir, 'tasks');

  console.log(`\nProject: ${chalk.bold.cyan(config.name)} (${config.mode.toUpperCase()})`);
  console.log(`Policy: ${chalk.green(config.policy)} | Primary Runner: ${chalk.yellow(config.agent.primary_runner)}`);

  if (!fs.existsSync(tasksDir)) {
    console.log(chalk.yellow('\nNo tasks directory found. Run \'slicesmith plan\' to generate tasks.'));
    return;
  }

  const taskFiles = fs.readdirSync(tasksDir).filter((f) => f.endsWith('.md') && f !== 'SLICES.md');

  let pending = 0;
  let inProgress = 0;
  let done = 0;

  for (const file of taskFiles) {
    const content = readTextSafe(path.join(tasksDir, file)) || '';
    if (content.includes('**Status:** DONE') || content.includes('Status: Done')) done++;
    else if (content.includes('**Status:** IN_PROGRESS')) inProgress++;
    else pending++;
  }

  console.log(chalk.bold('\nTask Progress:'));
  console.log(`  Total Tasks:  ${taskFiles.length}`);
  console.log(`  ${chalk.green('✔ Done:')}        ${done}`);
  console.log(`  ${chalk.yellow('○ In Progress:')} ${inProgress}`);
  console.log(`  ${chalk.dim('⏳ Pending:')}     ${pending}`);

  const percent = taskFiles.length > 0 ? Math.round((done / taskFiles.length) * 100) : 0;
  console.log(`\nCompletion: [${'█'.repeat(Math.floor(percent / 5))}${'░'.repeat(20 - Math.floor(percent / 5))}] ${percent}%`);
}

