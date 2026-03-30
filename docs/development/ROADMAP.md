# WZRD TUI - Complete Roadmap to v1.0

## Overview

This document contains **every single task** needed to complete the WZRD TUI project, organized by priority and phase.

---

## 🚨 PHASE 1: ESSENTIAL (Next 1-2 Weeks)

These are **must-have** features for a usable v1.0 release.

### 1.1 Context Management

- [ ] **`/prune` command**
  - Remove specific messages from context
  - Remove all messages before/after a point
  - Remove by message ID
  - Confirmation before pruning
  - Update token count after pruning

- [ ] **`/attach` command**
  - Add files to conversation context
  - Support multiple files
  - File type validation
  - Size limits (configurable)
  - Show attached files in sidebar
  - Include file content in system prompt

- [ ] **Complete `/undo` command**
  - Create file backups before AI edits
  - Store backup in `~/.wzrd/backups/`
  - Restore from backup on `/undo`
  - Support multi-file undo
  - Show diff before restoring

### 1.2 Token Management

- [ ] **Token budget alerts**
  - Warn at 80% of context limit
  - Warn at 95% of context limit
  - Suggest `/prune` when near limit
  - Configurable thresholds

- [ ] **Context compression**
  - Summarize old messages automatically
  - Keep N most recent messages full
  - Compress older messages to summaries
  - Show compression ratio

---

## 🔮 PHASE 2: MEMORY SYSTEM (Weeks 3-4)

The 7-layer memory architecture - **high value** feature.

### 2.1 Foundation

- [ ] **Design memory schema**
  - Layer 1: Working memory (current session)
  - Layer 2: Short-term (recent sessions)
  - Layer 3: Medium-term (project context)
  - Layer 4: Long-term (user preferences)
  - Layer 5: Semantic (knowledge base)
  - Layer 6: Episodic (past experiences)
  - Layer 7: Procedural (how-to knowledge)

- [ ] **Memory storage**
  - SQLite table for memories
  - Vector embeddings for semantic search
  - Timestamps and relevance scores
  - Auto-categorization

### 2.2 Commands

- [ ] **`/memory` command**
  - Show memory layers
  - Search memories
  - Add manual memory
  - Delete memories
  - Memory statistics

- [ ] **`/remember` command**
  - Save current context as memory
  - Tag with categories
  - Set expiration

### 2.3 Context Injection

- [ ] **Auto-include relevant memories**
  - Search memories based on current query
  - Inject top-N relevant memories
  - Show which memories were used
  - Configurable injection count

---

## 🤖 PHASE 3: SUBAGENT SYSTEM (Weeks 5-6)

Parallel execution for complex tasks.

### 3.1 Core System

- [ ] **Subagent spawning**
  - Create child agents
  - Assign specific tasks
  - Monitor progress
  - Collect results

- [ ] **Subagent cards UI**
  - Visual representation in sidebar
  - Show status (running/complete/failed)
  - Progress indicators
  - Result preview

### 3.2 Execution

- [ ] **Parallel execution**
  - Run multiple subagents concurrently
  - Resource management
  - Rate limiting
  - Result aggregation

- [ ] **Subagent commands**
  - `/subagent spawn <task>`
  - `/subagent list`
  - `/subagent status <id>`
  - `/subagent kill <id>`

---

## ✨ PHASE 4: POLISH (Weeks 7-8)

Quality of life improvements.

### 4.1 File Operations

- [ ] **File diff viewer**
  - Show before/after side by side
  - Highlight changes
  - Accept/reject changes
  - Navigate between changes

- [ ] **Syntax highlighting**
  - Colorize code blocks
  - Support major languages
  - Theme-aware colors

### 4.2 Error Handling

- [ ] **Better error messages**
  - User-friendly error descriptions
  - Suggested fixes
  - Retry options
  - Error logging

- [ ] **Connection recovery**
  - Auto-retry on failure
  - Exponential backoff
  - Offline mode indicator

### 4.3 Testing

- [ ] **Test suite**
  - Unit tests for skills
  - Integration tests for API
  - UI component tests
  - Mock providers for testing

---

## 🔧 PHASE 5: BUG FIXES (Ongoing)

Technical debt and known issues.

### 5.1 TypeScript Issues

- [ ] **Fix command autocomplete error**
  - Resolve "Object is possibly 'undefined'"
  - Add proper type guards

### 5.2 UI Fixes

- [ ] **Fix scroll indicator**
  - Show filtered count, not total
  - Update on filter change

- [ ] **Model picker positioning**
  - Recalculate on terminal resize
  - Center properly on all screen sizes

### 5.3 Performance

- [ ] **Optimize large conversations**
  - Virtual scrolling for messages
  - Lazy load old messages
  - Compress message history

---

## 🚀 PHASE 6: ADVANCED FEATURES (Post-v1.0)

Nice-to-have features for future releases.

### 6.1 Extensibility

- [ ] **Plugin system**
  - Load external plugins
  - Plugin API
  - Plugin marketplace
  - Sandboxed execution

### 6.2 Multimodal

- [ ] **Image rendering**
  - Show images in terminal (ASCII or kitty protocol)
  - Image upload support
  - Screenshot capture

- [ ] **Voice I/O**
  - Speech recognition
  - Text-to-speech
  - Voice commands

### 6.3 Collaboration

- [ ] **Session sharing**
  - Export session as file
  - Import shared session
  - Sync across devices

- [ ] **Team features**
  - Shared context
  - Collaborative editing
  - Comments on messages

---

## 📋 COMPLETE TASK LIST

### High Priority (Must Have)

1. [ ] `/prune` command - Remove messages from context
2. [ ] `/attach` command - Add files to conversation
3. [ ] Complete `/undo` - File backup and restore
4. [ ] Token budget alerts - Warn at 80%/95%
5. [ ] Context compression - Auto-summarize old messages
6. [ ] Memory system foundation - 7-layer architecture
7. [ ] `/memory` command - Access memory layers
8. [ ] Memory persistence - Save to SQLite
9. [ ] Context injection - Auto-include relevant memories

### Medium Priority (Should Have)

10. [ ] Subagent system - Spawn parallel agents
11. [ ] Subagent cards UI - Visual representation
12. [ ] File diff viewer - Show before/after
13. [ ] Syntax highlighting - Colorize code
14. [ ] Better error handling - User-friendly messages
15. [ ] Test suite - Unit and integration tests

### Low Priority (Nice to Have)

16. [ ] Plugin system - Extensible architecture
17. [ ] Image rendering - Show in terminal
18. [ ] Voice I/O - Speech recognition
19. [ ] Session sharing - Export/import
20. [ ] Team features - Collaboration

### Bug Fixes

21. [ ] Fix command autocomplete TypeScript error
22. [ ] Fix scroll indicator filtered count
23. [ ] Fix model picker positioning on resize
24. [ ] Optimize large conversations

---

## 📊 PROGRESS TRACKING

```
Total Tasks: 24

By Phase:
├── Phase 1 (Essential): 5 tasks
├── Phase 2 (Memory): 4 tasks
├── Phase 3 (Subagents): 3 tasks
├── Phase 4 (Polish): 4 tasks
├── Phase 5 (Bugs): 4 tasks
└── Phase 6 (Advanced): 4 tasks

By Priority:
├── High: 9 tasks (v1.0 blockers)
├── Medium: 5 tasks
└── Low: 10 tasks
```

---

## 🎯 v1.0 LAUNCH CRITERIA

**Required for v1.0:**
- [ ] All Phase 1 tasks complete
- [ ] All Phase 5 bug fixes complete
- [ ] Basic documentation
- [ ] Installation script

**Nice to have:**
- [ ] Phase 2 memory system
- [ ] Phase 4 polish features

---

## 🏁 CURRENT STATUS

**Completed:** 75% (Foundation complete)
**Remaining:** 25% (Advanced features)
**Estimated Time to v1.0:** 2-3 weeks
**Estimated Time to Complete:** 6-8 weeks

---

Last Updated: 2026-03-28
