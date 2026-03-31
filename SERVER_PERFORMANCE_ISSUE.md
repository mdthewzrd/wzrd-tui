# WZRD Server Performance Issue - Response Time

## Problem

Response time is **17+ seconds** for simple queries like "hey remi".

**Expected:** Under 2 seconds  
**Actual:** 17.8 seconds  
**Status:** Unusable

## Evidence

```
User: "hey remi"
Response time: 17.8s
Response: "Hey there. I'm Remi from WZRD.dev. What can I help you with?"
```

## Possible Causes

### 1. Agent Runtime Initialization
- Agent spins up on every request
- Cold start delay
- Should use persistent agent or connection pooling

### 2. NVIDIA NIM API Latency
- API call taking too long
- No streaming - waits for full response
- Should stream chunks back immediately

### 3. WebSocket Message Handling
- Blocking operations
- Not using async/await properly
- Buffering entire response before sending

### 4. Skill Loading
- Loading skills on every request
- Should cache/preload skills

### 5. Token Generation
- Generating too many tokens
- No early stopping
- Should limit response length

## Required Fixes

### Fix 1: Stream Responses Immediately

**Current (BAD):**
```typescript
// Wait for full response
const response = await nimClient.chat(messages);
ws.send(JSON.stringify({ type: "complete", data: response }));
```

**Required (GOOD):**
```typescript
// Stream chunks as they arrive
const stream = await nimClient.chat(messages, { stream: true });
for await (const chunk of stream) {
  ws.send(JSON.stringify({ 
    type: "agent:chunk", 
    data: { content: chunk.content }
  }));
}
ws.send(JSON.stringify({ type: "agent:completed", data: { ... } }));
```

### Fix 2: Reduce First Byte Time

Send immediate acknowledgment:
```typescript
ws.on("message", (msg) => {
  // Send immediate response
  ws.send(JSON.stringify({ type: "agent:started" }));
  
  // Then process
  processMessage(msg);
});
```

### Fix 3: Cache/Persistent Connection

Keep agent runtime warm:
```typescript
// Initialize once, reuse
const agentRuntime = new AgentRuntime();
agentRuntime.init();

// On each request, use existing
ws.on("message", (msg) => {
  agentRuntime.process(msg); // Fast - already initialized
});
```

### Fix 4: Optimize NIM Calls

- Use streaming mode
- Set max_tokens limit
- Use faster model for simple queries
- Cache common responses

### Fix 5: Add Timing Logs

Add performance monitoring:
```typescript
const startTime = Date.now();
// ... processing
const latency = Date.now() - startTime;
console.log(`[Performance] Response time: ${latency}ms`);
```

## Target Metrics

| Metric | Current | Target |
|--------|---------|--------|
| First byte | 17s | < 500ms |
| Full response | 17s | < 3s |
| Streaming chunks | None | Every 100ms |
| Simple query | 17s | < 2s |

## Testing

Test with:
```bash
# Simple query
echo '{"type":"message","content":"hey"}' | websocat ws://100.118.174.102:5666

# Should see:
# 1. Immediate: agent:started
# 2. Within 500ms: First agent:chunk
# 3. Within 3s: agent:completed
```

## Files to Check

1. `/home/mdwzrd/wzrd-final/src/runtime/agent-runtime.ts`
2. `/home/mdwzrd/wzrd-final/src/websocket/server.ts`
3. `/home/mdwzrd/wzrd-final/src/api/nim-client.ts`
4. `/home/mdwzrd/wzrd-final/src/skills/loader.ts`

## Immediate Actions

1. Add response streaming (send chunks as they arrive)
2. Send "agent:started" event immediately on message receive
3. Add timing logs to identify bottleneck
4. Check if NIM API is the bottleneck
5. Consider caching for common queries

---

**Priority: CRITICAL**  
**Impact: TUI is unusable with 17s response times**
