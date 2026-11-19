import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { z } from 'zod';
import { Logger } from '../utils/logger.js';

export const RepoConfigSchema = z.object({
  id: z.string(),
  role: z.enum(['api', 'web', 'mobile', 'worker', 'infra', 'custom']),
  stack: z.string(),
  path: z.string(),
  branch: z.string().default('main'),
  validate: z.array(z.string()).default([]),
  task_prefix: z.string(),
  boilerplate: z.boolean().default(false),
});

export const ProjectConfigSchema = z.object({
  name: z.string(),
  version: z.string().default('1.0.0'),
  mode: z.enum(['new', 'existing']).default('new'),
  repos: z.array(RepoConfigSchema).min(1),
  contracts: z.object({
    api: z.string().default('contracts/API.md'),
    realtime: z.string().optional(),
    decisions: z.string().default('docs/DECISIONS.md'),
    open_questions: z.string().default('docs/OPEN_QUESTIONS.md'),
  }),
  policy: z.enum(['fast', 'balanced', 'strict']).default('balanced'),
  budgets: z.object({
    task_tokens: z.number().default(120000),
    task_minutes: z.number().default(25),
    retries: z.number().default(2),
  }).default({}),
  providers_allowed: z.array(z.string()).default(['google', 'anthropic', 'openai']),
  agent: z.object({
    primary_runner: z.enum(['gemini', 'claude', 'cursor', 'codex', 'litellm']).default('gemini'),
    parallelism: z.number().default(2),
    model_routing: z.record(z.string()).default({
      architect: 'gemini-1.5-pro',
      builder: 'gemini-1.5-pro',
      intake: 'gemini-1.5-flash',
      verifier: 'code',
      teacher: 'gemini-1.5-flash',
    }),
  }).default({}),
});

export type RepoConfig = z.infer<typeof RepoConfigSchema>;
export type ProjectConfig = z.infer<typeof ProjectConfigSchema>;

export class ConfigManager {
  static findConfigFile(startDir: string = process.cwd()): string | null {
    let currentDir = path.resolve(startDir);
    while (true) {
      const candidate = path.join(currentDir, 'project.yaml');
      if (fs.existsSync(candidate)) {
        return candidate;
      }
      const parent = path.dirname(currentDir);
      if (parent === currentDir) break;
      currentDir = parent;
    }
    return null;
  }

  static load(configPath?: string): ProjectConfig {
    const filePath = configPath || this.findConfigFile();
    if (!filePath || !fs.existsSync(filePath)) {
      throw new Error(`SliceSmith configuration not found. Looked for project.yaml. Run 'slicesmith init' first.`);
    }

    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const parsed = YAML.parse(raw);
      return ProjectConfigSchema.parse(parsed);
    } catch (err: any) {
      Logger.error(`Invalid project.yaml at ${filePath}`);
      if (err instanceof z.ZodError) {
        for (const issue of err.issues) {
          Logger.error(` - [${issue.path.join('.')}] ${issue.message}`);
        }
      }
      throw err;
    }
  }

  static save(filePath: string, config: ProjectConfig): void {
    const yamlString = YAML.stringify(config);
    fs.writeFileSync(filePath, yamlString, 'utf-8');
  }
}

