import fs from 'node:fs';
import path from 'node:path';
import chalk from 'chalk';
import { Logger } from '../utils/logger.js';
import { ConfigManager } from '../core/config.js';
import { ContextCompiler, TaskContract } from '../core/compiler.js';
import { GeminiRunner } from '../runners/gemini.js';
import { TokenLedger } from '../core/ledger.js';
import { StackPackRegistry } from '../packs/registry.js';
import { readTextSafe, writeTextSafe } from '../utils/files.js';

export async function runCommand(taskId: string): Promise<void> {
  Logger.header(`SliceSmith Runner: Executing ${taskId}`);

  const config = ConfigManager.load();
  const hubDir = path.dirname(ConfigManager.findConfigFile()!);
  const taskFilePath = path.join(hubDir, 'tasks', `${taskId}.md`);

  if (!fs.existsSync(taskFilePath)) {
    Logger.error(`Task file not found: ${taskFilePath}`);
    return;
  }

  const taskContent = readTextSafe(taskFilePath) || '';

  // Parse task fields from markdown
  const task: TaskContract = {
    id: taskId,
    slice: 'Slice-1',
    repo: 'api',
    role: 'backend',
    status: 'IN_PROGRESS',
    requirements: [],
    allowedFiles: [],
    scope: '',
    validationCommands: [],
  };

  const lines = taskContent.split('\n');
  let currentSection = '';

  for (const line of lines) {
    if (line.startsWith('## Scope')) currentSection = 'scope';
    else if (line.startsWith('## Allowed files')) currentSection = 'allowed';
    else if (line.startsWith('## Validation')) currentSection = 'validation';
    else if (line.startsWith('## Requirements Cited')) currentSection = 'requirements';
    else if (line.startsWith('## Notes')) currentSection = 'notes';
    else if (line.startsWith('## ')) currentSection = '';
    else {
      if (currentSection === 'scope' && line.trim()) task.scope += line + '\n';
      if (currentSection === 'allowed' && line.startsWith('- ')) task.allowedFiles.push(line.replace(/^- /, '').trim());
      if (currentSection === 'validation' && (line.startsWith('- `') || line.startsWith('`'))) {
        task.validationCommands.push(line.replace(/[`\-]/g, '').trim());
      }
      if (currentSection === 'requirements' && line.startsWith('- R-')) {
        const match = line.match(/R-\d+/);
        if (match) task.requirements.push(match[0]);
      }
    }
  }

  // 1. Context Compilation
  const compiler = new ContextCompiler(hubDir);
  const stackPack = StackPackRegistry.get('nestjs');
  const compiled = compiler.compileTaskContext(task, stackPack?.conventionsMarkdown || '');

  Logger.info(`Context compiled: ~${compiled.estimatedTokens} tokens (Budget: ${config.budgets.task_tokens})`);

  // 2. Execute via Runner (Gemini)
  const runner = new GeminiRunner();
  const spin = Logger.spin(`Executing task with ${config.agent.primary_runner}...`);

  try {
    const result = await runner.run(compiled.systemPrompt, compiled.userPrompt, {
      model: config.agent.model_routing?.builder || 'gemini-2.5-pro',
    });
    Logger.stopSpin();

    Logger.success(`Runner completed execution!`);
    console.log(chalk.dim('\nOutput excerpt:'));
    console.log(chalk.white(result.output.slice(0, 300) + (result.output.length > 300 ? '...\n' : '')));

    // 3. Record in Token Ledger
    const ledger = new TokenLedger(hubDir);
    ledger.record({
      projectId: config.name,
      slice: task.slice,
      taskId: task.id,
      role: task.role,
      runner: runner.name,
      model: result.model,
      tokensIn: result.tokensIn,
      tokensOut: result.tokensOut,
      tokensCached: result.cachedTokens,
      costEstimatedUsd: (result.tokensIn * 0.00000125) + (result.tokensOut * 0.000005), // Standard rate estimate
      retries: 0,
      outcome: 'SUCCESS',
    });

    // 4. Update task Status & Notes
    const updatedContent = taskContent
      .replace(/\*\*Status:\*\*\s*[A-Z_]+/i, '**Status:** DONE')
      .replace(/## Notes[\s\S]*$/, `## Notes\nCompleted by SliceSmith (${runner.name} - ${result.model}) on ${new Date().toISOString()}.\n`);

    writeTextSafe(taskFilePath, updatedContent);
    Logger.success(`Task ${taskId} marked as DONE with checkpoint updated.`);

  } catch (err: any) {
    Logger.stopSpin();
    Logger.error(`Task execution failed: ${err.message}`);
  }
}

