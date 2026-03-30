# WZRD TUI Launch Commands

## Quick Start (Copy & Paste This)

```bash
cd /Users/michaeldurante/Downloads/wzrd-tui && ~/.bun/bin/bun run --watch src/index.tsx
```

---

## Step by Step

### 1. Stop Current TUI
Press `Ctrl+C` in the terminal where the TUI is running.

### 2. Launch TUI
```bash
cd /Users/michaeldurante/Downloads/wzrd-tui
~/.bun/bin/bun run --watch src/index.tsx
```

---

## Keyboard Shortcuts (Once Running)

| Key | Action |
|-----|--------|
| `Tab` | Switch agent modes (remi/plan/build) |
| `Ctrl+P` | Toggle commands panel |
| `Enter` | Send message |
| `Ctrl+C` | Exit TUI |

---

## Troubleshooting

### If bun is not found:
```bash
export PATH="$HOME/.bun/bin:$PATH"
```

### If dependencies are missing:
```bash
cd /Users/michaeldurante/Downloads/wzrd-tui
~/.bun/bin/bun install
```

---

## What You Should See After Restart

- Clean chat area (no mock messages - type to chat)
- User messages in grey boxes with blue left border
- Assistant responses on black background with red left border (no box)
- Work/thinking sections in grey boxes
- Message headers: "You • 10:19 AM" and "Remi-V2 • kimi-k2.5 • 1.2s"
- Input area with thin red left border and grey background
- Bottom bar: "remi Kimi K2.5 Nvidia" on left, "tab agents ctrl+p commands" on right
- LSP section: "• typescript Downloads/wzrd-tui"
- Skills section showing Vision, Git, Memory
- Context stats: tokens, % used, $ spent
- Getting Started section at bottom of sidebar

---

## Commands

| Command | Action |
|---------|--------|
| `/exit` | Exit the TUI |
| `/help` | Show help |
| `/vision` | Vision analysis |
| `/nim` | Check NIM API status |
| `/model <name>` | Switch AI model |
| `/mode <remi|plan|build>` | Switch agent mode |
| `/save [title]` | Save session |
| `/load <id>` | Load session |
| `/sessions` | List saved sessions |
| `/clear` | Clear messages |
| `/cost` | Show cost summary |

---

## NIM API Configuration

To use real AI responses, configure the NIM API:

```bash
export NIM_API_KEY="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"
```

Then restart the TUI. The sidebar will show "NIM API: Connected" when configured.

---

## Development Commands

### Change to project directory:
```bash
cd /Users/michaeldurante/Downloads/wzrd-tui
```

### Launch with hot reload:
```bash
~/.bun/bin/bun run --watch src/index.tsx
```

### One-liner (cd + launch):
```bash
cd /Users/michaeldurante/Downloads/wzrd-tui && ~/.bun/bin/bun run --watch src/index.tsx
```
