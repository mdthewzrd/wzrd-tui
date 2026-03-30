import { createSignal } from "solid-js";
import { render } from "@opentui/solid";
import { ScrollBoxRenderable } from "@opentui/core";

const theme = {
  background: "#0a0a0a",
  surface: "#141414",
  element: "#1e1e1e", 
  primary: "#fab283",
  muted: "#808080",
  text: "#eeeeee",
  border: "#27272a",
};

function WZRDScrollBox() {
  const [input, setInput] = createSignal("");
  const [messages, setMessages] = createSignal([
    { role: "assistant", content: "🚀 Testing ScrollBoxRenderable" },
    { role: "assistant", content: "Importing ScrollBoxRenderable from @opentui/core" },
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
    { role: "user", content: "Message 6" },
    { role: "assistant", content: "Response 6" },
  ]);

  const handleSubmit = () => {
    const text = input().trim();
    if (!text) return;
    
    setMessages(prev => [...prev, { role: "user", content: text }]);
    setInput("");
    
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: `Response to: "${text}" (message ${prev.length + 1})` 
      }]);
    }, 200);
  };

  return (
    <box flexDirection="row" flexGrow={1} backgroundColor={theme.background}>
      {/* Main area - 65% */}
      <box flexDirection="column" flexGrow={13} width="65%" backgroundColor={theme.background} padding={1}>
        <text fg={theme.primary} marginBottom={1}><strong>WZRD.dev</strong></text>
        
        {/* ScrollBox container - should scroll */}
        <box 
          flexDirection="column"
          flexGrow={1}
          backgroundColor={theme.surface}
          padding={2}
          marginBottom={1}

        >
          {messages().map((msg, idx) => (
            <box 
              flexDirection="column"
              marginBottom={1}
              backgroundColor={theme.element}
              padding={1}
            >
              <text 
                fg={msg.role === "assistant" ? theme.primary : theme.text}
                selectable={true}
                marginBottom={0.5}
              >
                <strong>{msg.role === "assistant" ? "🤖" : "👤"}</strong> {msg.content}
              </text>
            </box>
          ))}
        </box>

        {/* Input */}
        <box flexDirection="row">
          <input
            value={input()}
            placeholder="Type message... (check if box scrolls)"
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
            Messages: {messages().length} • Import: ScrollBoxRenderable • Box: scrollable={true}
          </text>
        </box>
      </box>

      {/* Sidebar - 35% */}
      <box flexDirection="column" flexGrow={7} width="35%" backgroundColor={theme.surface} padding={2}>
        <text fg={theme.primary} marginBottom={2}><strong>Scroll Test</strong></text>
        
        <box backgroundColor={theme.element} padding={2} marginBottom={2}>
          <text fg={theme.primary} marginBottom={1}><strong>Expected</strong></text>
          <box flexDirection="column">
            <text fg={theme.text}>• Box with scrollable={true}</text>
            <text fg={theme.text}>• 14 messages → should overflow</text>
            <text fg={theme.text}>• Mouse wheel should scroll</text>
            <text fg={theme.text}>• No scrollbar visible (OpenTUI quirk)</text>
          </box>
        </box>

        <box backgroundColor={theme.element} padding={2} marginBottom={2}>
          <text fg={theme.primary} marginBottom={1}><strong>Debug</strong></text>
          <box flexDirection="column">
            <text fg={theme.text}>Import: ✓ ScrollBoxRenderable</text>
            <text fg={theme.text}>Component: {"<box scrollable={true}>"}</text>
            <text fg={theme.text}>Alternative: {"<scrollbox>"} from Opencode</text>
            <text fg={theme.text}>If no scroll: try Shift+PgUp/PgDown</text>
          </box>
        </box>

        <box backgroundColor={theme.element} padding={2}>
          <text fg={theme.primary} marginBottom={1}><strong>If Still Broken</strong></text>
          <box flexDirection="column">
            <text fg={theme.text}>1. Check terminal supports scroll</text>
            <text fg={theme.text}>2. Try Shift+PgUp/PgDown keys</text>
            <text fg={theme.text}>3. Might need mouse integration</text>
            <text fg={theme.text}>4. OpenTUI scroll might be subtle</text>
          </box>
        </box>
      </box>
    </box>
  );
}

render(() => <WZRDScrollBox />);