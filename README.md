# 🍰 SliceSmith

> **Deterministic Multi-Agent Build Harness for Full-Stack & Mobile Projects**  
> Orchestrates AI agents across backend, frontend, and mobile repos from a single place.

---

## 🚀 Quickstart: Building Your New Project

### Step 1: Initialize Your Project Hub
Navigate to your desired project hub location (or run directly):
```bash
# In your project folder:
slicesmith init <project-name>
```
This generates the full project structure:
```
my-project/
├── project.yaml              ← Configuration: repos, stack packs, policy, budgets
├── AGENTS.md                 ← Global boundary rules (allowed-files, zero invention)
│
├── inbox/                    ← 📥 DROP YOUR RAW REQUIREMENTS HERE
│   ├── docs/                 ← Briefs, PDFs, docx, specifications
│   ├── screens/              ← Figma exports, screenshots, UI designs
│   └── notes/                ← Chat transcripts, client requirements, emails
│
├── requirements/             ← 📋 DISTILLED REQUIREMENTS
│   ├── LEDGER.md             ← Single source of truth (R-001, R-002...)
│   └── specs/                ← Converted markdown specs (token-optimized)
│
├── contracts/                ← 🔌 CONTRACT BRIDGE
│   ├── API.md                ← OpenAPI / endpoints contract
│   └── REALTIME.md           ← WebSocket / Socket.io events
│
├── docs/                     ← 🏛️ DECISIONS & KNOWLEDGE
│   ├── DECISIONS.md          ← Locked decisions & recorded assumptions
│   ├── OPEN_QUESTIONS.md     ← Ambiguities with proposed defaults
│   └── PROJECT_BRIEF.md      ← Generated overview from onboard
│
└── tasks/                    ← 🍰 VERTICAL SLICES & TASK CONTRACTS
    ├── SLICES.md             ← Master vertical slice execution board
    └── T-BE-001.md...        ← Granular task contracts with allowed-files
```

---

### Step 2: Attach Your Boilerplates & Drop Requirements

1. **Drop your requirements files**:
   - Put client PDFs/docs in `inbox/docs/`
   - Put screenshots/UI exports in `inbox/screens/`
   - Put client chat/notes in `inbox/notes/`

2. **Configure your repo paths in `project.yaml`**:
   ```yaml
   name: my-new-project
   mode: existing # or new
   
   repos:
     - id: api
       role: api
       stack: nestjs # or laravel, fastapi, go
       path: ./my_backend_boilerplate
       validate:
         - npm run lint
         - npm test
       task_prefix: T-BE
   
     - id: app
       role: mobile
       stack: flutter
       path: ./my_flutter_boilerplate
       validate:
         - flutter analyze
         - flutter test
       task_prefix: T-APP
   ```

---

### Step 3: Run the SliceSmith Pipeline

```bash
# 1. Verify your toolchains and environment
slicesmith doctor

# 2. Convert and distill all raw inbox assets into the Requirements Ledger
slicesmith intake convert

# 3. Scan your backend & Flutter boilerplates (detects modules & template leftovers)
slicesmith onboard

# 4. Generate the vertical slice execution plan & task contracts
slicesmith plan

# 5. Check task status and progress
slicesmith status

# 6. Execute a task with Gemini (or configured runner)
slicesmith run T-BE-001

# 7. Review token consumption, prompt cache savings, and cost
slicesmith tokens
```

---

## ⚡ Core Innovations & Token Optimizations

1. **Context Compiler**: Agents are never fed entire codebases. Each task receives an ultra-lean context pack (~1,500 tokens) with strict `Allowed Files`, cited requirement IDs (`R-001`), and Stack Pack conventions.
2. **Deterministic Coordinator**: Task scheduling, status tracking, test verification, and file management are handled in zero-token TypeScript code—not by an expensive LLM.
3. **Boilerplate Registry**: Scans attached boilerplates and registers demo/starter template leftovers (`cart`, `counter`, `sample`) so AI agents never build on unwanted demo code.
4. **Token Ledger**: Every run logs tokens-in, tokens-out, prompt cache hits, and estimated USD cost to `.slicesmith/token-ledger.json`.
5. **9 Human Approval Gates**: Safety rails for destructive migrations, production deploys, and security changes.

---

## 🛠️ CLI Command Reference

| Command | Description |
|---|---|
| `slicesmith init [name]` | Initializes a new SliceSmith project hub |
| `slicesmith doctor` | Verifies toolchains (Node, Flutter, Git) and AI API keys |
| `slicesmith intake scan` | Scans `inbox/` for newly added client files |
| `slicesmith intake convert` | Converts raw assets to markdown & populates `LEDGER.md` |
| `slicesmith intake list` | Displays the current requirements ledger |
| `slicesmith onboard` | Scans attached boilerplates and generates `PROJECT_BRIEF.md` |
| `slicesmith plan` | Generates vertical feature slices and task contracts |
| `slicesmith run <taskId>` | Compiles context and executes a task with the primary runner |
| `slicesmith status` | Displays progress across all feature slices |
| `slicesmith tokens` | Displays token usage, cache savings, and cost breakdown |

---

*SliceSmith v0.1.0 • Built for solo developers & high-velocity teams*

