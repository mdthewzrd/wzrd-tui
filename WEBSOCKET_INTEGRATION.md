# WZRD TUI v1.1 - WebSocket Integration Project

## Overview

This is the **WZRD TUI** (Terminal User Interface) - a chat-based AI assistant that runs in the terminal using SolidJS and OpenTUI.

---

## What It Is

- A terminal-based chat interface similar to OpenCode's TUI
- Multi-provider AI support (Nvidia NIM, Z AI, OpenRouter)
- 20+ AI models including Kimi K2.5, DeepSeek, Claude, GPT-4o
- Built with TypeScript, SolidJS, and Bun runtime

---

## Current Features

| Feature | Description |
|---------|-------------|
| **Interactive File Browser** | Navigate with arrows, expand/collapse directories |
| **2-Page Sidebar** | Info tab + Files tab (Ctrl+F to switch) |
| **Agent Modes** | Plan / Build / Remi modes |
| **Extended Thinking** | Ctrl+T toggle for deeper reasoning |
| **Session Management** | Save/load sessions with persistence |
| **File Attachment** | @references for quick file inclusion |
| **Custom Skills** | .skillname commands from ~/.wzrd/skills/ |
| **CLAUDE.md Support** | Auto-loads project-specific instructions |
| **ESC Interrupt** | Stop AI processing mid-stream |
| **Duplicate Prevention** | Lock mechanism for file attachments |

---

## WebSocket Goal

Connect this TUI to a WebSocket server at:
```
ws://100.118.174.102:5666
```

### Objectives:
- Receive messages from external sources
- Send chat responses back to the server
- Sync sessions across multiple clients
- Enable real-time collaboration
- Handle connection drops and reconnections

---

## File Location

**Main TUI file:**
```
/Users/michaeldurante/Downloads/wzrd-tui/src/index.tsx
```

**Full source:**
```
/Users/michaeldurante/Downloads/wzrd-tui/src/WZRDOpencodeClone.tsx
```

---

## Launch Command

```bash
cd /Users/michaeldurante/Downloads/wzrd-tui && bun run --watch src/index.tsx
```

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Tab` | Switch agent modes |
| `Ctrl+P` | Toggle command palette |
| `Ctrl+T` | Toggle extended thinking |
| `Ctrl+F` | Switch sidebar page (Info/Files) |
| `↑/↓` or `j/k` | Navigate file browser |
| `Enter/Space/l` | Open file or toggle directory |
| `h` | Collapse directory |
| `ESC` | Interrupt processing / close overlays |

---

## Commands

| Command | Description |
|---------|-------------|
| `/help` | Show all commands |
| `/files` | Open file browser (switches to Files tab) |
| `/attach <file>` | Attach file to context |
| `/rename` | Rename current session |
| `/thinking` | Toggle extended thinking mode |
| `/claude-md` | Show CLAUDE.md configuration |
| `/skills` | List custom skills |
| `/save [title]` | Save session |
| `/load <id>` | Load session |
| `/sessions` | List saved sessions |
| `/ws` | Check WebSocket status |
| `/nim` | Check NIM API status |
| `/clear` | Clear chat |
| `/exit` | Quit TUI |

---

## Architecture

### Tech Stack:
- **Runtime:** Bun
- **Framework:** SolidJS with OpenTUI
- **Language:** TypeScript
- **Styling:** Terminal-based (no CSS, uses OpenTUI components)

### Key Components:
- `index.tsx` - Entry point
- `WZRDOpencodeClone.tsx` - Main TUI component (~4000 lines)
- `websocket-client.ts` - WebSocket client (needs integration)
- `api/nim.ts` - NIM API client
- `storage.ts` - Session persistence
- `skills/` - File operations, git, search, memory, vision

---

## WebSocket Status

Current WebSocket implementation exists in:
```
/Users/michaeldurante/Downloads/wzrd-tui/src/websocket-client.ts
```

**Current status:** Basic connection established but needs:
- Message protocol definition
- Bidirectional message handling
- Session synchronization
- Error handling improvements

---

## What We Need Help With

[Fill in your specific needs here]

Examples:
- "Implement message protocol for chat sync"
- "Add session state synchronization over WebSocket"
- "Fix reconnection logic when server drops"
- "Create message queue for offline mode"
- "Add authentication to WebSocket connection"

---

## Contact

This TUI is being developed as part of the WZRD.dev ecosystem.

**Location:** `/Users/michaeldurante/Downloads/wzrd-tui/`

---

*Last updated: March 30, 2026*
