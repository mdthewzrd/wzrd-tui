# Getting Started with WZRD TUI

## Installation

```bash
# Clone the repository
git clone <repo-url>
cd wzrd-tui

# Install dependencies
bun install

# Run the TUI
bun run src/index.tsx
```

## First Time Setup

1. **Configure API Keys**

   Edit `~/.wzrd/config.json`:
   ```json
   {
     "apiKeys": {
       "zai": "your-zai-api-key"
     },
     "defaultModel": "glm-4.7",
     "defaultProvider": "zai"
   }
   ```

2. **Or use environment variables:**
   ```bash
   export ZAI_API_KEY="your-key"
   export OPENROUTER_API_KEY="your-key"
   ```

## Basic Usage

### Sending Messages

Type your message and press `Enter`.

### Using Commands

Type `/` followed by a command:

```
/help          - Show all commands
/model         - Open model picker
/clear         - Clear chat
/exit          - Exit TUI
```

### Switching Modes

Press `Tab` to cycle through:
- **Remi** - General assistant
- **Plan** - Planning mode
- **Build** - Implementation mode

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Tab` | Cycle modes |
| `Ctrl+P` | Command palette |
| `↑/↓` | Navigate lists |
| `Enter` | Select |
| `Escape` | Cancel |

## Next Steps

- Read the [Commands Guide](commands.md)
- Learn about the [Memory System](memory.md)
- Check [Troubleshooting](troubleshooting.md)
