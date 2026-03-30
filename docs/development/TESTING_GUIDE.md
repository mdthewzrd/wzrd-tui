# WZRD TUI Testing Guide

## Overview
The TUI has been fully restored and is ready for rigorous testing. All major features are implemented.

## Launch Command
```bash
cd /Users/michaeldurante/Downloads/wzrd-tui && ~/.bun/bin/bun run --watch src/index.tsx
```

## Features Implemented

### 1. Core Chat Functionality ✅
- Real-time messaging with AI
- Message history with timestamps
- Auto-scrolling to bottom
- Message persistence (auto-saves every 3 seconds)

### 2. NIM API Integration ✅
- Supports 5 models: Kimi K2.5, DeepSeek V3.2, Claude 3.5, GPT-4o, GLM-4.7
- Real API calls to NVIDIA NIM
- Token tracking and cost calculation
- Error handling for API failures

### 3. Command System ✅
| Command | Description |
|---------|-------------|
| `/help` | Show all commands |
| `/exit` | Exit TUI |
| `/clear` | Clear messages |
| `/vision <path>` | Analyze screenshot |
| `/model <name>` | Switch AI model |
| `/mode <remi/plan/build>` | Switch agent mode |
| `/cost` | Show session cost |
| `/save [title]` | Save session |
| `/load <id>` | Load session |
| `/sessions` | List saved sessions |
| `/nim` | Check NIM API status |

### 4. Opencode-Style UI ✅
- Dark theme with exact Opencode colors
- Work items display (thinking, edit, complete, error)
- Agent modes (Remi, Plan, Build) with color coding
- Sidebar with Context, LSP, Models, Skills sections
- Command palette (Ctrl+P)

### 5. Scrollbar Fix ✅
- Vertical scrollbar now positioned on the RIGHT side
- Horizontal scrollbar hidden
- Wrapped scrollbox in flexDirection="row" container

### 6. Session Persistence ✅
- Auto-saves every 3 seconds
- Manual save/load with `/save` and `/load`
- Session browser with `/sessions`
- Stored in `~/.wzrd-tui/sessions/`

## Testing Checklist

### Basic Functionality
- [ ] Launch TUI with `bun run --watch src/index.tsx`
- [ ] Type a message and press Enter to send
- [ ] Verify AI response appears
- [ ] Check message timestamps are correct

### Commands
- [ ] Type `/help` - should show command list
- [ ] Type `/model kimi` - should switch to Kimi K2.5
- [ ] Type `/mode plan` - should switch to Plan mode
- [ ] Type `/cost` - should show token/cost info
- [ ] Type `/save my-session` - should save session
- [ ] Type `/sessions` - should list saved sessions
- [ ] Type `/clear` - should clear all messages

### NIM API
- [ ] Set `export NIM_API_KEY="your-key"` before launching
- [ ] Type `/nim` - should show "Connected"
- [ ] Send a message - should get real AI response
- [ ] Check sidebar shows "NIM API: Connected"

### Scrollbar
- [ ] Send many messages to fill screen
- [ ] Verify vertical scrollbar appears on RIGHT side
- [ ] Verify NO horizontal scrollbar at bottom
- [ ] Test PageUp/PageDown to scroll
- [ ] Test Ctrl+Home/Ctrl+End to jump to top/bottom

### UI Elements
- [ ] Check sidebar shows all sections (Context, LSP, Agent Modes, Models, Skills)
- [ ] Verify agent mode colors (Remi=red, Plan=green, Build=orange)
- [ ] Press Tab to cycle through agent modes
- [ ] Press Ctrl+P to open/close command palette

### Session Persistence
- [ ] Send some messages
- [ ] Type `/save test-session`
- [ ] Exit TUI (Ctrl+C)
- [ ] Relaunch TUI
- [ ] Type `/sessions` - should see saved session
- [ ] Type `/load <session-id>` - should restore messages

### Error Handling
- [ ] Launch without NIM_API_KEY - should show "not configured" message
- [ ] Type `/model invalid` - should show error
- [ ] Type `/mode invalid` - should show error
- [ ] Type `/unknown` - should show "unknown command"

## Known Issues
1. **Scrollbar positioning**: Fixed - now on right side
2. **File corruption**: Fixed - restored from working backup
3. **Box tag mismatch**: Fixed - all tags properly balanced

## File Structure
```
src/
├── WZRDOpencodeClone.tsx    # Main TUI component (902 lines)
├── api/
│   └── nim.ts               # NIM API client
├── storage.ts               # Session persistence
├── skills/
│   └── vision.tsx           # Vision skill
└── index.tsx                # Entry point
```

## Configuration
Set environment variable before launching:
```bash
export NIM_API_KEY="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"
```

## Next Steps (Optional Enhancements)
1. Add streaming responses for real-time token display
2. Add syntax highlighting for code blocks
3. Add file attachment support
4. Add keyboard shortcut help overlay
5. Add theme customization

## Support
If issues arise during testing:
1. Check LAUNCH.md for commands
2. Verify NIM_API_KEY is set
3. Check HANDOFF.md for architecture details
4. Review error messages in terminal

---
**Status**: Ready for testing ✅
**Last Updated**: 2026-03-24
**Version**: WZRD TUI v1.0
