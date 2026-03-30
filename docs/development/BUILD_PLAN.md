# WZRD TUI - 1 Hour Build Plan

## Overview
Systematic feature development and testing while user is away. Each phase has clear deliverables and testing checkpoints.

---

## Phase 1: Core Stability (0:00 - 0:10)
**Goal:** Fix existing issues, ensure stable foundation

### Tasks
- [ ] Fix TypeScript errors in WZRDOpencodeClone.tsx
- [ ] Fix TypeScript errors in api/nim.ts
- [ ] Add proper error boundaries
- [ ] Test basic message flow

### Testing
```bash
cd /Users/michaeldurante/Downloads/wzrd-tui
bun run src/index.tsx &
# Test: Send "hello" - should work with retry logic
# Test: Send rapid messages - should queue properly
```

**Checkpoint:** Basic chat works without crashes

---

## Phase 2: Message History & Persistence (0:10 - 0:20)
**Goal:** Messages survive restart, can view history

### Tasks
- [ ] Implement SQLite persistence for messages
- [ ] Add session management (create, list, switch)
- [ ] Auto-save every 30 seconds
- [ ] Load previous session on startup

### Files to Modify
- `src/storage.ts` - Add SQLite schema and queries
- `src/WZRDOpencodeClone.tsx` - Add session hooks

### Testing
```bash
# Test 1: Send messages, exit, restart - messages should persist
# Test 2: /sessions command lists all sessions
# Test 3: /load <id> switches to different session
# Test 4: /save "My Session" creates named session
```

**Checkpoint:** Messages persist across restarts

---

## Phase 3: Multi-Line Input & Editing (0:20 - 0:30)
**Goal:** Better input experience

### Tasks
- [ ] Multi-line input support (Shift+Enter for new line)
- [ ] Input history (Up/Down arrows)
- [ ] Auto-complete for commands (/ + Tab)
- [ ] Character count display

### Files to Modify
- `src/WZRDOpencodeClone.tsx` - Input handling

### Testing
```bash
# Test 1: Type line, Shift+Enter, type more - should be multi-line
# Test 2: Press Up - should show previous message
# Test 3: Type "/" then Tab - should show command suggestions
# Test 4: Long input shows character count
```

**Checkpoint:** Input feels natural and responsive

---

## Phase 4: Message Enhancements (0:30 - 0:40)
**Goal:** Rich message display

### Tasks
- [ ] Markdown rendering (bold, italic, code blocks)
- [ ] Syntax highlighting for code
- [ ] Copy code button
- [ ] Message timestamps relative ("2m ago")
- [ ] Message actions (copy, delete, retry)

### Files to Modify
- `src/WZRDOpencodeClone.tsx` - Message rendering
- `src/components/Message.tsx` - New component

### Testing
```bash
# Test 1: "Make this **bold**" - should render bold
# Test 2: Code blocks should have syntax highlighting
# Test 3: Hover message shows copy/retry buttons
# Test 4: Timestamps show relative time
```

**Checkpoint:** Messages look professional and are actionable

---

## Phase 5: Agent System (0:40 - 0:50)
**Goal:** Working agent modes

### Tasks
- [ ] Plan mode: Breaks tasks into steps
- [ ] Build mode: Generates code with file operations
- [ ] System prompts per mode
- [ ] Mode-specific UI indicators

### Files to Modify
- `src/agents/plan.ts` - Planning agent logic
- `src/agents/build.ts` - Build agent logic
- `src/WZRDOpencodeClone.tsx` - Mode switching

### Testing
```bash
# Test 1: Switch to Plan mode, ask "Build a todo app" - should show steps
# Test 2: Switch to Build mode, ask "Create a button" - should generate code
# Test 3: Mode colors change in sidebar
# Test 4: Mode persists in session
```

**Checkpoint:** Each mode behaves differently

---

## Phase 6: File Operations (0:50 - 0:55)
**Goal:** AI can read/write files

### Tasks
- [ ] /read command to read file contents
- [ ] /write command to create files
- [ ] /edit command to modify files
- [ ] File tree view in sidebar
- [ ] Diff view for changes

### Files to Modify
- `src/skills/files.ts` - File operations
- `src/WZRDOpencodeClone.tsx` - Add commands

### Testing
```bash
# Test 1: /read src/index.tsx - shows file content
# Test 2: /write test.txt "Hello world" - creates file
# Test 3: AI suggests edit - shows diff before applying
# Test 4: File tree updates in sidebar
```

**Checkpoint:** Can manipulate files through chat

---

## Phase 7: Polish & Final Testing (0:55 - 1:00)
**Goal:** Everything works together

### Tasks
- [ ] Keyboard shortcuts help (/?)
- [ ] Settings persistence
- [ ] Theme consistency check
- [ ] Performance optimization
- [ ] Final integration test

### Final Test Script
```bash
# Complete workflow test:
1. Start TUI
2. Send "Hello" - should stream response
3. Switch to Plan mode
4. Send "Plan a React app" - should show steps
5. Switch to Build mode
6. Send "Create App.tsx" - should generate code
7. /save "Test Session"
8. Exit and restart
9. Messages should persist
10. /sessions shows saved session
```

**Checkpoint:** All features work in harmony

---

## Quick Reference: Commands to Test

| Feature | Test Command | Expected Result |
|---------|--------------|-----------------|
| Basic chat | "Hello" | Streaming response |
| Rate limit | Rapid sends | Auto-retry with message |
| Persistence | Exit & restart | Messages still there |
| Sessions | /sessions | List of sessions |
| Multi-line | Shift+Enter | New line in input |
| History | Up arrow | Previous message |
| Markdown | "**bold**" | Bold text |
| Code | "```js\nconst x = 1;\n```" | Syntax highlighted |
| Plan mode | Tab → Plan → "Plan a project" | Step-by-step output |
| Build mode | Tab → Build → "Create button" | Code output |
| Read file | /read package.json | Shows file content |
| Write file | /write test.txt "hi" | Creates file |

---

## Emergency Contacts

If something breaks:
1. Check `bun run src/index.tsx` output for errors
2. Revert last change with git
3. Test previous checkpoint
4. Continue from last working state

---

## Success Criteria

- [ ] Can chat with streaming responses
- [ ] Rate limits handled gracefully
- [ ] Messages persist across restarts
- [ ] Can switch between agent modes
- [ ] Multi-line input works
- [ ] Markdown renders properly
- [ ] File operations work
- [ ] No TypeScript errors
- [ ] All tests pass

**Status:** Ready to build 🚀
