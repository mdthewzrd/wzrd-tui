# WebSocket Model Field - Complete Specification

## The Problem
Both sides are pointing fingers. Here's the ACTUAL truth:

**TUI Status:** ✅ ALREADY SENDING MODEL FIELD  
**Server Status:** ❌ NOT READING IT

---

## What The TUI Does (CORRECT)

### 1. When User Sends Message
File: `src/WZRDOpencodeClone.tsx` Line 3123
```typescript
wsClient.sendMessage(processedText, { model: currentModel() });
```

### 2. WebSocket Client Builds Message
File: `src/websocket-client.ts` Lines 208-215
```typescript
const message: WZRDMessage = {
  type: "message",
  content: "user's message here",
  sessionId: this.sessionId,
  userId: "tui-user",
  timestamp: new Date().toISOString(),
  model: options?.model,  // <-- THIS IS HERE
};
```

### 3. Message Sent to Server
File: `src/websocket-client.ts` Line 218
```typescript
this.ws.send(JSON.stringify(message));
```

### 4. Console Log Proof
File: `src/websocket-client.ts` Line 217
```typescript
console.log("[WebSocket] Sending message:", JSON.stringify(message, null, 2));
```

**This logs EXACTLY what goes to the server.**

---

## What The Server Should Receive

```json
{
  "type": "message",
  "content": "hey",
  "model": "glm-4.7",
  "sessionId": "abc-123",
  "userId": "tui-user",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## What The Server Actually Does (WRONG)

Server logs show:
```javascript
[Web Channel] Parsed message: {
  userId: 'anonymous',           // <-- WRONG (should be 'tui-user')
  content: 'hey',
  model: 'meta/llama-3.1-8b-instruct',  // <-- DEFAULTING, not from message
  sessionId: '...'
}
```

**PROBLEMS:**
1. `userId` is wrong ('anonymous' vs 'tui-user')
2. `model` is completely ignored - using hardcoded default
3. `timestamp` missing (optional but should be there)

---

## Root Cause

The server is NOT reading the `model` field from the WebSocket message.

**Server code probably looks like this (WRONG):**
```javascript
ws.on('message', (data) => {
  const message = JSON.parse(data);
  
  // WRONG - ignoring message.model
  const model = 'meta/llama-3.1-8b-instruct'; // Hardcoded!
  
  // WRONG - not checking what was sent
  console.log(message.model); // undefined because not reading it
});
```

**Should be (CORRECT):**
```javascript
ws.on('message', (data) => {
  const message = JSON.parse(data);
  
  // CORRECT - use what TUI sent
  const model = message.model; // "glm-4.7"
  
  // CORRECT - log what was actually received
  console.log("Received model:", message.model);
});
```

---

## Fix Required (SERVER SIDE ONLY)

### Step 1: Add Debug Logging
In your WebSocket message handler, add this FIRST:
```javascript
console.log("[Server] Raw message received:", data);
console.log("[Server] Parsed message:", JSON.parse(data));
```

### Step 2: Read The Model Field
```javascript
const message = JSON.parse(data);
const model = message.model; // Don't default it!

if (!model) {
  console.warn("[Server] No model field in message!");
}
```

### Step 3: Use The Model
```javascript
// Route to correct AI provider based on model
if (model.startsWith('glm')) {
  // Use Z AI
} else if (model.startsWith('kimi') || model.startsWith('deepseek')) {
  // Use Nvidia NIM
} else {
  // Use OpenRouter
}
```

---

## Verification Steps

### TUI Side (Already Working)
1. Run TUI
2. Select "GLM 4.7" from dropdown
3. Send message
4. Check TUI console shows: `[WebSocket] Sending message: { ... model: "glm-4.7" ... }`

### Server Side (Needs Fix)
1. Add logging: `console.log("[Server] Received:", JSON.stringify(message, null, 2))`
2. Restart server
3. Send message from TUI
4. Check server logs show: `model: "glm-4.7"`
5. If it shows `model: "meta/llama-3.1-8b-instruct"` - YOU'RE STILL DEFAULTING

---

## Common Mistakes

### ❌ Mistake 1: Defaulting
```javascript
const model = message.model || 'meta/llama-3.1-8b-instruct';
// This hides the bug! Don't do this!
```

### ✅ Correct 1: Trust the TUI
```javascript
const model = message.model;
if (!model) {
  throw new Error("Missing model field");
}
```

### ❌ Mistake 2: Wrong Property Name
```javascript
const model = message.selectedModel; // WRONG
const model = message.modelId;       // WRONG
```

### ✅ Correct 2: Use Exact Field Name
```javascript
const model = message.model; // CORRECT
```

### ❌ Mistake 3: Parsing Wrong Object
```javascript
const message = JSON.parse(data);
const model = data.model; // WRONG - data is the JSON string!
```

### ✅ Correct 3: Parse Then Access
```javascript
const message = JSON.parse(data);
const model = message.model; // CORRECT
```

---

## Test Cases

### Test 1: Model Field Present
**TUI sends:** `{ model: "glm-4.7", ... }`  
**Server should:** Use "glm-4.7"  
**Server should NOT:** Default to "meta/llama-3.1-8b-instruct"

### Test 2: Model Field Missing
**TUI sends:** `{ }` (no model)  
**Server should:** Error or use fallback  
**Server should NOT:** Silently default

### Test 3: Model Field Null
**TUI sends:** `{ model: null, ... }`  
**Server should:** Error or use fallback  
**Server should NOT:** Use "meta/llama-3.1-8b-instruct"

---

## Summary

| Component | Status | Action Needed |
|-----------|--------|---------------|
| TUI | ✅ Working | None - already sends model |
| WebSocket Client | ✅ Working | None - already includes model |
| Server | ❌ Broken | Read `message.model` field |

**The TUI is done. The server needs to read the field.**

---

## Quick Server Fix Template

```javascript
// In your WebSocket server message handler
ws.on('message', (rawData) => {
  try {
    const data = JSON.parse(rawData);
    
    // DEBUG: Log everything received
    console.log("[Server] Received:", JSON.stringify(data, null, 2));
    
    // EXTRACT: Get the model field
    const model = data.model;
    
    // VALIDATE: Ensure model is present
    if (!model) {
      console.error("[Server] ERROR: No model field in message!");
      return;
    }
    
    // USE: Route to correct provider
    console.log("[Server] Using model:", model);
    
    // Your AI provider routing logic here...
    
  } catch (error) {
    console.error("[Server] Failed to parse message:", error);
  }
});
```

---

## End of Document

**TUI:** Done, working, sends model  
**Server:** Not working, ignores model field  
**Fix:** Server reads `message.model`
