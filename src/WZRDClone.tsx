import { createSignal, createEffect, For, Show } from "solid-js";
import { render, useKeyboard, useRenderer, useTerminalDimensions } from "@opentui/solid";
import { TextAttributes, RGBA, MouseButton } from "@opentui/core";

// Minimal theme from Opencode
const theme = {
  background: "#0a0a0a",
  surface: "#141414",
  element: "#1e1e1e",
  primary: "#fab283",
  muted: "#808080",
  text: "#eeeeee",
  border: "#27272a",
};

function WZRDClone() {
  const [input, setInput] = createSignal("");
  const [messages, setMessages] = createSignal([
    { role: "assistant", content: "🚀 **WZRD Clone** - Starting from Opencode" },
    { role: "assistant", content: "Direct copy of Opencode's TUI structure" },
    { role: "user", content: "Message 1" },
    { role: "assistant", content: "Response 1" },
    { role: "user", content: "Message 2" },
    { role: "assistant", content: "Response 2" },
    { role: "user", content: "Message 3" },
    { role: "assistant", content: "Response 3" },
    { role: "user", content: "Message 4" },
    { role: "assistant", content: "Response 4" },
    { role: "user", content: "Message 5" },
    { role: "assistant", content: "Response 5" },
  ]);

  const handleSubmit = () => {
    const text = input().trim();
    if (!text) return;
    
    setMessages(prev => [...prev, { role: "user", content: text }]);
    setInput("");
    
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: `Response: "${text}"` 
      }]);
    }, 300);
  };

  // Simulate Opencode's scrollbox behavior
  const renderMessages = () => {
    return (
      <For each={messages()}>
        {(msg, idx) => (
          <box 
            flexDirection="column"
            marginBottom={1}
            backgroundColor={theme.element}
            padding={2}
          >
            <box flexDirection="row" marginBottom={1}>
              <text 
                fg={msg.role === "assistant" ? theme.primary : theme.text}
                selectable={true}
              >
                <strong>{msg.role === "assistant" ? "🤖 WZRD" : "👤 You"}</strong>
              </text>
            </box>
            <text fg={theme.text} selectable={true}>
              {msg.content}
            </text>
          </box>
        )}
      </For>
    );
  };

  return (
    <box flexDirection="row" flexGrow={1} backgroundColor={theme.background}>
      {/* Main area - Opencode's exact proportions */}
      <box flexDirection="column" flexGrow={3} backgroundColor={theme.background} padding={1}>
        <text fg={theme.primary} marginBottom={1}><strong>WZRD Clone</strong></text>
        
        {/* Message area - trying different scroll approaches */}
        <box 
          flexDirection="column" 
          flexGrow={1} 
          backgroundColor={theme.surface} 
          padding={2}
          marginBottom={1}
          height="70%"
        >
          {renderMessages()}
        </box>

        {/* Input - Opencode uses Prompt component, we use input */}
        <box flexDirection="row">
          <input
            value={input()}
            placeholder="Type message... (Exact Opencode clone)"
            flexGrow={1}
            backgroundColor={theme.surface}
            onSubmit={handleSubmit}
            onKeyDown={(e: any) => {
              if (e.name === "return" && !e.shift) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            onInput={(value: string) => setInput(value)}
          />
        </box>

        <box marginTop={1}>
          <text fg={theme.muted}>
            Approach: Direct Opencode clone • Messages: {messages().length} • Scroll: Testing
          </text>
        </box>
      </box>

      {/* Sidebar - Opencode's right panel */}
      <box flexDirection="column" flexGrow={2} backgroundColor={theme.surface} padding={2}>
        <text fg={theme.primary} marginBottom={2}><strong>🎯 Strategy</strong></text>
        
        <box backgroundColor={theme.element} padding={2} marginBottom={2}>
          <text fg={theme.primary} marginBottom={1}><strong>1. Start with Opencode</strong></text>
          <box flexDirection="column">
            <text fg={theme.text}>• Copy /tmp/wzrdclaw-tui/src/</text>
            <text fg={theme.text}>• Extract TUI components</text>
            <text fg={theme.text}>• Remove @tui/ dependencies</text>
          </box>
        </box>

        <box backgroundColor={theme.element} padding={2} marginBottom={2}>
          <text fg={theme.primary} marginBottom={1}><strong>2. Make Standalone</strong></text>
          <box flexDirection="column">
            <text fg={theme.text}>• Replace @tui/ with @opentui/</text>
            <text fg={theme.text}>• Simplify dependencies</text>
            <text fg={theme.text}>• Keep exact visuals</text>
          </box>
        </box>

        <box backgroundColor={theme.element} padding={2}>
          <text fg={theme.primary} marginBottom={1}><strong>3. Integrate Remi</strong></text>
          <box flexDirection="column">
            <text fg={theme.text}>• Add skills from ~/.claude/skills/</text>
            <text fg={theme.text}>• Multi-provider AI (NVIDIA/OpenRouter)</text>
            <text fg={theme.text}>• Memory system</text>
          </box>
        </box>
      </box>
    </box>
  );
}

render(() => <WZRDClone />);