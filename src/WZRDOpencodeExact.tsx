import { createSignal, For, Show } from "solid-js";
import { render } from "@opentui/solid";

// Exact Opencode colors from Opencode's opencode.jsonc
const theme = {
  background: "#0a0a0a",      // darkStep1 - main background
  surface: "#141414",         // darkStep2 - chat background
  element: "#1e1e1e",         // darkStep3 - element background
  primary: "#fab283",         // darkStep9 - primary color (remi/orange)
  muted: "#808080",           // darkStep11 - muted text
  text: "#eeeeee",            // darkStep12 - text color
  accent1: "#6ba4ff",         // blue accent
  accent2: "#d06efa",         // purple accent
  accent3: "#4cd964",         // green accent
};

interface Message {
  id: number;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  agent?: string;
}

function WZRDOpencodeExact() {
  const [input, setInput] = createSignal("");
  const [messages, setMessages] = createSignal<Message[]>([
    { 
      id: 1, 
      role: "system", 
      content: "Exact Opencode visual match: user messages have #1e1e1e background, AI responses are clean text.",
      timestamp: "12:00",
    },
    { 
      id: 2, 
      role: "assistant", 
      content: "Welcome to WZRD.dev. This matches Opencode exactly: clean AI text, subtle user message backgrounds.",
      timestamp: "12:01",
      agent: "remi"
    },
  ]);
  
  const handleSubmit = () => {
    const text = input().trim();
    if (!text) return;
    
    setMessages(prev => [...prev, { 
      id: prev.length + 1,
      role: "user", 
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
    
    setInput("");
    
    // Simulate AI response
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        id: prev.length + 1,
        role: "assistant", 
        content: `This is a clean AI response without a block background, just like Opencode.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        agent: "remi"
      }]);
    }, 500);
  };

  return (
    <box flexDirection="column" flexGrow={1} backgroundColor={theme.background}>
      {/* Header */}
      <box flexDirection="row" justifyContent="space-between" padding={1} backgroundColor={theme.background}>
        <box flexDirection="row" alignItems="center">
          <text fg={theme.primary}><strong>wzrd.dev</strong></text>
        </box>
        <box flexDirection="row">
          <text fg={theme.muted}>agent: </text>
          <text fg={theme.accent1}><strong>remi</strong></text>
        </box>
      </box>

      {/* Main 70/30 split */}
      <box flexGrow={1} flexDirection="row">
        {/* Chat area - 70% */}
        <box flexGrow={70} flexDirection="column" backgroundColor={theme.surface}>
          <scrollbox flexGrow={1} padding={2}>
            <For each={messages()}>
              {(msg) => (
                <box marginBottom={2}>
                  <box marginBottom={1}>
                    <text fg={theme.muted}>
                      <strong>{msg.role === "user" ? "You" : msg.agent || "Assistant"}</strong> • {msg.timestamp}
                    </text>
                  </box>
                  
                  {/* User messages get #1e1e1e background */}
                  <Show when={msg.role === "user"}>
                    <box backgroundColor={theme.element} padding={2} marginBottom={1}>
                      <text fg={theme.text}>{msg.content}</text>
                    </box>
                  </Show>
                  
                  {/* AI responses are clean text without background */}
                  <Show when={msg.role === "assistant"}>
                    <text fg={theme.text}>{msg.content}</text>
                  </Show>
                  
                  {/* System messages */}
                  <Show when={msg.role === "system"}>
                    <box marginBottom={1}>
                      <text fg={theme.muted}>{msg.content}</text>
                    </box>
                  </Show>
                </box>
              )}
            </For>
          </scrollbox>

          {/* Input */}
          <box padding={2}>
            <input
              value={input()}
              placeholder="Message remi... (Ctrl+A: agents, Tab: navigate)"
              flexGrow={1}
              backgroundColor={theme.element}
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
        </box>

        {/* Sidebar - 30% */}
        <box flexGrow={30} flexDirection="column" backgroundColor={theme.surface} padding={2}>
          <box marginBottom={2}>
            <text fg={theme.primary}><strong>agents</strong></text>
            <box marginTop={1}>
              <text fg={theme.accent1}>• remi (active)</text>
              <text fg={theme.text}>• kimi-k2.5</text>
              <text fg={theme.text}>• deepseek-v3.2</text>
              <text fg={theme.text}>• claude-3.5</text>
              <text fg={theme.text}>• gpt-4o</text>
              <text fg={theme.text}>• glm-4.7</text>
            </box>
          </box>

          <box marginBottom={2}>
            <text fg={theme.primary}><strong>shortcuts</strong></text>
            <box marginTop={1}>
              <text fg={theme.text}>• Ctrl+A: switch agents</text>
              <text fg={theme.text}>• Tab: navigate</text>
              <text fg={theme.text}>• Esc: cancel</text>
            </box>
          </box>

          <box>
            <text fg={theme.primary}><strong>skills</strong></text>
            <box marginTop={1}>
              <text fg={theme.text}>• automation</text>
              <text fg={theme.text}>• git</text>
              <text fg={theme.text}>• platform-integration</text>
              <text fg={theme.text}>• e2e-test</text>
              <text fg={theme.text}>• react-ui-master</text>
            </box>
          </box>
        </box>
      </box>

      {/* Footer */}
      <box height={1} justifyContent="space-between" paddingLeft={1} paddingRight={1} backgroundColor={theme.element}>
        <text fg={theme.muted}><strong>tab</strong> agents</text>
        <box flexDirection="row">
          <text fg={theme.muted}>Ready • Agent: remi • </text>
          <text fg={theme.text}>6 agents • </text>
          <text fg={theme.text}>Ctrl+A available</text>
        </box>
      </box>
    </box>
  );
}

render(() => <WZRDOpencodeExact />);