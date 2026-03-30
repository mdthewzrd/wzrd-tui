# WZRD TUI Command Implementation Plan

## Overview
Complete command suite for the WZRD TUI, following the pattern of supporting both direct arguments and interactive picker overlays.

---

## Phase 1: Essential Dev Commands

### `/run` - Execute Shell Commands
**With argument:** `/run npm install` → Executes command, shows output in chat

**Without argument:** Opens command history picker (recent commands)

**Keyboard:** ↑/↓ to browse history, Enter to run, Escape to cancel

---

### `/search` - Search Codebase
**With argument:** `/search "function handleSubmit"` → Shows results in chat

**Without argument:** Opens search overlay with:
- Input field for pattern
- Recent searches list
- File type filter

---

### `/undo` - Revert Last AI Edit
**With argument:** `/undo 3` → Reverts last 3 AI edits

**Without argument:** Opens undo history picker showing:
- Timestamp
- File edited
- Description of change

---

## Phase 2: Git Integration

### `/git` - Git Operations
**With argument:** `/git status` → Runs git status, shows output

**Without argument:** Opens git menu picker:
- status
- diff
- add
- commit
- push
- log
- branch

---

## Phase 3: Context Management

### `/attach` - Add Files to Context
**With argument:** `/attach src/utils.ts` → Adds to context without displaying

**Without argument:** Opens file picker (similar to /read)
- Multi-select with Space
- Shows selected count

---

### `/prune` - Manage Conversation Length
**With argument:** `/prune 20` → Keeps last 20 messages

**Without argument:** Opens prune picker:
- Slider for message count
- Shows token savings
- Preview what will be removed

---

## Phase 4: Memory & Skills

### `/memory` - Access Memory Layers
**With argument:** `/memory working` → Shows working memory contents

**Without argument:** Opens memory layer picker:
- ephemeral
- working
- short_term
- long_term
- core
- episodic
- semantic

---

### `/skill` - Toggle Skills
**With argument:** `/skill vision` → Toggles vision skill on/off

**Without argument:** Opens skills picker with checkboxes:
- vision [✓]
- git [ ]
- memory [✓]

---

## Phase 5: Utilities

### `/diff` - Show File Changes
**With argument:** `/diff src/index.tsx` → Shows diff for file

**Without argument:** Opens changed files picker (since last save)

---

### `/export` - Export Conversation
**With argument:** `/export markdown` → Saves to file

**Without argument:** Opens format picker:
- markdown
- JSON
- plain text

---

### `/config` - Configuration
**With argument:** `/config theme dark` → Sets config value

**Without argument:** Opens config editor picker:
- theme
- auto_save
- max_tokens
- default_model

---

## Implementation Priority

| Phase | Commands | Est. Time |
|-------|----------|-----------|
| 1 | `/run`, `/search`, `/undo` | 2-3 hours |
| 2 | `/git` | 1 hour |
| 3 | `/attach`, `/prune` | 1-2 hours |
| 4 | `/memory`, `/skill` | 1-2 hours |
| 5 | `/diff`, `/export`, `/config` | 2 hours |

**Total: ~8-10 hours**

---

## Shared Components Needed

1. **CommandHistoryStore** - For `/run` history
2. **SearchIndex** - For `/search` (could use ripgrep)
3. **UndoStack** - For `/undo` (track AI edits)
4. **GitWrapper** - For `/git` commands
5. **MemoryManager** - For `/memory` layers
6. **SkillRegistry** - For `/skill` toggles

---

## Notes

- All pickers follow the same pattern: centered in chat area, keyboard navigation
- Each picker has exclusive keyboard focus when open
- Escape closes any picker
- Enter confirms selection
