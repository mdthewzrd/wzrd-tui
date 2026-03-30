# WZRD TUI

A terminal-based AI chat interface with multi-provider support, 7-layer memory system, and real-time streaming.

![WZRD TUI](https://img.shields.io/badge/WZRD-TUI-blue)
![Version](https://img.shields.io/badge/version-1.0-green)
![License](https://img.shields.io/badge/license-MIT-yellow)

---

## Features

### 🤖 Multi-Provider Support

- **Nvidia NIM** - 8 free models (Kimi, DeepSeek, Nemotron, Qwen)
- **Z AI Coding** - 6 models with coding subscription (GLM family)
- **OpenRouter** - 6 models including free tiers

### 🧠 7-Layer Memory System

- Working, Short-term, Medium-term, Long-term memory
- Semantic, Episodic, and Procedural memory layers
- Automatic context injection
- Full-text search across all memories

### 💬 Rich Chat Interface

- Real-time streaming responses
- Syntax highlighting for code blocks
- File diff viewer
- Token budget alerts
- Context compression

### 🛠️ Developer Tools

- 25 built-in commands
- File operations with backup/undo
- Git integration
- Codebase search (grep/ripgrep)
- Shell command execution

---

## Quick Start

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd wzrd-tui

# Install dependencies
bun install

# Run the TUI
bun run src/index.tsx
```

### Configuration

Set your API keys in `~/.wzrd/config.json`:

```json
{
  "apiKeys": {
    "zai": "your-zai-api-key"
  },
  "defaultModel": "glm-4.7",
  "defaultProvider": "zai"
}
```

Or use environment variables:

```bash
export ZAI_API_KEY="your-key"
export OPENROUTER_API_KEY="your-key"
```

---

## Commands

### Core

| Command | Description |
|---------|-------------|
| `/help` | Show all commands |
| `/clear` | Clear chat |
| `/exit` | Exit TUI |

### Model & Mode

| Command | Description |
|---------|-------------|
| `/model` | Open model picker |
| `/mode` | Switch agent mode |

### Files

| Command | Description |
|---------|-------------|
| `/read <file>` | Read file contents |
| `/edit <file>` | Edit file |
| `/attach <file>` | Add file to context |
| `/tree` | Show file tree |

### Context

| Command | Description |
|---------|-------------|
| `/prune <n>` | Remove messages |
| `/compress` | Summarize old messages |

### Memory

| Command | Description |
|---------|-------------|
| `/memory` | Show memory stats |
| `/memory search <query>` | Search memories |
| `/remember` | Save conversation |

### Git

| Command | Description |
|---------|-------------|
| `/git status` | Git status |
| `/git commit <msg>` | Commit changes |
| `/git push` | Push to remote |

### Backup

| Command | Description |
|---------|-------------|
| `/undo` | Revert last edit |
| `/diff <file>` | Show file diff |

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Tab` | Cycle agent modes |
| `Ctrl+P` | Toggle command palette |
| `Ctrl+A` | Provider view |
| `↑/↓` | Navigate |
| `Enter` | Select |
| `Escape` | Close/Cancel |

---

## Project Structure

```
src/
├── index.tsx          # Main TUI
├── api/
│   └── providers.ts   # API clients
├── skills/
│   ├── files.ts       # File operations
│   ├── shell.ts       # Shell execution
│   ├── search.ts      # Codebase search
│   ├── git.ts         # Git operations
│   ├── backup.ts      # File backups
│   ├── diff.ts        # Diff viewer
│   ├── syntax.ts      # Syntax highlighting
│   └── memory.ts      # 7-layer memory
└── config.ts          # Configuration
```

---

## Documentation

- [HANDOFF.md](HANDOFF.md) - Project handoff details
- [ROADMAP.md](ROADMAP.md) - Development roadmap
- [ANALYSIS.md](ANALYSIS.md) - Technical analysis

---

## License

MIT
