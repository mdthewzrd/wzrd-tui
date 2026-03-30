import { createSignal } from "solid-js";
import { render } from "@opentui/solid";

// Exact Opencode colors from /home/mdwzrd/.config/opencode/opencode.jsonc
const theme = {
  background: "#0a0a0a",    // darkStep1
  surface: "#141414",       // darkStep2  
  element: "#1e1e1e",       // darkStep3
  primary: "#fab283",       // darkStep9 - gold
  muted: "#808080",         // darkStep11
  text: "#eeeeee",          // darkStep12
};

function WZRDTui() {
  const [input, setInput] = createSignal("");
  const [messages, setMessages] = createSignal([
    { role: "assistant", content: "🚀 **WZRD.dev** - Exact Opencode Visual Clone" },
    { role: "assistant", content: "Standalone TUI with multi-provider AI support" },
    { role: "user", content: "Test message to show layout" },
    { role: "assistant", content: "Enter key should work with `name='return'`" },
  ]);

  const handleSubmit = () => {
    const text = input().trim();
    if (!text) return;
    
    // Add user message
    setMessages(prev => [...prev, { role: "user", content: text }]);
    setInput("");
    
    // Simulate AI response after delay
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: `✅ Received: "${text}"\nWZRD is processing your request...` 
      }]);
    }, 300);
  };

  // Render assistant messages with gold color, user messages with white
  const getMessageColor = (role: string) => 
    role === "assistant" ? theme.primary : theme.text;

  return (
    <box flexDirection="row" flexGrow={1} backgroundColor={theme.background}>
      {/* Main chat area - 60% width */}
      <box flexDirection="column" flexGrow={3} width="60%" backgroundColor={theme.background} padding={1}>
        {/* Header */}
        <box flexDirection="row" justifyContent="space-between" alignItems="center" marginBottom={1}>
          <text fg={theme.primary}><strong>WZRD.dev</strong></text>
          <text fg={theme.muted}>Exact Opencode Clone • OpenTUI SolidJS</text>
        </box>

        {/* Messages container */}
        <box flexDirection="column" flexGrow={1} backgroundColor={theme.surface} padding={2} marginBottom={1}>
          {messages().map((msg, idx) => (
            <box flexDirection="row" marginBottom={1}>
              <text fg={getMessageColor(msg.role)} marginRight={1}>
                <strong>{msg.role === "assistant" ? "🤖 WZRD:" : "👤 You:"}</strong>
              </text>
              <text fg={theme.text}>{msg.content}</text>
            </box>
          ))}
        </box>

        {/* Input area with working Enter key */}
        <box flexDirection="row" alignItems="center">
          <textarea
            placeholder="Type your message... (Enter to send, Shift+Enter for newline)"
            flexGrow={1}
            backgroundColor={theme.surface}
            marginRight={1}
            onSubmit={handleSubmit}
            onKeyDown={(e: any) => {
              // CRITICAL: OpenTUI uses name="return" not "enter"!
              if (e.name === "return" && !e.shift) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
          <box 
            backgroundColor={theme.element} 
            paddingX={2} 
            paddingY={1}
            border={{ all: 1 }}
            borderColor={theme.primary}
          >
            <text fg={theme.primary}><strong>Send</strong></text>
          </box>
        </box>

        {/* Status bar */}
        <box marginTop={1} flexDirection="row" justifyContent="space-between">
          <text fg={theme.muted} fontSize="small">
            {messages().length} messages • Enter key: ✓ • Colors: Exact Opencode
          </text>
          <text fg={theme.muted} fontSize="small">
            Press Ctrl+C to exit
          </text>
        </box>
      </box>

      {/* Right sidebar - 40% width (Opencode style) */}
      <box flexDirection="column" flexGrow={2} width="40%" backgroundColor={theme.surface} padding={2}>
        <text fg={theme.primary} marginBottom={2}><strong>📚 Skills (68+)</strong></text>
        
        <box flexDirection="column" marginBottom={3}>
          <box marginBottom={1}>
            <text fg={theme.text}><strong>• transform-model-c</strong></text>
            <text fg={theme.muted} fontSize="small">Transform multi-pass scanner patterns</text>
          </box>
          <box marginBottom={1}>
            <text fg={theme.text}><strong>• platform-integration</strong></text>
            <text fg={theme.muted} fontSize="small">Edge.dev platform integration</text>
          </box>
          <box marginBottom={1}>
            <text fg={theme.text}><strong>• auto-memory</strong></text>
            <text fg={theme.muted} fontSize="small">Inject memory and project context</text>
          </box>
          <box marginBottom={1}>
            <text fg={theme.text}><strong>• design-mode</strong></text>
            <text fg={theme.muted} fontSize="small">Greenfield/brownfield workflows</text>
          </box>
        </box>

        <box backgroundColor={theme.element} padding={2} marginBottom={2} borderRadius={1}>
          <text fg={theme.primary} marginBottom={1}><strong>⚙️ System Status</strong></text>
          <box flexDirection="column">
            <text fg="#7fd88f">✓ OpenTUI SolidJS</text>
            <text fg="#7fd88f">✓ Enter key (name="return")</text>
            <text fg="#7fd88f">✓ Exact Opencode colors</text>
            <text fg="#fab283">↻ Loading skills from ~/.claude/skills/</text>
          </box>
        </box>

        <box backgroundColor={theme.element} padding={2} borderRadius={1}>
          <text fg={theme.primary} marginBottom={1}><strong>🔧 Commands</strong></text>
          <box flexDirection="column">
            <text fg={theme.text} fontSize="small">• Type to chat with AI</text>
            <text fg={theme.text} fontSize="small">• /help - Show available commands</text>
            <text fg={theme.text} fontSize="small">• /skills - List loaded skills</text>
            <text fg={theme.text} fontSize="small">• /memory - View conversation memory</text>
          </box>
        </box>
      </box>
    </box>
  );
}

render(() => <WZRDTui />);