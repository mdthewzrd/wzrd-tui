# OpenTUI Input Wrapping Research

## Problem

OpenTUI's `input` and `textarea` components do NOT support text wrapping. They scroll horizontally when text exceeds the container width.

## OpenTUI Components Analysis

### Components That Support Wrapping
- `text` with `wrapMode="word"` - wraps at word boundaries
- `text` with `wrapMode="char"` - wraps at any character
- `box` with `flexWrap` - wraps child elements

### Components That DON'T Support Wrapping
- `input` - single line, scrolls horizontally
- `textarea` - multi-line but scrolls horizontally, no wrap
- `code` - syntax highlighted, scrolls horizontally

## Current Implementation

```tsx
// Current - text goes off edge
<textarea
  value={input()}
  onInput={setInput}
  ...
/>
```

## Attempted Solutions

### Solution 1: Manual Text Wrapping
Split text into lines and render multiple `text` components:
```tsx
{wrapText(input(), 60).map((line) => (
  <text fg={theme.text}>{line}</text>
))}
```
**Problem:** Cursor position doesn't match visual text

### Solution 2: Hidden Input + Visible Text
```tsx
<box>
  <text wrapMode="word">{input()}</text>
  <input style={{ opacity: 0 }} ... />
</box>
```
**Problem:** Cursor invisible, hard to edit

### Solution 3: Fixed Width Container
```tsx
<box width={60}>
  <textarea ... />
</box>
```
**Problem:** Still scrolls horizontally

## How Opencode Likely Does It

Opencode probably uses one of these approaches:

### Approach A: Custom Input Component
- Built-in text wrapping
- Tracks cursor position across wrapped lines
- Handles backspace/delete across line boundaries

### Approach B: Content Editable
- Uses a `text` component with `wrapMode="word"`
- Custom keyboard handler for insert/delete
- Manual cursor positioning

### Approach C: Pre-wrapped Lines
- Splits input into lines before rendering
- Each line is a separate `text` component
- Cursor tracks which line and position

## Recommended Solution

Build a custom wrapped input component:

```tsx
function WrappedInput(props) {
  const [lines, setLines] = createSignal(['']);
  const [cursorLine, setCursorLine] = createSignal(0);
  const [cursorCol, setCursorCol] = createSignal(0);
  
  // Wrap text into lines
  const wrapText = (text) => {
    const words = text.split(' ');
    const lines = [];
    let current = '';
    
    for (const word of words) {
      if ((current + word).length > 60) {
        lines.push(current);
        current = word + ' ';
      } else {
        current += word + ' ';
      }
    }
    lines.push(current);
    return lines;
  };
  
  // Handle keypress
  const onKeyPress = (key) => {
    if (key.name === 'return') {
      // Insert newline
    } else if (key.name === 'backspace') {
      // Delete char
    } else {
      // Insert char
    }
    // Re-wrap text
    setLines(wrapText(newText));
  };
  
  return (
    <box>
      {lines().map((line, i) => (
        <text>{line}</text>
      ))}
      {/* Cursor indicator */}
      <box position="absolute" ... />
    </box>
  );
}
```

## Implementation Plan

1. Create custom `WrappedInput` component
2. Track cursor position (line, column)
3. Handle all keyboard events (type, backspace, delete, arrows)
4. Re-wrap text on every change
5. Show cursor at correct position

## Files to Modify

- `src/components/WrappedInput.tsx` - New component
- `src/WZRDOpencodeClone.tsx` - Replace textarea with WrappedInput

## Testing

Test with:
- Long words (should break)
- Multiple spaces
- Backspace across line boundaries
- Arrow key navigation
- Paste long text
