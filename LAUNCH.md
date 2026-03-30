# WZRD TUI Launch Command

---

## Quick Start

### One-Liner

```bash
cd /Users/michaeldurante/Downloads/wzrd-tui && ~/.bun/bin/bun run --watch src/index.tsx
```

### Alternative (if bun is in PATH)

```bash
cd /Users/michaeldurante/Downloads/wzrd-tui && bun run --watch src/index.tsx
```

### Production (no watch)

```bash
cd /Users/michaeldurante/Downloads/wzrd-tui && bun run src/index.tsx
```

---

## Features

This TUI includes Phase 6 (v1.1) features:

| Feature | Description |
|---------|-------------|
| **Plan Mode** | Read-only analysis mode |
| **Extended Thinking** | Ctrl+T toggle for deeper reasoning |
| **Session Names** | /rename command |
| **@ References** | Quick file attach with @filepath |
| **Custom Skills** | .skillname commands |
| **CLAUDE.md** | Auto-loads project config |
| **2-Page Sidebar** | Info + Files tabs |

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Tab` | Switch agent modes |
| `Ctrl+P` | Command palette |
| `Ctrl+T` | Extended thinking |
| `Ctrl+F` | Switch sidebar page |
| `↑/↓` | Navigate history |

---

## Sidebar Pages

### Info Page
- Session title
- Context usage
- Agent modes
- Models
- Skills
- Attached files

### Files Page
- Full file tree
- Auto-switches with `/files`
- Scrollable view

---

## Commands

| Command | Description |
|---------|-------------|
| `/help` | Show all commands |
| `/files` | Switch to Files page |
| `/rename` | Rename session |
| `/thinking` | Toggle extended thinking |
| `/claude-md` | Show project config |
| `/skills` | List custom skills |
| `/attach` | Attach file |
| `/clear` | Clear chat |
| `/exit` | Quit TUI |

---

## Tips

1. Use `/files` to automatically switch to Files tab
2. Press `Ctrl+F` to toggle between Info and Files
3. Type `@filename` to quickly attach files
4. Use `.skillname` to run custom skills
