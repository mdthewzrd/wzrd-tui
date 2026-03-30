# Chat UI Research: Opencode & Claude Patterns

## Current State Analysis

Our TUI currently shows:
- Simple text messages (user/assistant/system)
- Basic streaming with "Thinking..." indicator
- Static sidebar with info

**What's Missing:** Rich work visualization, progress tracking, subagent orchestration

---

## Opencode Patterns

### 1. Thinking Blocks
```
┌─────────────────────────────────────┐
│ ▣ Remi-V2 · Kimi K2.5 · 2.3s       │
│                                     │
│ Thinking...                         │
│ ○ Analyzing codebase structure        │
│ ○ Identifying relevant files          │
│ ○ Planning modifications              │
│                                     │
│ [Expandable thinking trace]          │
└─────────────────────────────────────┘
```

**Features:**
- Collapsible thinking section
- Step-by-step progress indicators
- Timing for each step
- Ability to view full reasoning

---

### 2. Work Items / Edits
```
┌─────────────────────────────────────┐
│ ▣ Remi-V2 · Kimi K2.5 · 5.1s       │
│                                     │
│ Modified 3 files:                    │
│                                     │
│ ✓ src/components/Button.tsx          │
│   +12 lines, -3 lines                │
│   [View diff] [Undo]                 │
│                                     │
│ ✓ src/styles/theme.css               │
│   +8 lines, -0 lines                 │
│   [View diff] [Undo]                 │
│                                     │
│ ✓ package.json                       │
│   +1 line, -0 lines                  │
│   [View diff] [Undo]                 │
│                                     │
│ [Apply all] [Discard all]           │
└─────────────────────────────────────┘
```

**Features:**
- File-level change summary
- Line count deltas
- Per-file actions (view, undo)
- Batch actions
- Syntax-highlighted diff view

---

### 3. Command Execution
```
┌─────────────────────────────────────┐
│ ▣ Remi-V2 · Kimi K2.5              │
│                                     │
│ Running: npm run build              │
│                                     │
│ ▶ Building...                      │
│   src/index.tsx → dist/index.js     │
│   ✓ 42 modules transformed          │
│                                     │
│ ▶ Build complete in 1.2s            │
│   [View full output]                │
│                                     │
│ [Rerun] [Copy output]               │
└─────────────────────────────────────┘
```

**Features:**
- Live command output streaming
- Collapsible full output
- Action buttons (rerun, copy)
- Exit code indication

---

### 4. Subagent Orchestration
```
┌─────────────────────────────────────┐
│ ▣ Remi-V2 · Kimi K2.5              │
│                                     │
│ Spawning subagents...               │
│                                     │
│ ┌─ Research Agent ───────────────┐ │
│ │ ○ Searching for API docs        │ │
│ │ ✓ Found 3 relevant sources      │ │
│ │ [View findings]                  │ │
│ └──────────────────────────────────┘ │
│                                     │
│ ┌─ Build Agent ───────────────────┐ │
│ │ ✓ Generated component           │ │
│ │ ○ Running tests...              │ │
│ │ [View code] [View tests]         │ │
│ └──────────────────────────────────┘ │
│                                     │
│ [View all results]                  │
└─────────────────────────────────────┘
```

**Features:**
- Parallel agent cards
- Individual agent status
- Collapsible agent details
- Aggregate results view

---

### 5. Progress Indicators
```
┌─────────────────────────────────────┐
│ ▣ Remi-V2 · Kimi K2.5              │
│                                     │
│ Processing large codebase...        │
│                                     │
│ [████████░░░░░░░░░░] 45%           │
│                                     │
│ Files analyzed: 23/51               │
│ Estimated time remaining: 12s        │
└─────────────────────────────────────┘
```

---

## Claude Patterns (Artifacts)

### 1. Artifact Creation
```
┌─────────────────────────────────────┐
│ Claude 3.5                          │
│                                     │
│ I've created a React component:      │
│                                     │
│ ┌─ 📄 Button.tsx ─────────────────┐│
│ │ [Preview] [Code] [Copy] [Edit]   ││
│ │                                  ││
│ │  export function Button() {      ││
│ │    return <button>Click</button> ││
│ │  }                               ││
│ │                                  ││
│ └──────────────────────────────────┘│
│                                     │
│ This component includes...          │
└─────────────────────────────────────┘
```

**Features:**
- Tabbed view (preview/code)
- Action buttons per artifact
- Syntax highlighting
- Inline editing capability

---

### 2. Multi-Step Workflows
```
┌─────────────────────────────────────┐
│ Claude 3.5                          │
│                                     │
│ Step 1: Analyze requirements ✓       │
│ Step 2: Design database schema ✓   │
│ Step 3: Generate API routes ○      │
│ Step 4: Create frontend components  │
│ Step 5: Write tests                 │
│                                     │
│ [View all steps] [Pause]            │
└─────────────────────────────────────┘
```

---

## Proposed WZRD Chat Enhancements

### Message Types to Add

1. **ThinkingMessage**
   - Collapsible reasoning trace
   - Step indicators with timing
   - Token usage per step

2. **WorkItemMessage**
   - File changes with diffs
   - Command outputs
   - Test results
   - Build status

3. **SubagentMessage**
   - Parallel agent cards
   - Status per agent
   - Result aggregation

4. **ProgressMessage**
   - Progress bars
   - ETA calculations
   - Cancel capability

5. **ArtifactMessage**
   - Code blocks with actions
   - Preview tabs
   - Version history

---

## UI Components Needed

### 1. CollapsibleSection
```tsx
<CollapsibleSection 
  title="Thinking..." 
  expanded={false}
  badge="2.3s"
>
  {thinkingContent}
</CollapsibleSection>
```

### 2. WorkItemCard
```tsx
<WorkItemCard
  type="edit" | "command" | "test"
  file="src/index.tsx"
  additions={12}
  deletions={3}
  actions={["view", "undo", "apply"]}
/>
```

### 3. SubagentCard
```tsx
<SubagentCard
  name="Research Agent"
  status="running" | "complete" | "error"
  progress={45}
  results={...}
/>
```

### 4. CommandOutput
```tsx
<CommandOutput
  command="npm test"
  output={...}
  exitCode={0}
  actions={["rerun", "copy"]}
/>
```

### 5. ArtifactBlock
```tsx
<ArtifactBlock
  name="Button.tsx"
  language="typescript"
  code={...}
  tabs={["preview", "code"]}
  actions={["copy", "edit", "download"]}
/>
```

---

## Implementation Priority

| Component | Complexity | Impact |
|-----------|-----------|--------|
| CollapsibleSection | Low | High |
| WorkItemCard | Medium | High |
| CommandOutput | Medium | High |
| SubagentCard | High | Medium |
| ArtifactBlock | Medium | Medium |
| ProgressMessage | Low | Medium |

---

## Visual Design Notes

### Colors
- Thinking: `theme.textMuted` (grey)
- Success: `theme.accentGreen`
- Running: `theme.accentOrange`
- Error: `theme.accentRed`
- Info: `theme.accentBlue`

### Icons
- Thinking: `○` (circle)
- Success: `✓` (check)
- Running: `◐` (half circle)
- Error: `✗` (x)
- File: `📄` or `▣`
- Command: `▶`

### Animations
- Thinking dots: `...` cycling
- Progress bar: smooth fill
- Status changes: color transition

---

## Next Steps

1. Implement CollapsibleSection for thinking
2. Add WorkItemCard for file edits
3. Create CommandOutput for shell commands
4. Build SubagentCard for parallel work
5. Design ArtifactBlock for code sharing
