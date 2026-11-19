import fs from 'node:fs';
import path from 'node:path';
import { Logger } from '../utils/logger.js';
import { ensureDir, writeTextSafe } from '../utils/files.js';

export async function initCommand(projectName?: string, options?: { mode?: 'new' | 'existing' }): Promise<void> {
  const name = projectName || path.basename(process.cwd());
  const hubDir = path.resolve(process.cwd());

  Logger.header(`Initializing SliceSmith Project Hub: ${name}`);

  // Create core folder structure
  ensureDir(path.join(hubDir, 'development'));
  ensureDir(path.join(hubDir, 'inbox', 'docs'));
  ensureDir(path.join(hubDir, 'inbox', 'screens'));
  ensureDir(path.join(hubDir, 'inbox', 'notes'));
  ensureDir(path.join(hubDir, 'requirements', 'specs'));
  ensureDir(path.join(hubDir, 'contracts'));
  ensureDir(path.join(hubDir, 'docs'));
  ensureDir(path.join(hubDir, 'tasks'));
  ensureDir(path.join(hubDir, '.slicesmith'));

  // 1. project.yaml
  const projectYamlPath = path.join(hubDir, 'project.yaml');
  if (!fs.existsSync(projectYamlPath)) {
    const yamlContent = `name: ${name}
version: "1.0.0"
mode: ${options?.mode || 'new'}

repos:
  - id: api
    role: api
    stack: nestjs
    path: ./development/backend
    branch: main
    validate:
      - npm run lint
      - npm run test
      - npm run build
    task_prefix: T-BE

  - id: app
    role: mobile
    stack: flutter
    path: ./development/app
    branch: main
    validate:
      - flutter analyze
      - flutter test
    task_prefix: T-APP

  - id: web
    role: web
    stack: nextjs
    path: ./development/web
    branch: main
    validate:
      - npm run lint
      - npm run build
    task_prefix: T-WEB

contracts:
  api: contracts/API.md
  realtime: contracts/REALTIME.md
  decisions: docs/DECISIONS.md
  open_questions: docs/OPEN_QUESTIONS.md

policy: balanced
budgets:
  task_tokens: 120000
  task_minutes: 25
  retries: 2

providers_allowed:
  - google
  - anthropic
  - openai

agent:
  primary_runner: gemini
  parallelism: 2
`;
    writeTextSafe(projectYamlPath, yamlContent);
    Logger.success(`Created project.yaml`);
  }

  // 2. requirements/LEDGER.md
  const ledgerPath = path.join(hubDir, 'requirements', 'LEDGER.md');
  if (!fs.existsSync(ledgerPath)) {
    const ledgerContent = `# 📋 SliceSmith Requirements Ledger

> **Source of Truth**: All tasks cite these requirement IDs. Agents read only cited items.

| ID | Requirement | Source | Status | Date |
|---|---|---|---|---|
`;
    writeTextSafe(ledgerPath, ledgerContent);
    Logger.success(`Created requirements/LEDGER.md`);
  }

  // 3. contracts/API.md
  const apiPath = path.join(hubDir, 'contracts', 'API.md');
  if (!fs.existsSync(apiPath)) {
    const apiContent = `# 🔌 SliceSmith Unified API Contract

> **Contract Bridge**: Backend defines endpoints first. Client apps (Flutter/Web) generate types and mock servers from this contract.

## Base URL
\`/api/v1\`

## Global Error Format
\`\`\`json
{
  "statusCode": 400,
  "message": "Error details",
  "error": "Bad Request"
}
\`\`\`

## Endpoints
<!-- SliceSmith will populate this during feature slice planning -->
`;
    writeTextSafe(apiPath, apiContent);
    Logger.success(`Created contracts/API.md`);
  }

  // 4. docs/DECISIONS.md & docs/OPEN_QUESTIONS.md
  const decisionsPath = path.join(hubDir, 'docs', 'DECISIONS.md');
  if (!fs.existsSync(decisionsPath)) {
    const decisionsContent = `# 🏛️ Architecture Decisions & Assumptions

> **Rule**: Any architectural assumption made during development MUST be recorded here before coding. Append-only during a session.

| Date | ID | Decision / Assumption | Context & Rationale | Status |
|---|---|---|---|---|
`;
    writeTextSafe(decisionsPath, decisionsContent);
    Logger.success(`Created docs/DECISIONS.md`);
  }

  const openQPath = path.join(hubDir, 'docs', 'OPEN_QUESTIONS.md');
  if (!fs.existsSync(openQPath)) {
    const openQContent = `# ❓ Open Questions & Ambiguities

> **Zero-Assumption Policy**: If client requirements are ambiguous or missing, do NOT guess in code. Add an entry here with a proposed default and request human confirmation.

| ID | Question / Ambiguity | Impacted Modules | Proposed Default | Resolution |
|---|---|---|---|---|
`;
    writeTextSafe(openQPath, openQContent);
    Logger.success(`Created docs/OPEN_QUESTIONS.md`);
  }

  // 5. AGENTS.md
  const agentsPath = path.join(hubDir, 'AGENTS.md');
  if (!fs.existsSync(agentsPath)) {
    const agentsContent = `# SliceSmith Agent Rules

1. **Strict Allowed Files**: Touch only files explicitly listed in the task contract's "Allowed Files".
2. **Zero Inventions**: Do not invent endpoints, fields, or UI screens. Everything must link to a Requirement ID or Contract.
3. **Ambiguity Rule**: If anything is unclear, stop and log to \`docs/OPEN_QUESTIONS.md\`.
4. **Validation Required**: Tasks are NEVER done without passing the task's validation commands with zero errors.
5. **Resume Token**: Keep the task's \`Notes\` section updated with checkpoints.
`;
    writeTextSafe(agentsPath, agentsContent);
    Logger.success(`Created AGENTS.md`);
  }

  Logger.box('SliceSmith Initialized Successfully!', [
    `Project Hub: ${hubDir}`,
    `1. Drop your requirement files into: inbox/docs/, inbox/screens/`,
    `2. Put your code repos inside: development/ (backend, app, web)`,
    `3. Run: slicesmith intake convert`,
    `4. Run: slicesmith onboard`,
  ]);
}

