# WZRD TUI - Project Handoff

## Current Status

**Version 1.0 - Feature Complete**

A fully functional terminal-based AI chat interface with multi-provider support, 7-layer memory system, file operations, and real-time streaming.

---

## Completed Features

### Core UI

- Opencode-style dark theme with grey message boxes
- Three-panel layout: Chat area, Input, Sidebar
- Real-time message streaming with typing indicators
- Dynamic thinking blocks (show only when AI is working)
- Work items display (file edits, commands, etc.)
- Syntax highlighting for code blocks
- File diff viewer for comparing changes

---

### Multi-Provider Support

**3 Providers Configured:**

#### 1. Nvidia NIM (8 FREE models)

- Kimi K2.5
- Kimi K2 Instruct
- Kimi K2 Instruct 0905
- DeepSeek V3.2
- Nemotron 3 Super
- Nemotron Safety Guard
- Qwen 3.5 122B
- Qwen 3.5 397B

#### 2. Z AI Coding (6 models - Subscription)

- GLM 4.7
- GLM 4.7 Flash
- GLM 4.6
- GLM 4.5 Air
- GLM 4.5 AirX
- GLM 5

#### 3. OpenRouter (6 models)

- Grok 4.1
- Minimax M2.5 (free)
- Llama 3.1 8B
- Qwen Coder 3 480B (free)
- Gemini 2.5 Flash
- Qwen 3.5

**Total: 20 Models**

---

### Commands (25 Total)

#### Core Commands

| Command | Description |
|---------|-------------|
| `/help` | Show all commands |
| `/exit` | Exit TUI |
| `/clear` | Clear chat |
| `/test` | Test command |
| `/demo` | Run UI demo |

#### Model Commands

| Command | Description |
|---------|-------------|
| `/model` | Open model picker |
| `/mode` | Switch agent mode (Remi/Plan/Build) |
| `/cost` | Show session cost |

#### Session Commands

| Command | Description |
|---------|-------------|
| `/save` | Save current session |
| `/load` | Load saved session |
| `/sessions` | List all sessions |

#### File Commands

| Command | Description |
|---------|-------------|
| `/read` | Read file contents |
| `/write` | Write file |
| `/edit` | Edit file (with backup) |
| `/tree` | Show file tree |
| `/files` | Load files in sidebar |
| `/attach` | Add files to context |
| `/unattach` | Remove attached files |

#### Context Commands

| Command | Description |
|---------|-------------|
| `/prune` | Remove messages from context |
| `/compress` | Summarize old messages |

#### Memory Commands

| Command | Description |
|---------|-------------|
| `/memory` | Show memory stats |
| `/memory search <query>` | Search memories |
| `/memory layer <1-7>` | Show layer contents |
| `/memory add <content>` | Add memory |
| `/memory clear` | Clear all memories |
| `/remember` | Save conversation to memory |

#### Git Commands

| Command | Description |
|---------|-------------|
| `/git status` | Show git status |
| `/git diff` | Show diff |
| `/git add <file>` | Stage file |
| `/git commit <msg>` | Commit changes |
| `/git push` | Push to remote |
| `/git pull` | Pull from remote |
| `/git log` | Show commit log |
| `/git branch` | List branches |
| `/git checkout <branch>` | Switch branch |

#### Backup Commands

| Command | Description |
|---------|-------------|
| `/undo` | Revert last AI edit |
| `/backups` | Show backup stats |
| `/clear-backups` | Clear all backups |
| `/diff <file>` | Show file diff |

#### Search Commands

| Command | Description |
|---------|-------------|
| `/search <query>` | Search codebase |
| `/run <command>` | Execute shell command |

#### Vision Commands

| Command | Description |
|---------|-------------|
| `/vision <image>` | Analyze image |

---

### Skills System (9 Skills)

| Skill | File | Description |
|-------|------|-------------|
| Files | `skills/files.ts` | File operations |
| Shell | `skills/shell.ts` | Shell execution |
| Search | `skills/search.ts` | Codebase search |
| Git | `skills/git.ts` | Git operations |
| Vision | `skills/vision.ts` | Vision analysis |
| Backup | `skills/backup.ts` | File backups |
| Diff | `skills/diff.ts` | Diff viewer |
| Syntax | `skills/syntax.ts` | Syntax highlighting |
| Memory | `skills/memory.ts` | 7-layer memory |

---

### 7-Layer Memory System

| Layer | Name | Description |
|-------|------|-------------|
| 1 | Working | Current session |
| 2 | Short-Term | Last hour |
| 3 | Medium-Term | Last day |
| 4 | Long-Term | Last week |
| 5 | Semantic | Facts, concepts |
| 6 | Episodic | Events |
| 7 | Procedural | Skills |

**Features:**

- Automatic conversation saving
- Context injection (relevant memories added to prompts)
- Full-text search
- Relevance scoring
- SQLite persistence

---

### Token Management

| Feature | Description |
|---------|-------------|
| Budget Alerts | Warnings at 80% and 95% |
| Context Compression | `/compress` command |
| Token Counter | Real-time display in sidebar |
| Cost Tracking | Per-session cost tracking |

---

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Tab` | Cycle agent modes |
| `Ctrl+P` | Toggle command palette |
| `Ctrl+A` | Provider view (in model picker) |
| `↑/↓` | Navigate lists |
| `Enter` | Select item |
| `Escape` | Close/Cancel |

---

## File Structure

```
src/
├── index.tsx              # Main TUI component (3300+ lines)
├── api/
│   ├── nim.ts            # Legacy NIM client
│   └── providers.ts      # Multi-provider API client
├── config.ts             # Persistent config storage
├── storage.ts            # SQLite session persistence
├── skills/
│   ├── files.ts          # File operations
│   ├── shell.ts          # Shell execution
│   ├── search.ts         # Codebase search
│   ├── git.ts            # Git operations
│   ├── vision.ts         # Vision analysis
│   ├── backup.ts         # File backups
│   ├── diff.ts           # Diff viewer
│   ├── syntax.ts         # Syntax highlighting
│   └── memory.ts         # 7-layer memory system
├── agents/
│   └── prompts.ts        # System prompts
└── types.ts              # Type definitions
```

---

## Configuration

### Config Location

`~/.wzrd/config.json`

### API Keys

Set in config file or via environment:

- `NIM_API_KEY` - Nvidia NIM (auto-configured)
- `ZAI_API_KEY` - Z AI Coding subscription
- `OPENROUTER_API_KEY` - OpenRouter

### Memory Database

`~/.wzrd/memory.db` - SQLite database for 7-layer memory

### Backup Storage

`~/.wzrd/backups/` - File backups for undo functionality

---

## Model Pricing (per 1M tokens)

### Nvidia NIM (FREE)

All 8 models are free with API key

### Z AI Coding (Subscription)

Unlimited usage with coding subscription

### OpenRouter

| Model | Input | Output | Free? |
|-------|-------|--------|-------|
| Grok 4.1 | $0.20 | $0.50 | No |
| Minimax M2.5 | $0 | $0 | Yes |
| Llama 3.1 8B | $0.02 | $0.05 | No |
| Qwen Coder 3 480B | $0 | $0 | Yes |
| Gemini 2.5 Flash | $0.30 | $2.50 | No |
| Qwen 3.5 | $0.26 | $2.08 | No |

---

## Launch Command

```bash
cd /Users/michaeldurante/Downloads/wzrd-tui
~/.bun/bin/bun run src/index.tsx
```

---

## Key Files to Know

| File | Purpose |
|------|---------|
| `src/index.tsx` | Main TUI - all UI logic |
| `src/api/providers.ts` | API clients for all providers |
| `src/config.ts` | Persistent config storage |
| `src/skills/memory.ts` | 7-layer memory system |
| `src/skills/backup.ts` | File backup system |
| `HANDOFF.md` | This file |

---

## Quick Reference

### Add a New Provider

1. Add to `providers` object in `providers.ts`
2. Add models to `aiModels` array in `index.tsx`
3. Add pricing to `modelPricing` in `providers.ts`
4. Add API key handling in `config.ts`

### Add a New Command

1. Add to `commands` object in `index.tsx`
2. Define description and handler
3. Add to `/help` output

### Add a New Skill

1. Create file in `src/skills/`
2. Export functions
3. Import in `index.tsx` where needed

---

## Completed Phases

| Phase | Status | Features |
|-------|--------|----------|
| Phase 1 | ✅ Done | `/prune`, `/attach`, `/undo` |
| Phase 2 | ✅ Done | Token alerts, `/compress` |
| Phase 3 | ✅ Done | 7-layer memory system |
| Phase 4 | ✅ Done | Diff viewer, syntax highlighting |
| Phase 5 | ✅ Done | Bug fixes |

---

## Version 1.0 Complete! 🎉

**13 major features implemented**

**25 commands available**

**9 skills modules**

**20 AI models supported**

---

Last Updated: 2026-03-28
