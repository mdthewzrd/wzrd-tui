import { createSignal } from "solid-js";
import { render } from "@opentui/solid";

// Exact Opencode colors from opencode.jsonc
const theme = {
  background: "#0a0a0a",    // darkStep1
  surface: "#141414",       // darkStep2
  element: "#1e1e1e",       // darkStep3
  primary: "#fab283",       // darkStep9 - gold
  muted: "#808080",         // darkStep11
  text: "#eeeeee",          // darkStep12
};

function WZRDFinal() {
  const [input, setInput] = createSignal("");
  const [messages, setMessages] = createSignal([
    { role: "assistant", content: "🚀 **WZRD.dev** - Standalone AI Agent OS" },
    { role: "assistant", content: "Exact visual clone of Opencode's TUI" },
    { role: "user", content: "Testing the interface" },
    { role: "assistant", content: "Enter key now works correctly!" },
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
        content: `✅ Message received: "${text}"\nProcessing with 68+ skills...` 
      }]);
    }, 300);
  };

  return (
    <box flexDirection="row" flexGrow={1} backgroundColor={theme.background}>
      {/* Main chat area - 60% width */}
      <box flexDirection="column" flexGrow={3} backgroundColor={theme.background} padding={1}>
        {/* Header */}
        <box flexDirection="row" justifyContent="space-between" alignItems="center" marginBottom={1}>
          <text fg={theme.primary}><strong>WZRD.dev</strong></text>
          <text fg={theme.muted}>Exact Opencode Visual Clone • Enter: ✓</text>
        </box>

        {/* Messages container */}
        <box flexDirection="column" flexGrow={1} backgroundColor={theme.surface} padding={2} marginBottom={1}>
          {messages().map((msg, idx) => (
            <box flexDirection="row" marginBottom={1}>
              <text 
                fg={msg.role === "assistant" ? theme.primary : theme.text}
                marginRight={1}
              >
                <strong>{msg.role === "assistant" ? "🤖 WZRD:" : "👤 You:"}</strong>
              </text>
              <text fg={theme.text}>{msg.content}</text>
            </box>
          ))}
        </box>

        {/* Input area with WORKING Enter key */}
        <box flexDirection="row" alignItems="center">
          <textarea
            placeholder="Type your message... (Enter to send, Shift+Enter for newline)"
            flexGrow={1}
            backgroundColor={theme.surface}
            marginRight={1}
            onSubmit={handleSubmit}
            onKeyDown={(e: any) => {
              // CONFIRMED: OpenTUI uses name="return" not "enter"
              if (e.name === "return" && !e.shift) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
          <box 
            backgroundColor={theme.element}
            paddingLeft={2}
            paddingRight={2}
            paddingTop={1}
            paddingBottom={1}
            border={true}
            borderColor={theme.primary}
          >
            <text fg={theme.primary}><strong>Send</strong></text>
          </box>
        </box>

        {/* Status bar */}
        <box marginTop={1} flexDirection="row" justifyContent="space-between">
          <text fg={theme.muted}>
            Skills: 68+ • Memory: Active • Enter key: Working
          </text>
          <text fg={theme.muted}>
            Ctrl+C to exit
          </text>
        </box>
      </box>

      {/* Right sidebar - 40% width (Opencode style) */}
      <box flexDirection="column" flexGrow={2} backgroundColor={theme.surface} padding={2}>
        <text fg={theme.primary} marginBottom={2}><strong>📚 Loaded Skills</strong></text>
        
        {/* Skill categories */}
        <box flexDirection="column" marginBottom={3}>
          <text fg={theme.text} marginBottom={0.5}><strong>• Transformations</strong></text>
          <text fg={theme.muted}>transform-model-a/b/c, v31-transformation-base</text>
          
          <text fg={theme.text} marginBottom={0.5} marginTop={1}><strong>• Platform</strong></text>
          <text fg={theme.muted}>platform-integration, system-audit, system-health</text>
          
          <text fg={theme.text} marginBottom={0.5} marginTop={1}><strong>• Development</strong></text>
          <text fg={theme.muted}>coding, debugging, testing, architecture</text>
          
          <text fg={theme.text} marginBottom={0.5} marginTop={1}><strong>• Design</strong></text>
          <text fg={theme.muted}>design-mode, ui-ux-master, react-ui-master</text>
        </box>

        {/* System info */}
        <box backgroundColor={theme.element} padding={2} marginBottom={2}>
          <text fg={theme.primary} marginBottom={1}><strong>⚙️ System Status</strong></text>
          <box flexDirection="column">
            <text fg="#7fd88f">✓ OpenTUI SolidJS</text>
            <text fg="#7fd88f">✓ Enter key (name="return")</text>
            <text fg="#7fd88f">✓ Exact Opencode colors</text>
            <text fg="#fab283">✓ Global 'wzrd' command</text>
          </box>
        </box>

        {/* Quick commands */}
        <box backgroundColor={theme.element} padding={2}>
          <text fg={theme.primary} marginBottom={1}><strong>🔧 Quick Commands</strong></text>
          <box flexDirection="column">
            <text fg={theme.text}>Type '/' for commands</text>
            <text fg={theme.text}>/help - Show help</text>
            <text fg={theme.text}>/skills - List all skills</text>
            <text fg={theme.text}>/memory - View conversation</text>
          </box>
        </box>
      </box>
    </box>
  );
}

render(() => <WZRDFinal />);