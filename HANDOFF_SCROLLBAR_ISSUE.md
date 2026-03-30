# CRITICAL HANDOFF: Scrollbar Positioning Issue

## Problem
The scrollbox scrollbar appears at the **bottom horizontally** instead of on the **right side vertically**.

## Current Scrollbox Configuration
Location: `src/WZRDOpencodeClone.tsx` lines 649-661

```tsx
<scrollbox
  flexDirection="column"
  flexGrow={1}
  padding={1}
  scrollY={true}
  scrollX={false}
  stickyScroll={autoScroll()}
  stickyStart="bottom"
  verticalScrollbarOptions={{ showArrows: false }}
  horizontalScrollbarOptions={{ visible: false }}
>
```

## What Was Tried
- Added `verticalScrollbarOptions` and `horizontalScrollbarOptions` props
- Tried `wrapperOptions={{ flexDirection: "row" }}` (removed due to errors)
- The scrollbar still renders at the bottom

## NVIDIA API Key
```
export NIM_API_KEY="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"
```

## Launch Command
```bash
cd /Users/michaeldurante/Downloads/wzrd-tui && ~/.bun/bin/bun run --watch src/index.tsx
```

## Files Modified Today
1. `src/WZRDOpencodeClone.tsx` - Added NIM integration (working)
2. `src/api/nim.ts` - NIM API client (working)
3. `LAUNCH.md` - Updated docs
4. `WZRD_TUI_SESSION.md` - Updated docs

## What Works
- NIM API integration is functional
- Real AI responses when API key is set
- Message persistence
- Command system
- All UI layout except scrollbar position

## What Needs Fix
The scrollbox component from `@opentui/solid` needs its scrollbar positioned on the RIGHT side vertically, not at the bottom horizontally.

## Next Steps
1. Check @opentui/solid documentation for proper scrollbar positioning
2. Try different scrollbox prop combinations
3. May need to wrap scrollbox in a container with flexDirection="row"
4. Test with actual terminal resize to verify positioning

## Reference
- @opentui/solid version: 0.1.87
- Component docs: Check node_modules/@opentui/solid types for scrollbox props
