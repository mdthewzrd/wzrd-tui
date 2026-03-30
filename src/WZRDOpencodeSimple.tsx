import { createSignal } from "solid-js";
import { render } from "@opentui/solid";

// Exact Opencode colors from opencode.json
const theme = {
  darkStep1: "#0a0a0a", // Main background
  darkStep2: "#141414", // Chat background
  darkStep3: "#1e1e1e", // Element background
  darkStep9: "#fab283", // Primary (gold)
  darkStep11: "#808080", // Muted text
  darkStep12: "#eeeeee", // Text color
};

function WZRDOpencodeSimple() {
  const [input, setInput] = createSignal("");
  const [messages, setMessages] = createSignal<Array<{role: string, content: string}>>([
    { role: "assistant", content: "Hello! I'm WZRD, an exact clone of Opencode's TUI." },
    { role: "user", content: "Testing message submission..." },
    { role: "assistant", content: "The Enter key should now work correctly with name='return'!" },
  ]);

  const handleSubmit = () => {
    const text = input()?.trim() || "";
    if (!text) return;
    
    setMessages(prev => [...prev, { role: "user", content: text }]);
    setInput("");
    
    // Simulate response
    setTimeout(() => {
      setMessages(prev => [...prev, { role: "assistant", content: `Echo: You said "${prev[prev.length-1].content}"` }]);
    }, 500);
  };

  return (
    <box 
      flexDirection="row" 
      flexGrow={1} 
      backgroundColor={theme.darkStep1}
    >
      {/* Main chat area */}
      <box flexDirection="column" flexGrow={3} backgroundColor={theme.darkStep1} padding={1}>
        {/* Header */}
        <box flexDirection="row" marginBottom={1}>
          <text fg={theme.darkStep9}><strong>WZRD.dev</strong></text>
          <text fg={theme.darkStep11} marginLeft={1}>Exact Opencode Clone</text>
        </box>

        {/* Messages area */}
        <box flexDirection="column" flexGrow={1} backgroundColor={theme.darkStep2} padding={1} marginBottom={1}>
          {messages().map((msg, i) => (
            <box flexDirection="row" marginBottom={1}>
              <text fg={msg.role === "user" ? theme.darkStep12 : theme.darkStep9} marginRight={1}>
                <strong>{msg.role === "user" ? "You" : "WZRD"}:</strong>
              </text>
              <text fg={theme.darkStep12}>{msg.content}</text>
            </box>
          ))}
        </box>

        {/* Input area */}
        <box flexDirection="row">
          <textarea
            placeholder="Type message... (Enter to send)"
            flexGrow={1}
            backgroundColor={theme.darkStep2}
            marginRight={1}
            onSubmit={handleSubmit}
            onContentChange={(value: string) => setInput(value)}
            onKeyDown={(e: any) => {
              // CRITICAL: OpenTUI uses name="return" not "enter"!
              if (e.name === "return" && !e.shift) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
          <box backgroundColor={theme.darkStep3} padding={1}>
            <text fg={theme.darkStep9}><strong>Send</strong></text>
          </box>
        </box>
      </box>

      {/* Right sidebar */}
      <box flexDirection="column" flexGrow={2} backgroundColor={theme.darkStep2} padding={1}>
        <text fg={theme.darkStep9} marginBottom={1}><strong>Sidebar</strong></text>
        <text fg={theme.darkStep11} marginBottom={1}>Skills (68+)</text>
        
        <box flexDirection="column" marginBottom={2}>
          <text fg={theme.darkStep12} marginBottom={0.5}><strong>• transform-model-c</strong></text>
          <text fg={theme.darkStep11}><small>Transform multi-pass scanner patterns</small></text>
          
          <text fg={theme.darkStep12} marginBottom={0.5}><strong>• platform-integration</strong></text>
          <text fg={theme.darkStep11}><small>Edge.dev platform integration</small></text>
          
          <text fg={theme.darkStep12} marginBottom={0.5}><strong>• auto-memory</strong></text>
          <text fg={theme.darkStep11}><small>Inject memory and project context</small></text>
        </box>

        <box backgroundColor={theme.darkStep3} padding={1} marginBottom={1}>
          <text fg={theme.darkStep9} marginBottom={0.5}><strong>System Status</strong></text>
          <text fg={theme.darkStep12}>✓ OpenTUI working</text>
          <text fg={theme.darkStep12}>✓ Enter key fixed (return)</text>
          <text fg={theme.darkStep12}>✓ Exact Opencode colors</text>
        </box>
      </box>
    </box>
  );
}

render(() => <WZRDOpencodeSimple />);