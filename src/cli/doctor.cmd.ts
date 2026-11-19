import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import chalk from 'chalk';
import { Logger } from '../utils/logger.js';
import { ConfigManager } from '../core/config.js';

interface CheckItem {
  name: string;
  command?: string;
  customCheck?: () => boolean;
  required: boolean;
}

export async function doctorCommand(): Promise<void> {
  Logger.header('SliceSmith Doctor: System & Environment Diagnostic');

  const tools: CheckItem[] = [
    { name: 'Node.js (>=20)', command: 'node -v', required: true },
    { name: 'Git', command: 'git --version', required: true },
    { name: 'pnpm / npm', command: 'pnpm -v || npm -v', required: true },
    { name: 'Flutter SDK', command: 'flutter --version', required: false },
    { name: 'Dart SDK', command: 'dart --version', required: false },
    { name: 'Docker', command: 'docker --version', required: false },
  ];

  console.log(chalk.bold('\n1. Toolchain Diagnostics:'));
  for (const tool of tools) {
    try {
      if (tool.command) {
        const out = execSync(tool.command, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim().split('\n')[0];
        console.log(`  ${chalk.green('✔')} ${chalk.bold(tool.name.padEnd(20))}: ${chalk.dim(out)}`);
      }
    } catch {
      if (tool.required) {
        console.log(`  ${chalk.red('✖')} ${chalk.bold(tool.name.padEnd(20))}: ${chalk.red('NOT FOUND (Required)')}`);
      } else {
        console.log(`  ${chalk.yellow('○')} ${chalk.bold(tool.name.padEnd(20))}: ${chalk.yellow('Not installed (Optional for mobile/docker)')}`);
      }
    }
  }

  // 2. AI Runners & Quota Keys
  console.log(chalk.bold('\n2. AI Model Keys:'));
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (geminiKey) {
    console.log(`  ${chalk.green('✔')} ${chalk.bold('Gemini API Key'.padEnd(20))}: Configured (${geminiKey.slice(0, 6)}...${geminiKey.slice(-4)})`);
  } else {
    console.log(`  ${chalk.yellow('⚠')} ${chalk.bold('Gemini API Key'.padEnd(20))}: Missing GEMINI_API_KEY in environment or .env`);
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (anthropicKey) {
    console.log(`  ${chalk.green('✔')} ${chalk.bold('Claude API Key'.padEnd(20))}: Configured (${anthropicKey.slice(0, 6)}...${anthropicKey.slice(-4)})`);
  } else {
    console.log(`  ${chalk.dim('○')} ${chalk.bold('Claude API Key'.padEnd(20))}: Optional / Secondary`);
  }

  // 3. Project Configuration Check
  console.log(chalk.bold('\n3. Project Hub & Workspace Status:'));
  const configPath = ConfigManager.findConfigFile();
  if (configPath) {
    try {
      const config = ConfigManager.load(configPath);
      console.log(`  ${chalk.green('✔')} project.yaml found: ${chalk.bold(config.name)} (v${config.version})`);
      for (const repo of config.repos) {
        const absRepoPath = path.resolve(path.dirname(configPath), repo.path);
        const exists = fs.existsSync(absRepoPath);
        if (exists) {
          console.log(`     - [${repo.role}] ${repo.id}: ${chalk.green('Accessible')} (${repo.path})`);
        } else {
          console.log(`     - [${repo.role}] ${repo.id}: ${chalk.yellow('Target folder does not exist yet')} (${repo.path})`);
        }
      }
    } catch (e: any) {
      console.log(`  ${chalk.red('✖')} project.yaml parse error: ${e.message}`);
    }
  } else {
    console.log(`  ${chalk.yellow('○')} No project.yaml found in current working tree. Run 'slicesmith init' to create one.`);
  }

  console.log();
}

