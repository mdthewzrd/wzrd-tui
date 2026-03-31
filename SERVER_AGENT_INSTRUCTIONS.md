# WZRD Server Agent - Response Quality Improvements

## Current Issues

The AI responses from the server are:
1. **Too verbose** - Wasting tokens on unnecessary explanations
2. **Not professional** - Tone is too casual
3. **Poor formatting** - Excessive markdown, nested lists, code blocks for simple responses
4. **Token waste** - Responses are 3-5x longer than needed

## Examples of Bad Responses

### Example 1: Simple Question Gets Overly Complex Answer
**User:** "the cd and launch failed"

**Current Response:**
```
I'm Remi from WZRD.dev. Let's get that sorted.

To help you debug this, I need a bit more context:

**For the `cd` failure:**
- What directory path were you trying to change to?
- Are you getting "No such file or directory" or permissions errors?
- Is this a relative path (e.g., `cd ./project`) or absolute?

**For the launch failure:**
- What command were you running? (e.g., `npm start`, `python app.py`, `docker-compose up`)
- What error message appeared?

**Quick fixes to try:**

1. **Verify the path exists:**
   ```bash
   ls -la /path/to/directory
   ```

2. **Check if you're in the right parent directory** before running `cd`

3. **For launch failures** - ensure dependencies are installed:
   ```bash
   # If Node.js project
   npm install
   
   # If Python project
   pip install -r requirements.txt
   ```

4. **Check permissions:**
   ```bash
   chmod +x launch-script.sh
   ```

Share the specific error output and I can pinpoint the issue as part of the WZRD.dev agentic system.
```

**Problems:**
- Way too long for a simple question
- Excessive markdown formatting
- Multiple code blocks for simple commands
- Redundant explanations
- ~500+ tokens wasted

---

## Required Changes

### 1. Response Length Guidelines

| Query Type | Max Response Length | Target Tokens |
|------------|---------------------|---------------|
| Simple question | 1-2 sentences | 50-100 |
| Command help | Brief command + 1 sentence | 50-100 |
| Code request | Code + 1 sentence | 100-200 |
| Complex explanation | 2-3 short paragraphs | 200-300 |
| NEVER exceed | 3 paragraphs | 300 tokens |

### 2. Tone Guidelines

**Current (BAD):**
- "Let's get that sorted."
- "I need a bit more context"
- "Share the specific error output and I can pinpoint the issue"

**Required (GOOD):**
- Direct, professional
- "What's the error message?"
- "Run: `ls -la` to check permissions"
- "Need more info: [specific question]"

### 3. Formatting Rules

**FORBIDDEN:**
- Nested bullet lists (max 1 level)
- Multiple code blocks for simple commands
- Headers (##, ###) in responses
- Bold text for emphasis (use plain text)
- "Quick fixes to try:" sections
- Explanations before answers

**REQUIRED:**
- Plain text first
- Code inline when possible: `npm install`
- Only use code blocks for multi-line code
- Single space between sentences
- No trailing whitespace

### 4. Response Structure

**Good Response Example:**
```
What's the error message? Run `ls -la` to check if the directory exists.
```

**Good Code Response:**
```
Here's the fix:

```bash
npm install
npm start
```

Let me know if you see an error.
```

---

## Implementation

### Update System Prompt

Add this to the system prompt:

```
RESPONSE RULES:
1. Keep responses under 3 sentences unless specifically asked for detail
2. No nested lists, headers, or excessive markdown
3. Answer directly first, explain only if asked
4. Use inline code for single commands: `npm install`
5. Professional tone - no "Let's", "I need", "Share with me"
6. Max 300 tokens per response
```

### Update Message Handler

In the WebSocket message handler, add token counting:

```typescript
// Before sending response
const estimatedTokens = response.length / 4;
if (estimatedTokens > 300) {
  console.warn(`Response too long: ${estimatedTokens} tokens`);
  // Truncate or regenerate
}
```

### Add Response Formatter

Create a response formatter that:
1. Removes excessive markdown
2. Limits list depth to 1 level
3. Removes headers
4. Truncates to 300 tokens max

---

## Testing

Test with these queries:

1. "the cd and launch failed"
   - Should be: "What's the error? Run `ls -la` to check permissions."

2. "how do I install dependencies?"
   - Should be: "Run `npm install` for Node or `pip install -r requirements.txt` for Python."

3. "fix this code [code]"
   - Should be: Code fix + 1 sentence max

---

## Success Criteria

- [ ] Responses are under 300 tokens
- [ ] No nested markdown lists
- [ ] Professional tone
- [ ] Direct answers first
- [ ] Minimal formatting

---

## Files to Modify

1. **System prompt** - Add response rules
2. **Message handler** - Add token limiting
3. **Response formatter** - Clean up markdown

---

Please implement these changes to reduce token waste and improve response quality.
