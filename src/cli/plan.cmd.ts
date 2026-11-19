import fs from 'node:fs';
import path from 'node:path';
import chalk from 'chalk';
import { Logger } from '../utils/logger.js';
import { ConfigManager } from '../core/config.js';
import { IntakeEngine } from '../core/intake.js';
import { writeTextSafe } from '../utils/files.js';

export async function planCommand(): Promise<void> {
  Logger.header('SliceSmith Planner: Generating Vertical Feature Slices');

  const config = ConfigManager.load();
  const hubDir = path.dirname(ConfigManager.findConfigFile()!);
  const intake = new IntakeEngine(hubDir);
  const ledger = intake.loadLedger();

  if (ledger.length === 0) {
    Logger.warn('Requirements ledger is empty. Drop brief/docs into inbox/ and run: slicesmith intake convert');
    return;
  }

  const tasksDir = path.join(hubDir, 'tasks');
  let slicesMd = `# 🍰 Vertical Feature Slices & Task Board\n\n`;
  slicesMd += `> **Execution Order**: Slices execute in vertical order. Backend contracts are specified first, then client layers build against mock servers in parallel.\n\n`;

  // Base Walking Skeleton Slice (Always Slice 0)
  slicesMd += `## Slice 0: Walking Skeleton (Health & Connectivity)\n`;
  slicesMd += `- Proves API, Database, and Client app compilation before heavy feature builds.\n\n`;

  // Create Walking Skeleton tasks for each repo
  let taskCounter = 1;
  for (const repo of config.repos) {
    const taskId = `${repo.task_prefix}-${String(taskCounter).padStart(3, '0')}`;
    const taskFileName = `${taskId}.md`;
    const taskPath = path.join(tasksDir, taskFileName);

    slicesMd += `- [ ] **${taskId}**: Verify ${repo.id} compilation and health endpoint (\`${taskFileName}\`)\n`;

    if (!fs.existsSync(taskPath)) {
      const taskContent = `# ${taskId} — Walking Skeleton: ${repo.id} Foundation

**Status:** PENDING  
**Repo:** ${repo.id} (${repo.role})  
**Allowed files:**
- package.json
- src/main.ts
- lib/main.dart

## Scope
Verify base boilerplate builds and runs. Ensure health check / ping route exists.

## Requirements Cited
- None (infrastructure/foundation gate)

## Validation
${repo.validate.map((v) => `\`${v}\``).join('\n')}

## Notes
(Task resume token - checkpoints will be recorded here)
`;
      writeTextSafe(taskPath, taskContent);
    }
  }

  slicesMd += `\n## Feature Slices (from Requirements Ledger)\n`;
  let sliceIndex = 1;

  for (const req of ledger) {
    slicesMd += `### Slice ${sliceIndex}: ${req.title}\n`;
    slicesMd += `> Linked to requirement: **${req.id}**\n\n`;

    taskCounter++;
    for (const repo of config.repos) {
      const taskId = `${repo.task_prefix}-${String(taskCounter).padStart(3, '0')}`;
      const taskFileName = `${taskId}.md`;
      const taskPath = path.join(tasksDir, taskFileName);

      slicesMd += `- [ ] **${taskId}**: [${repo.role}] ${req.title} for ${repo.id} (\`${taskFileName}\`)\n`;

      if (!fs.existsSync(taskPath)) {
        const taskContent = `# ${taskId} — ${req.title} (${repo.role})

**Status:** PENDING  
**Repo:** ${repo.id}  
**Slice:** Slice ${sliceIndex}  
**Allowed files:**
- (Specific module files auto-bounded during execution)

## Scope
Implement ${req.title} for ${repo.id} according to specification.

## Requirements Cited
- ${req.id}: ${req.title}

## API Contract Reference
See \`contracts/API.md\`

## Validation
${repo.validate.map((v) => `\`${v}\``).join('\n')}

## Notes
(Task resume token - checkpoints will be recorded here)
`;
        writeTextSafe(taskPath, taskContent);
      }
    }
    sliceIndex++;
    slicesMd += `\n`;
  }

  const slicesBoardPath = path.join(tasksDir, 'SLICES.md');
  writeTextSafe(slicesBoardPath, slicesMd);

  Logger.box('Slice Plan Generated!', [
    `Master board: tasks/SLICES.md`,
    `Generated tasks: ${taskCounter} task files in tasks/`,
    `Next step: Run 'slicesmith run <TASK-ID>' or 'slicesmith status'`,
  ]);
}

