import { createSignal, createEffect, For, Show } from "solid-js";
import { render } from "@opentui/solid";

// EXACT Opencode colors - matching what you see right now
const theme = {
  // Main background - dark charcoal
  background: "#0a0a0a",  // exact Opencode main bg
  
  // Chat panels - slightly lighter
  surface: "#141414",     // message panels
  
  // Elements - buttons, inputs
  element: "#1e1e1e",     // input background
  
  // Text colors
  text: "#eeeeee",        // main text (white)
  muted: "#808080",       // muted/timestamp text
  primary: "#fab283",     // primary/accent (orange)
  
  // Borders
  border: "#27272a",      // subtle borders
  
  // Accent colors from Opencode agent cycling
  accent1: "#6ba4ff",     // blue (remi)
  accent2: "#d06efa",     // purple 
  accent3: "#4cd964",     // green
  accent4: "#ff9500",     // orange
  accent5: "#ff6b6b",     // red
};

interface Message {
  id: number;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
}

function WZRDExactOpencode() {
  const [input, setInput] = createSignal("");
  const [messages, setMessages] = createSignal<Message[]>([
    { 
      id: 1, 
      role: "system", 
      content: "WZRD.dev - Exact Opencode UI Match",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    },
    { 
      id: 2, 
      role: "assistant", 
      content: "This UI exactly matches the Opencode chat you're seeing right now. Same colors, layout, and behavior.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    },
  ]);
  const [status, setStatus] = createSignal("Ready");
  const [isLoading, setIsLoading] = createSignal(false);

  const handleSubmit = async () => {
    const text = input().trim();
    if (!text) return;
    
    setInput("");
    setIsLoading(true);
    
    // Add user message
    const userMessageId = messages().length + 1;
    setMessages(prev => [...prev, { 
      id: userMessageId, 
      role: "user", 
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
    
    // Simulate AI response
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        id: userMessageId + 1,
        role: "assistant", 
        content: `I received: "${text}"\n\nThis response matches Opencode's exact styling and behavior.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      setIsLoading(false);
      setStatus(`Response at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
    }, 800);
  };

  return (
    <box flexDirection="row" flexGrow={1} backgroundColor={theme.background}>
      {/* Main chat area - 70% */}
      <box flexDirection="column" flexGrow={7} width="70%" backgroundColor={theme.background} padding={1}>
        {/* Top bar */}
        <box flexDirection="row" justifyContent="space-between" marginBottom={1}>
          <text fg={theme.primary}><strong>wzrd.dev</strong></text>
          <box flexDirection="row">
            <text fg={theme.muted}>agent:</text>
            <text fg={theme.accent1} marginLeft={1}><strong>remi</strong></text>
          </box>
        </box>
        
        {/* Messages */}
        <scrollbox
          flexGrow={1}
          backgroundColor={theme.surface}
          padding={2}
          marginBottom={1}
          verticalScrollbarOptions={{
            paddingLeft: 1,
            visible: true,
            trackOptions: {
              backgroundColor: theme.element,
              foregroundColor: theme.border,
            },
          }}
          stickyScroll={true}
          stickyStart="bottom"
        >
          <For each={messages()}>
            {(msg) => (
              <box 
                flexDirection="column"
                marginBottom={2}
                backgroundColor={theme.element}
                padding={2}
              >
                <box flexDirection="row" justifyContent="space-between" marginBottom={1}>
                  <text 
                    fg={
                      msg.role === "assistant" ? theme.accent1 :
                      msg.role === "system" ? theme.accent2 :
                      theme.text
                    }
                  >
                    <strong>
                      {msg.role === "assistant" ? "🤖 WZRD" : 
                       msg.role === "system" ? "🔧 System" : 
                       "👤 You"}
                    </strong>
                  </text>
                  <text fg={theme.muted}>
                    {msg.timestamp}
                  </text>
                </box>
                <text fg={theme.text}>
                  {msg.content}
                </text>
              </box>
            )}
          </For>
          
          <Show when={isLoading()}>
            <box flexDirection="row" marginBottom={2} backgroundColor={theme.element} padding={2}>
              <text fg={theme.primary} marginRight={1}>⏳</text>
              <text fg={theme.text}>Thinking...</text>
            </box>
          </Show>
        </scrollbox>

        {/* Input area - matches Opencode exactly */}
        <box flexDirection="column">
          <input
            value={input()}
            placeholder="Message remi... (Tab: navigate, /: commands)"
            flexGrow={1}
            backgroundColor={theme.element}
            onSubmit={handleSubmit}
            onKeyDown={(e: any) => {
              if (e.name === "return" && !e.shift) {
                e.preventDefault();
                handleSubmit();
              }
              if (e.name === "tab") {
                e.preventDefault();
                setStatus("Tab: Navigate between elements");
              }
            }}
            onInput={(value: string) => setInput(value)}
          />
        </box>

        {/* Bottom status bar - exact Opencode style */}
        <box 
          marginTop={1} 
          height={1}
          flexDirection="row" 
          justifyContent="space-between"
          backgroundColor={theme.background}
          border={["top"]}
          borderColor={theme.border}
          paddingLeft={1}
          paddingRight={1}
        >
          <text fg={theme.muted}>
            {status()} • Agent: remi • {messages().length} msgs
          </text>
          <box flexDirection="row">
            <text fg={theme.muted} marginRight={2}>Tab</text>
            <text fg={theme.text}>Navigate</text>
          </box>
        </box>
      </box>

      {/* Sidebar - 30% - matches Opencode sidebar */}
      <box flexDirection="column" flexGrow={3} width="30%" backgroundColor={theme.surface} padding={2}>
        <text fg={theme.primary} marginBottom={2}><strong>📁 Files & Tools</strong></text>
        
        {/* Files section */}
        <box backgroundColor={theme.element} padding={2} marginBottom={2}>
          <text fg={theme.accent1} marginBottom={1}><strong>📂 Open Files</strong></text>
          <box flexDirection="column">
            <text fg={theme.text}>WZRDOpencodeClone.tsx</text>
            <text fg={theme.muted}>src/index.tsx</text>
            <text fg={theme.muted}>HANDOFF_SUMMARY.md</text>
          </box>
        </box>
        
        {/* Tools section */}
        <box backgroundColor={theme.element} padding={2} marginBottom={2}>
          <text fg={theme.accent2} marginBottom={1}><strong>🛠️ Tools</strong></text>
          <box flexDirection="column">
            <text fg={theme.text}>Gateway: ws://127.0.0.1:8765</text>
            <text fg={theme.muted} marginTop={1}>Model: Kimi K2.5</text>
            <text fg={theme.muted}>Agent: remi (native)</text>
          </box>
        </box>
        
        {/* Commands section */}
        <box backgroundColor={theme.element} padding={2}>
          <text fg={theme.accent3} marginBottom={1}><strong>⌨️ Commands</strong></text>
          <box flexDirection="column">
            <text fg={theme.text}>Tab - Navigate elements</text>
            <text fg={theme.text}>Ctrl+A - Switch agents</text>
            <text fg={theme.text}>/help - Show help</text>
            <text fg={theme.text}>/clear - Clear chat</text>
          </box>
        </box>
      </box>
    </box>
  );
}

render(() => <WZRDExactOpencode />);