# URGENT: Server Fix Required - WebSocket Model Field

## Problem
The TUI IS sending the `model` field in WebSocket messages, but the server is ignoring it and using a default value.

**Server logs show:**
```
[Web Channel] Parsed message: {
  userId: 'anonymous',
  content: 'hey',
  model: 'meta/llama-3.1-8b-instruct', // <-- DEFAULTING, not from TUI
  sessionId: '...'
}
```

**TUI actually sends:**
```json
{
  "type": "message",
  "content": "hey",
  "model": "glm-4.7",  // <-- CORRECT MODEL FROM DROPDOWN
  "sessionId": "...",
  "userId": "tui-user",
  "timestamp": "..."
}
```

## Root Cause
The server is not reading the `model` field from the WebSocket message. It's defaulting to `meta/llama-3.1-8b-instruct` instead of using what the TUI sends.

## Fix Required

### 1. Update WebSocket Message Handler
In your WebSocket server code, read the `model` field from incoming messages:

```javascript
// Current (WRONG - using default):
const model = message.model || 'meta/llama-3.1-8b-instruct';

// Fixed (CORRECT - use TUI's model):
const model = message.model;  // Trust the TUI
```

### 2. Expected Message Format
The TUI sends messages in this format:
```json
{
  "type": "message",
  "content": "user message here",
  "model": "glm-4.7",  // or "kimi-k2.5", "deepseek-v3.2", etc.
  "sessionId": "uuid-here",
  "userId": "tui-user",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 3. Model Values to Expect
The TUI sends these model IDs:
- `kimi-k2.5` (Nvidia NIM)
- `kimi-k2-instruct` (Nvidia NIM)
- `deepseek-v3.2` (Nvidia NIM)
- `glm-4.7` (Z AI)
- `glm-4.5-air` (Z AI)
- `glm-5` (Z AI)
- `grok-4.1` (OpenRouter)
- `minimax-m2.5` (OpenRouter)
- `llama-3.1-8b` (OpenRouter)
- `qwen-coder-3-480b` (OpenRouter)
- `gemini-2.5-flash` (OpenRouter)
- `qwen-3.5` (OpenRouter)

## Verification Steps

1. **Add server-side logging:**
```javascript
console.log("[Server] Received message:", JSON.stringify(message, null, 2));
```

2. **Check that model field is present:**
```javascript
if (!message.model) {
  console.warn("[Server] No model field in message!");
}
```

3. **Test model switching:**
- Select "GLM 4.7" in TUI dropdown
- Send a message
- Server should receive `model: "glm-4.7"`
- Server should route to Z AI provider, not default

## Acceptance Criteria
- [ ] Server reads `model` field from WebSocket messages
- [ ] Server uses the TUI's selected model (not default)
- [ ] Model switching works end-to-end (TUI dropdown → Server → AI Provider)
- [ ] Server logs show correct model ID

## TUI Status
✅ TUI code is correct and sending model field  
✅ WebSocket connection working  
✅ Model dropdown functional  
⏳ Waiting on server fix

---

**Contact:** TUI Remi has completed all fixes on the client side. The server just needs to read the `model` field from incoming WebSocket messages.
