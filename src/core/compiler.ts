import fs from 'node:fs';
import path from 'node:path';
import { Logger } from '../utils/logger.js';
import { readTextSafe } from '../utils/files.js';

export interface TaskContract {
  id: string;
  slice: string;
  repo: string;
  role: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'DONE' | 'BLOCKED';
  requirements: string[];
  contractRefs?: string[];
  allowedFiles: string[];
  outOfScope?: string[];
  scope: string;
  validationCommands: string[];
  notes?: string;
}

export interface CompiledContext {
  taskId: string;
  systemPrompt: string;
  userPrompt: string;
  estimatedTokens: number;
}

export class ContextCompiler {
  private hubDir: string;

  constructor(hubDir: string = process.cwd()) {
    this.hubDir = path.resolve(hubDir);
  }

  /**
   * Roughly estimates tokens (1 token ≈ 4 characters)
   */
  estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Compiles an ultra-lean context pack for a specific task
   */
  compileTaskContext(task: TaskContract, stackConventions: string = ''): CompiledContext {
    // 1. Stable prefix: rules and conventions
    const systemPrompt = `You are an elite, laser-focused software engineering agent managed by SliceSmith.
You execute strictly within the assigned task boundaries.
RULE 1: You may inspect and modify ONLY files in the "Allowed Files" list. Touching other files is forbidden.
RULE 2: Implement only the requested scope. Do not invent unrequested features.
RULE 3: Follow the architectural conventions provided below.
RULE 4: Provide complete, runnable code with zero placeholders or "// TODO" omissions.

CONVENTIONS:
${stackConventions}
`.trim();

    // 2. Fetch requirement texts from LEDGER
    let requirementsText = '';
    const ledgerPath = path.join(this.hubDir, 'requirements', 'LEDGER.md');
    const ledgerContent = readTextSafe(ledgerPath) || '';
    for (const reqId of task.requirements) {
      const match = ledgerContent.split('\n').find((line) => line.includes(`| ${reqId} `));
      if (match) {
        requirementsText += `- ${match.trim()}\n`;
      }
    }

    // 3. Assemble task prompt
    const userPrompt = `
TASK EXECUTION CONTRACT: ${task.id} (Slice: ${task.slice})

## 1. SCOPE
${task.scope}

## 2. ALLOWED FILES (Strict Boundary)
${task.allowedFiles.map((f) => `- ${f}`).join('\n')}

${task.outOfScope && task.outOfScope.length > 0 ? `## OUT OF SCOPE\n${task.outOfScope.map((f) => `- ${f}`).join('\n')}\n` : ''}

## 3. REQUIREMENTS CITED
${requirementsText || 'None specifically cited.'}

${task.contractRefs && task.contractRefs.length > 0 ? `## 4. API CONTRACT REFS\n${task.contractRefs.join('\n')}\n` : ''}

${task.notes ? `## 5. RESUME NOTES (Previous session checkpoint)\n${task.notes}\n` : ''}

## 6. VALIDATION CRITERIA
Before marking complete, this task must pass:
${task.validationCommands.map((c) => `- \`${c}\``).join('\n')}

Execute this task now. Output your actions and files modified cleanly.
`.trim();

    const totalEstimated = this.estimateTokens(systemPrompt) + this.estimateTokens(userPrompt);

    return {
      taskId: task.id,
      systemPrompt,
      userPrompt,
      estimatedTokens: totalEstimated,
    };
  }
}

