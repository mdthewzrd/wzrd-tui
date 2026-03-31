# Deploy TUI to Server (100.118.174.102)

## The Problem
- TUI runs on your Mac → needs WebSocket to talk to server → server doesn't read model field → broken
- TUI runs ON server → direct API calls → no WebSocket needed → works

## Solution: Run TUI Directly on Server

### Step 1: Package TUI Code
```bash
cd /Users/michaeldurante/Downloads/wzrd-tui
# Create deployment archive
tar -czf wzrd-tui-deploy.tar.gz \
  src/ \
  package.json \
  tsconfig.json \
  bun.lockb \
  .env
```

### Step 2: Copy to Server
```bash
# From your Mac
scp wzrd-tui-deploy.tar.gz root@100.118.174.102:/opt/wzrd/
```

### Step 3: Setup on Server
```bash
# SSH to server
ssh root@100.118.174.102

# Create directory
mkdir -p /opt/wzrd/tui
cd /opt/wzrd/tui

# Extract
tar -xzf ../wzrd-tui-deploy.tar.gz

# Install dependencies
bun install

# Set environment variables
export NVIDIA_API_KEY="your-key"
export ZAI_API_KEY="your-key"
export OPENROUTER_API_KEY="your-key"

# Run TUI
bun run src/index.tsx
```

### Step 4: Configure AI Providers (No WebSocket Needed!)

Since TUI runs on server, it can DIRECTLY call APIs:

**File: `src/api/providers.ts`**
- Already configured to call Nvidia NIM, Z AI, OpenRouter
- No WebSocket wrapper needed
- Direct HTTP calls

**Current flow (broken):**
TUI → WebSocket → Server → AI API

**New flow (works):**
TUI → AI API (direct)

### Step 5: Remove WebSocket Dependency

Edit `src/WZRDOpencodeClone.tsx`:

**Remove this (lines 3103-3131):**
```typescript
// REMOVE - WebSocket garbage
if (wsClient?.isConnected()) {
  wsClient.sendMessage(...)
  return;
}
```

**Keep this (direct API calls):**
```typescript
// Use direct API calls - they work!
const response = await aiClient.chat(messagesForAPI, {
  stream: true,
  // ...
});
```

### Step 6: Run It
```bash
cd /opt/wzrd/tui
bun run src/index.tsx
```

TUI runs on server → Direct API calls → Real AI responses → No WebSocket bullshit

---

## Quick Fix: Disable WebSocket, Use Direct Calls

If you want to test on your Mac first:

**Edit `src/WZRDOpencodeClone.tsx` line 3103:**
```typescript
// DISABLE WebSocket
// if (wsClient?.isConnected()) { ... }

// FORCE direct API calls
const useWebSocket = false; // Add this flag

if (useWebSocket && wsClient?.isConnected()) {
  // WebSocket code...
}
```

**Set your API keys:**
```bash
export NVIDIA_API_KEY="nvapi-..."
export ZAI_API_KEY="zai-..."
export OPENROUTER_API_KEY="sk-or-..."
```

**Run:**
```bash
cd /Users/michaeldurante/Downloads/wzrd-tui
bun run src/index.tsx
```

---

## The Real Fix

1. **TUI runs on server** (not your Mac)
2. **Direct API calls** (no WebSocket)
3. **Model dropdown works** (direct to API)
4. **Real AI responses** (no fallback)

---

## Commands Summary

```bash
# 1. Package
cd /Users/michaeldurante/Downloads/wzrd-tui
tar -czf deploy.tar.gz src/ package.json bun.lockb

# 2. Copy to server
scp deploy.tar.gz root@100.118.174.102:/opt/wzrd/

# 3. Setup on server
ssh root@100.118.174.102
cd /opt/wzrd
mkdir -p tui && cd tui
tar -xzf ../deploy.tar.gz
bun install

# 4. Set keys and run
export NVIDIA_API_KEY="..."
bun run src/index.tsx
```

Done. TUI runs on server. Direct API calls. No WebSocket. Works.
