import { createSignal } from "solid-js";
import { render } from "@opentui/solid";

// Exact Opencode colors from opencode.json
const theme = {
  darkStep1: "#0a0a0a",
  darkStep2: "#141414", 
  darkStep3: "#1e1e1e",
  darkStep9: "#fab283",
  darkStep11: "#808080",
  darkStep12: "#eeeeee",
};

function WZRDExact() {
  const [input, setInput] = createSignal("");
  const [messages, setMessages] = createSignal([
    { role: "assistant", content: "WZRD.dev - Exact Opencode Visual Clone" },
    { role: "user", content: "Testing the interface" },
    { role: "assistant", content: "Enter key should work correctly now" },
  ]);

  const handleSubmit = () => {
    const text = input().trim();
    if (!text) return;
    
    setMessages(prev => [...prev, { role: "user", content: text }]);
    setInput("");
    
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: `Response to: "${text}"` 
      }]);
    }, 500);
  };

  return (
    <box flexDirection="row" flexGrow={1} backgroundColor={theme.darkStep1}>
      {/* Main area - 75% */}
      <box flexDirection="column" flexGrow={3} backgroundColor={theme.darkStep1} padding={1}>
        <text fg={theme.darkStep9} marginBottom={1}><strong>WZRD.dev</strong></text>
        
        <box flexDirection="column" flexGrow={1} backgroundColor={theme.darkStep2} padding={1} marginBottom={1}>
          {messages().map((msg, idx) => (
            <box flexDirection="row" marginBottom={1}>
              <text fg={msg.role === "assistant" ? theme.darkStep9 : theme.darkStep12} marginRight={1}>
                <strong>{msg.role === "assistant" ? "WZRD:" : "You:"}</strong>
              </text>
              <text fg={theme.darkStep12}>{msg.content}</text>
            </box>
          ))}
        </box>

        <textarea
          placeholder="Message WZRD..."
          flexGrow={1}
          backgroundColor={theme.darkStep2}
          onSubmit={handleSubmit}
          onKeyDown={(e: any) => {
            if (e.name === "return" && !e.shift) {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />
      </box>

      {/* Sidebar - 25% */}
      <box flexDirection="column" flexGrow={1} backgroundColor={theme.darkStep2} padding={1}>
        <text fg={theme.darkStep9} marginBottom={1}><strong>Skills</strong></text>
        <box flexDirection="column">
          <text fg={theme.darkStep12}>• transform-model-c</text>
          <text fg={theme.darkStep12}>• platform-integration</text>
          <text fg={theme.darkStep12}>• auto-memory</text>
          <text fg={theme.darkStep12}>• design-mode</text>
        </box>
      </box>
    </box>
  );
}

render(() => <WZRDExact />);