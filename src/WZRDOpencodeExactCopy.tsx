import { createSignal, For } from "solid-js";
import { render } from "@opentui/solid";

interface Message {
  id: number;
  role: "user" | "assistant" | "system";
  content: string;
  agent?: string;
  timestamp: string;
}

function App() {
  const [input, setInput] = createSignal("");
  const [messages, setMessages] = createSignal<Message[]>([
    { id: 1, role: "system", content: "WZRD.dev - Exact Opencode copy", timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) },
    { id: 2, role: "user", content: "Testing exact Opencode pattern", timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) },
    { id: 3, role: "assistant", content: "Using Opencode's exact textarea pattern.", timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), agent: "Remi" },
  ]);

  const submit = () => {
    const text = input().trim();
    if (!text) return;

    setMessages([
      ...messages(),
      { 
        id: messages().length + 1, 
        role: "user", 
        content: text, 
        timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
      }
    ]);
    setInput("");

    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        { 
          id: prev.length + 1, 
          role: "assistant", 
          content: `You sent: "${text}" (via Opencode pattern)`,
          agent: "Remi",
          timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        }
      ]);
    }, 500);
  };

  return (
    <box flexDirection="column" flexGrow={1} backgroundColor="#080808">
      {/* Header */}
      <box height={1} justifyContent="space-between" paddingLeft={1} paddingRight={1} backgroundColor="#141414">
        <text fg="#808080"><strong>WZRD.dev</strong> - Opencode Exact</text>
        <text fg="#808080">Testing</text>
      </box>
      
      {/* Main */}
      <box flexGrow={1} flexDirection="row">
        {/* Chat */}
        <box flexGrow={60} flexDirection="column" backgroundColor="#0c0c0c">
          <scrollbox flexGrow={1} padding={1}>
            <For each={messages()}>
              {(msg) => (
                <box marginBottom={1}>
                  <text fg="#808080"><strong>{msg.role === "user" ? "You" : msg.agent || "Assistant"}</strong> • {msg.timestamp}</text>
                  <text fg="#eeeeee">{msg.content}</text>
                </box>
              )}
            </For>
          </scrollbox>
          
          {/* Input - EXACT OPENCODE PATTERN */}
          <box padding={1} backgroundColor="#1e1e1e">
            <textarea
              placeholder="Type message..."
              flexGrow={1}
              backgroundColor="#141414"
              fg="#eeeeee"
              rows={2}
              onSubmit={submit}
              onKeyDown={(e: any) => {
                console.log("KeyDown:", e.key);
                // Opencode uses keybindings, but we'll try simple Enter
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              onInput={(value: string) => {
                setInput(value);
              }}
            />
            <box marginTop={0.5}>
              <text fg="#808080">Using Opencode's exact pattern</text>
            </box>
          </box>
        </box>
        
        {/* Sidebar - 40% */}
        <box width={40} flexDirection="column" backgroundColor="#141414" padding={1}>
          <text fg="#fab283"><strong>Opencode Pattern</strong></text>
          <text fg="#7fd88f">onSubmit={"{submit}"}</text>
          
          <box marginTop={1}>
            <text fg="#fab283"><strong>Testing</strong></text>
            <text fg="#eeeeee">• onSubmit prop</text>
            <text fg="#eeeeee">• onKeyDown handler</text>
            <text fg="#eeeeee">• 40% width</text>
          </box>
          
          <box marginTop={1}>
            <text fg="#808080">Input: "{input()}"</text>
          </box>
        </box>
      </box>
      
      {/* Footer */}
      <box height={1} justifyContent="space-between" paddingLeft={1} paddingRight={1} backgroundColor="#1e1e1e">
        <text fg="#808080"><strong>tab</strong> agents</text>
        <text fg="#eeeeee"><strong>Remi</strong> • WZRD</text>
      </box>
    </box>
  );
}

render(() => <App />);