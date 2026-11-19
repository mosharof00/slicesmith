# 🍰 SliceSmith

> **Deterministic Multi-Agent Build Harness for Full-Stack & Mobile Projects**  
> Build complete projects across backend, frontend, and mobile apps from a single place—orchestrated with vertical feature slices, strict token budgeting, and zero AI guessing.

---

## ⚡ Why SliceSmith?

- **Vertical Slices (Not Stack-by-Stack)**: Builds feature-by-feature (Auth ➔ Profiles ➔ Wallets) across backend, web, and mobile simultaneously. Eliminates late integration bugs.
- **85%+ Token Savings**: Context Compiler feeds agents only cited requirement IDs and strict allowed files—never entire repositories.
- **Deterministic Coordinator**: Task scheduling, validation, and file tracking run in pure TypeScript code (zero LLM token sink).
- **Boilerplate Quarantine**: Automatically detects and ignores demo/leftover code from starter templates.

---

## 🚀 Quickstart

### 1. Initialize a Project Hub
```bash
slicesmith init <project-name>
cd <project-name>
```

This generates your project workspace:
```text
my-project/
├── development/              ← 💻 ALL APPLICATION CODE
│   ├── backend/              ← NestJS, Laravel, FastAPI, or Go
│   ├── app/                  ← Flutter (Android/iOS) or React Native
│   └── web/                  ← Next.js (User platform & Admin panel)
│
├── inbox/                    ← 📥 DROP RAW CLIENT ASSETS HERE
│   ├── docs/                 ← Client briefs, PDFs, requirements
│   ├── screens/              ← UI screenshots, Figma exports
│   └── notes/                ← Chat transcripts, client notes
│
├── requirements/             ← 📋 DISTILLED LEDGER (R-001, R-002...)
├── contracts/                ← 🔌 CONTRACT BRIDGE (API.md, REALTIME.md)
├── docs/                     ← 🏛️ ARCHITECTURE (DECISIONS.md, DESIGN_SYSTEM.md)
├── tasks/                    ← 🍰 VERTICAL SLICES & TASK CONTRACTS (SLICES.md)
└── project.yaml              ← Multi-repo configuration & token budgets
```

---

### 2. Add Requirements & Repos

1. **Drop requirements into `inbox/`**:
   - PDFs & briefs in `inbox/docs/`
   - UI screenshots in `inbox/screens/`
   - Client messages or links in `inbox/notes/`

2. **Place your boilerplates inside `development/`**:
   - `development/backend/`
   - `development/app/`
   - `development/web/`

---

### 3. Run the Pipeline

```bash
# 1. Check environment and toolchains
slicesmith doctor

# 2. Convert raw PDFs/screens into distilled requirements ledger
slicesmith intake convert

# 3. Scan boilerplates (detects modules & quarantines template leftovers)
slicesmith onboard

# 4. Generate vertical feature slices & task contracts
slicesmith plan

# 5. Check real-time progress
slicesmith status

# 6. Execute a task with AI runner (Gemini, Claude, or Cursor)
slicesmith run T-BE-001

# 7. View token usage & cost ledger
slicesmith tokens
```

---

## 🛠️ CLI Commands

| Command | Action |
|---|---|
| `slicesmith init [name]` | Creates a new project hub with `development/` and `inbox/` |
| `slicesmith doctor` | Diagnostics for Node, Flutter, Dart, Git, and AI keys |
| `slicesmith intake convert` | Converts PDFs/docs to markdown & distills `LEDGER.md` |
| `slicesmith onboard` | Scans boilerplates and registers template leftovers |
| `slicesmith plan` | Generates vertical feature slices and task contracts |
| `slicesmith run <taskId>` | Compiles context pack and executes with primary AI runner |
| `slicesmith status` | Shows completion percentage across all slices |
| `slicesmith tokens` | Live token meter, prompt cache savings, and cost summary |

---

## 🛡️ Built-in Guardrails

- **Strict File Boundaries**: Agents can only touch files explicitly listed in the task contract's `Allowed Files`.
- **Zero-Assumption Policy**: Ambiguities are recorded in `docs/OPEN_QUESTIONS.md` instead of guessing in code.
- **Evidence-Based Done**: Tasks are never marked complete without passing real terminal validation (`lint`, `test`, `build`).

---

*SliceSmith v0.1.0 • Built for solo developers & high-velocity teams*
