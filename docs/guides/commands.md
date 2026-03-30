# Command Reference

## Core Commands

| Command | Description | Example |
|---------|-------------|---------|
| `/help` | Show all commands | `/help` |
| `/clear` | Clear chat | `/clear` |
| `/exit` | Exit TUI | `/exit` |
| `/test` | Test command | `/test` |
| `/demo` | Run UI demo | `/demo` |

## Model Commands

| Command | Description | Example |
|---------|-------------|---------|
| `/model` | Open model picker | `/model` |
| `/mode` | Switch agent mode | `/mode` |
| `/cost` | Show session cost | `/cost` |

## File Commands

| Command | Description | Example |
|---------|-------------|---------|
| `/read` | Read file | `/read src/index.tsx` |
| `/write` | Write file | `/write file.txt "content"` |
| `/edit` | Edit file | `/edit file.ts "old" "new"` |
| `/tree` | Show file tree | `/tree` |
| `/files` | Load files in sidebar | `/files` |
| `/attach` | Attach file to context | `/attach file.ts` |
| `/unattach` | Remove attached file | `/unattach file.ts` |

## Context Commands

| Command | Description | Example |
|---------|-------------|---------|
| `/prune` | Remove messages | `/prune 5` |
| `/prune all` | Clear all messages | `/prune all` |
| `/compress` | Summarize old messages | `/compress` |

## Memory Commands

| Command | Description | Example |
|---------|-------------|---------|
| `/memory` | Show memory stats | `/memory` |
| `/memory search` | Search memories | `/memory search "api"` |
| `/memory layer` | Show layer | `/memory layer 5` |
| `/remember` | Save conversation | `/remember` |

## Git Commands

| Command | Description | Example |
|---------|-------------|---------|
| `/git status` | Git status | `/git status` |
| `/git diff` | Show diff | `/git diff` |
| `/git add` | Stage file | `/git add file.ts` |
| `/git commit` | Commit | `/git commit "message"` |
| `/git push` | Push | `/git push` |
| `/git pull` | Pull | `/git pull` |
| `/git log` | Show log | `/git log` |
| `/git branch` | List branches | `/git branch` |
| `/git checkout` | Switch branch | `/git checkout main` |

## Backup Commands

| Command | Description | Example |
|---------|-------------|---------|
| `/undo` | Revert last edit | `/undo` |
| `/backups` | Show backup stats | `/backups` |
| `/clear-backups` | Clear backups | `/clear-backups` |
| `/diff` | Show file diff | `/diff file.ts` |

## Search Commands

| Command | Description | Example |
|---------|-------------|---------|
| `/search` | Search codebase | `/search "function"` |
| `/run` | Run shell command | `/run npm test` |

## Vision Commands

| Command | Description | Example |
|---------|-------------|---------|
| `/vision` | Analyze image | `/vision image.png` |
