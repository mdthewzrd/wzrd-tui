# WZRD TUI Handoff Document

## Project Status
Building an Opencode-style TUI for WZRD.dev framework - **Opencode-Exact Layout**

## Current Location
`/Users/michaeldurante/Downloads/wzrd-tui`

## Launch Command

### Quick Start (Copy & Paste This)
```bash
cd /Users/michaeldurante/Downloads/wzrd-tui && ~/.bun/bin/bun run --watch src/index.tsx
```

### Or step by step:
```bash
cd /Users/michaeldurante/Downloads/wzrd-tui
~/.bun/bin/bun run --watch src/index.tsx
```

### Alternative (if bun is in PATH):
```bash
cd /Users/michaeldurante/Downloads/wzrd-tui
bun run --watch src/index.tsx
```

## What's Working
- **Header**: Model info only on right side (no title)
- **User messages**: Grey boxes with blue left border
- **Assistant responses**: Text on black background, then work section below
- **Work/thinking sections**: Grey bordered boxes with proper spacing
- **Input area**: Grey box with thin colored left border (matches agent), visible at bottom
- **Bottom bar**: Agent info left, shortcuts right
- **Sidebar**: Session title, Context, LSP, Agent Modes, Models, Skills, Gateway V2
- Commands: Full command system implemented
- Tab switches agents, Ctrl+P toggles command palette
- **Scrollable message history** with sticky scroll to bottom (scrollbar appears on overflow)
- **Message persistence** with auto-save every 3 seconds
- **16 sample messages** with rich work sections to demonstrate scrolling

## Commands Implemented
| Command | Description |
|---------|-------------|
| `/help` | Show available commands |
| `/exit` | Exit the TUI |
| `/clear` | Clear all messages |
| `/vision <path>` | Analyze a screenshot |
| `/model <name>` | Switch AI model |
| `/mode <remi/plan/build>` | Switch agent mode |
| `/cost` | Show session cost summary |
| `/save [title]` | Save current session |
| `/load [id]` | Load a session (or list recent if no ID) |
| `/sessions` | List all saved sessions |

## Keyboard Shortcuts
| Key | Action |
|-----|--------|
| `Tab` | Switch agent mode |
| `Ctrl+P` | Toggle command palette |
| `Ctrl+Up/Down` | Scroll messages |
| `PageUp/PageDown` | Scroll by page |
| `Ctrl+Home` | Jump to top |
| `Ctrl+End` | Jump to bottom (auto-scroll) |

## Sample Messages (16 total for scrolling demo)
The TUI now includes realistic sample conversations:
1. **Data table component** - Creating React table with sorting/filtering
2. **Dark mode toggle** - Theme provider with system preference sync
3. **Error handling** - API client with retry logic and error boundaries
4. **Loading skeleton** - Shimmer effect for table loading states
5. **TypeScript fix** - Resolving generic type constraints
6. **CSV export** - Data export functionality
7. **Performance optimization** - Virtual scrolling for large datasets
8. **Row selection** - Bulk actions with checkbox column

Each message includes realistic work sections with:
- Thinking steps with bullet points
- File edits with line counts (+N)
- Complete status indicators
- Proper Opencode-style formatting

## Recent Changes (Completed)
- ✅ **16 sample messages** with rich work sections for scrolling demo
- ✅ **Improved message layouts** matching Opencode exactly
- ✅ **Better work section styling** with bordered grey boxes
- ✅ **Enhanced message headers** with agent name, model, response time
- ✅ **System message support** for commands and notifications
- ✅ **Scrollable message history** using scrollbox component
- ✅ **Auto-scroll** to bottom on new messages (sticky scroll)
- ✅ **Message persistence** with auto-save every 3 seconds
- ✅ **Session management** commands: `/save`, `/load`, `/sessions`

## Files Modified
- `src/WZRDOpencodeClone.tsx` - Main TUI with improved layouts & sample messages
- `src/storage.ts` - Session persistence module
- `src/skills/vision.tsx` - Vision skill for screenshot analysis
- `src/context/vision.tsx` - Vision provider

## Recent Changes (Completed)
- ✅ **NIM API Integration** - Real AI responses via NVIDIA NIM
- ✅ **NIM Status Check** - `/nim` command to verify API connection
- ✅ **Dynamic Model Switching** - Switch between Kimi, DeepSeek, Claude, GPT-4o, GLM
- ✅ **Token Tracking** - Automatic token counting and cost calculation
- ✅ **Thinking States** - Shows "Remi is thinking..." during API calls
- ✅ **Error Handling** - Graceful handling of API errors and missing keys

## Next Steps
1. Add streaming response support for real-time token display
2. Add file attachment support
3. Implement actual vision analysis (screenshot comparison)
4. Add message editing/deletion
5. Add search functionality for messages

## Reference
Opencode screenshots show:
- Work sections in collapsible grey boxes with borders ✓
- File edits with +line counts ✓
- Thinking sections with "Thinking..." header ✓
- Complete status with checkmark ✓
- All assistant responses on black background (not in boxes) ✓
- Agent name in red, model in muted text ✓
- Response time displayed ✓
