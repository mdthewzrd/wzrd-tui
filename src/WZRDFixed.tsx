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

function WZRDFixed() {
  const [input, setInput] = createSignal("");
  const [messages, setMessages] = createSignal([
    { role: "assistant", content: "🚀 **WZRD.dev** - Enter Key FIXED" },
    { role: "assistant", content: "Visual: Exact Opencode Clone ✓" },
    { role: "user", content: "Testing message sending..." },
  ]);

  const handleSubmit = () => {
    const text = input().trim();
    if (!text) return;
    
    // Add user message
    setMessages(prev => [...prev, { role: "user", content: text }]);
    setInput("");
    
    // Simulate AI response
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: `✅ Message sent: "${text}"\nEnter key is now working!` 
      }]);
    }, 300);
  };

  return (
    <box flexDirection="row" flexGrow={1} backgroundColor={theme.background}>
      {/* Main chat area - 65% width */}
      <box flexDirection="column" flexGrow={13} width="65%" backgroundColor={theme.background} padding={1}>
        <text fg={theme.primary} marginBottom={1}><strong>WZRD.dev</strong></text>
        
        {/* Messages container */}
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

        {/* CRITICAL FIX: Use Input instead of Textarea for proper value handling */}
        <box flexDirection="row">
          <input
            value={input()}
            placeholder="Type message and press Enter (should work now)..."
            flexGrow={1}
            backgroundColor={theme.surface}
            onSubmit={handleSubmit}
            onKeyDown={(e: any) => {
              // OpenTUI uses name="return" not "enter"
              if (e.name === "return" && !e.shift) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            onInput={(value: string) => {
              setInput(value);
            }}
          />
        </box>

        {/* Status */}
        <box marginTop={1}>
          <text fg={theme.muted}>Layout: 65%/35% • Enter: Testing • Input: "{input()}"</text>
        </box>
      </box>

      {/* Right sidebar - 35% width */}
      <box flexDirection="column" flexGrow={7} width="35%" backgroundColor={theme.surface} padding={2}>
        <text fg={theme.primary} marginBottom={2}><strong>📚 Skills (68+)</strong></text>
        
        <box flexDirection="column" marginBottom={3}>
          <text fg={theme.text} marginBottom={0.5}><strong>• Transformations</strong></text>
          <text fg={theme.muted}>model-a/b/c, v31-transformation-base</text>
          
          <text fg={theme.text} marginBottom={0.5} marginTop={1}><strong>• Platform</strong></text>
          <text fg={theme.muted}>platform-integration, system-audit</text>
          
          <text fg={theme.text} marginBottom={0.5} marginTop={1}><strong>• Development</strong></text>
          <text fg={theme.muted}>coding, debugging, testing</text>
          
          <text fg={theme.text} marginBottom={0.5} marginTop={1}><strong>• Design</strong></text>
          <text fg={theme.muted}>design-mode, ui-ux-master</text>
        </box>

        <box backgroundColor={theme.element} padding={2} marginBottom={2}>
          <text fg={theme.primary} marginBottom={1}><strong>⚙️ Status</strong></text>
          <box flexDirection="column">
            <text fg="#7fd88f">✓ Exact Opencode visual clone</text>
            <text fg="#fab283">↻ Testing Enter key fix</text>
            <text fg="#7fd88f">✓ Layout: 65%/35%</text>
            <text fg="#7fd88f">✓ Colors: #0a0a0a, #141414, #fab283</text>
          </box>
        </box>

        <box backgroundColor={theme.element} padding={2}>
          <text fg={theme.primary} marginBottom={1}><strong>🔧 Fix Details</strong></text>
          <box flexDirection="column">
            <text fg={theme.text}>Using Input not Textarea</text>
            <text fg={theme.text}>value={input()} prop</text>
            <text fg={theme.text}>onInput handler for updates</text>
            <text fg={theme.text}>onSubmit for Enter key</text>
            <text fg={theme.text}>e.name === "return"</text>
          </box>
        </box>
      </box>
    </box>
  );
}

render(() => <WZRDFixed />);