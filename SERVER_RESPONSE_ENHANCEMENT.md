# WZRD Server - Response Enhancement with Work Items

## Current State

Responses are plain text only:
```
I can create a Markdown file for you. Here's the content:
```bash
echo "# WZRD.dev
## Overview
WZRD.dev is a platform providing AI-powered development tools."
```
```

## Required Enhancement

Add **work items** to responses like Opencode:

```json
{
  "type": "agent:completed",
  "data": {
    "content": "I can create a Markdown file for you.",
    "tokensUsed": 123,
    "latency": 456,
    "work": [
      { "type": "thinking", "content": "User wants a markdown file about WZRD.dev..." },
      { "type": "edit", "file": "wzrd-dev.md", "action": "create", "lines": 15 },
      { "type": "complete", "content": "File created successfully" }
    ]
  }
}
```

## Work Item Types

### 1. Thinking
Shows agent's thought process:
```json
{
  "type": "thinking",
  "content": "The user wants a React component. I should:\n1. Create the component file\n2. Add TypeScript types\n3. Include styling"
}
```

### 2. Edit (File Operations)
Shows file changes:
```json
{
  "type": "edit",
  "file": "src/components/Button.tsx",
  "action": "create" | "modify" | "delete",
  "lines": 45,
  "description": "Added click handler"
}
```

### 3. Command
Shows shell commands:
```json
{
  "type": "command",
  "command": "npm install",
  "description": "Installing dependencies"
}
```

### 4. Complete
Marks task as done:
```json
{
  "type": "complete",
  "content": "Button component created with full TypeScript support"
}
```

### 5. Error
Shows errors:
```json
{
  "type": "error",
  "content": "Failed to create file: permission denied"
}
```

## Implementation

### Step 1: Parse Work Items from AI Response

When AI returns response, extract work items:

```typescript
function parseWorkItems(content: string): WorkItem[] {
  const work: WorkItem[] = [];
  
  // Look for file operations
  const filePatterns = [
    { regex: /created?\s+(?:file\s+)?[`"']?(src\/[^`"'\s]+)[`"']?/gi, type: "create" },
    { regex: /modified?\s+(?:file\s+)?[`"']?(src\/[^`"'\s]+)[`"']?/gi, type: "edit" },
    { regex: /deleted?\s+(?:file\s+)?[`"']?(src\/[^`"'\s]+)[`"']?/gi, type: "delete" },
  ];
  
  for (const pattern of filePatterns) {
    const matches = content.matchAll(pattern.regex);
    for (const match of matches) {
      if (match[1]) {
        work.push({
          type: "edit",
          file: match[1],
          action: pattern.type,
          lines: estimateLines(content, match[1])
        });
      }
    }
  }
  
  // Look for commands
  const commandPattern = /(?:running|running command|executed|ran)\s+[`"']?(npm|bun|node|git\s+\w+)[`"']?/gi;
  const commandMatches = content.matchAll(commandPattern);
  for (const match of commandMatches) {
    if (match[1]) {
      work.push({
        type: "command",
        command: match[1],
        description: match[0]
      });
    }
  }
  
  return work;
}
```

### Step 2: Stream Work Items in Real-Time

Send work items as they happen:

```typescript
// When agent starts thinking
ws.send(JSON.stringify({
  type: "skills:loading",
  data: { skills: ["code", "files"] }
}));

// When file is being created
ws.send(JSON.stringify({
  type: "agent:chunk",
  data: { 
    content: "Creating file...",
    work: [{ type: "edit", file: "src/App.tsx", action: "create", lines: 0 }]
  }
}));

// When complete
ws.send(JSON.stringify({
  type: "agent:completed",
  data: {
    content: finalContent,
    tokensUsed: usage.total_tokens,
    latency: Date.now() - startTime,
    work: allWorkItems
  }
}));
```

### Step 3: Add Thinking Steps

Break down complex tasks:

```typescript
const thinkingSteps = [
  { status: "complete", description: "Analyzed request", timestamp: Date.now() },
  { status: "running", description: "Generating code...", timestamp: Date.now() },
  { status: "pending", description: "Verifying syntax", timestamp: Date.now() }
];

ws.send(JSON.stringify({
  type: "agent:chunk",
  data: {
    content: "",
    work: [{
      type: "thinking",
      steps: thinkingSteps
    }]
  }
}));
```

## Example Response Flow

**User:** "Create a React button component"

**Server sends:**
1. `agent:started`
2. `skills:loading` (loading code skill)
3. `agent:chunk` with thinking steps
4. `agent:chunk` with file creation work item
5. `agent:chunk` with code content
6. `skills:loaded`
7. `agent:completed` with final content + all work items

## TUI Display

The TUI will show:
```
Remi-V2 · kimi-k2.5 · 3.2s

I'll create a React button component for you.

Work (3 items)
○ Thinking...
  Analyzing component requirements
● create src/components/Button.tsx +45
● Complete
  Button component created with TypeScript support
```

## Files to Modify

1. `/home/mdwzrd/wzrd-final/src/websocket/server.ts` - Add work items to messages
2. `/home/mdwzrd/wzrd-final/src/runtime/agent-runtime.ts` - Parse work from AI responses
3. `/home/mdwzrd/wzrd-final/src/types/messages.ts` - Add WorkItem type

## Testing

Test with:
```
User: "Create a todo list component"
→ Should see thinking steps
→ Should see file creation work item
→ Should see complete work item
```

---

**Priority: HIGH**  
**Impact: Major UX improvement - shows what agent is doing**
