import { createSignal } from "solid-js";
import { render } from "@opentui/solid";

const theme = {
  background: "#0a0a0a",
  surface: "#141414",
  element: "#1e1e1e", 
  primary: "#fab283",
  muted: "#808080",
  text: "#eeeeee",
};

function WZRDWorking() {
  const [input, setInput] = createSignal("");
  const [messages, setMessages] = createSignal([
    { role: "assistant", content: "🚀 **WZRD.dev** - Enter key FIXED" },
    { role: "assistant", content: "Type message → Press Enter → Should work!" },
    { role: "user", content: "Testing the interface" },
  ]);

  const handleSubmit = () => {
    const text = input().trim();
    console.log("Submit called with:", text);
    if (!text) return;
    
    setMessages(prev => [...prev, { role: "user", content: text }]);
    setInput("");
    
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: `✅ Message sent: "${text}"\nEnter key is working!` 
      }]);
    }, 300);
  };

  return (
    <box flexDirection="row" flexGrow={1} backgroundColor={theme.background}>
      {/* Main area */}
      <box flexDirection="column" flexGrow={3} backgroundColor={theme.background} padding={1}>
        <text fg={theme.primary} marginBottom={1}><strong>WZRD.dev</strong></text>
        
        {/* Messages */}
        <box flexDirection="column" flexGrow={1} backgroundColor={theme.surface} padding={2} marginBottom={1}>
          {messages().map((msg, idx) => (
            <box flexDirection="row" marginBottom={1}>
              <text fg={msg.role === "assistant" ? theme.primary : theme.text} marginRight={1}>
                <strong>{msg.role === "assistant" ? "🤖 WZRD:" : "👤 You:"}</strong>
              </text>
              <text fg={theme.text}>{msg.content}</text>
            </box>
          ))}
        </box>

        {/* INPUT WITH VALUE PROP - THIS IS CRITICAL */}
        <box flexDirection="row">
          <textarea
            value={input()}
            placeholder="Type message and press Enter..."
            flexGrow={1}
            backgroundColor={theme.surface}
            onSubmit={handleSubmit}
            onKeyDown={(e: any) => {
              console.log("KeyDown:", e.name, "shift:", e.shift);
              if (e.name === "return" && !e.shift) {
                console.log("RETURN detected - submitting");
                e.preventDefault();
                handleSubmit();
              }
            }}
            onChange={(value: string) => {
              console.log("onChange:", value);
              setInput(value);
            }}
          />
        </box>

        <box marginTop={1}>
          <text fg={theme.muted}>Current input: "{input()}"</text>
        </box>
      </box>

      {/* Sidebar */}
      <box flexDirection="column" flexGrow={1} backgroundColor={theme.surface} padding={2}>
        <text fg={theme.primary} marginBottom={1}><strong>Debug</strong></text>
        <text fg={theme.text}>Enter key: name="return"</text>
        <text fg={theme.text}>Textarea has: value, onChange</text>
        <text fg={theme.text}>onSubmit handler: ✓</text>
        <text fg={theme.text}>Visual match: ✅ Beautiful</text>
      </box>
    </box>
  );
}

render(() => <WZRDWorking />);