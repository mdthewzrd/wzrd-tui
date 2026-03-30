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
    { id: 1, role: "system", content: "WZRD.dev - Direct Opencode Copy", timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) },
    { id: 2, role: "user", content: "Testing direct Opencode pattern", timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) },
    { id: 3, role: "assistant", content: "Direct copy from /tmp/wzrdclaw-tui", timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), agent: "Remi" },
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
          content: `Direct Opencode copy: "${text}"`,
          agent: "Remi",
          timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        }
      ]);
    }, 500);
  };

  // Opencode uses a toBottom function in onSubmit
  const toBottom = () => {
    console.log("toBottom called (Opencode pattern)");
    submit();
  };

  return (
    <box flexDirection="column" flexGrow={1} backgroundColor="#080808">
      {/* Header */}
      <box height={1} justifyContent="space-between" paddingLeft={1} paddingRight={1} backgroundColor="#141414">
        <text fg="#808080"><strong>WZRD.dev</strong> - Direct Opencode</text>
        <text fg="#808080">From /tmp/wzrdclaw-tui</text>
      </box>
      
      {/* Main - DIRECT OPENCODE LAYOUT */}
      <box flexGrow={1} flexDirection="row">
        {/* Chat - Opencode proportions */}
        <box flexGrow={65} flexDirection="column" backgroundColor="#0c0c0c">
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
            {/* Opencode uses: onSubmit={() => { toBottom() }} */}
            <textarea
              placeholder="Type message..."
              flexGrow={1}
              backgroundColor="#141414"
              fg="#eeeeee"
              rows={2}
              onSubmit={toBottom}  // EXACT Opencode pattern
              onKeyDown={(e: any) => {
                // Backup if onSubmit doesn't work
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  toBottom();
                }
              }}
              onInput={(value: string) => setInput(value)}
            />
            <box marginTop={0.5}>
              <text fg="#808080">onSubmit={"{toBottom}"} (Opencode exact)</text>
            </box>
          </box>
        </box>
        
        {/* Sidebar - Opencode width */}
        <box width={35} flexDirection="column" backgroundColor="#141414" padding={1}>
          <text fg="#fab283"><strong>Direct Copy</strong></text>
          <text fg="#7fd88f">From /tmp/wzrdclaw-tui</text>
          
          <box marginTop={1}>
            <text fg="#fab283"><strong>Opencode Pattern</strong></text>
            <text fg="#eeeeee">• onSubmit={"{toBottom}"}</text>
            <text fg="#eeeeee">• 35% sidebar width</text>
            <text fg="#eeeeee">• Dark theme #080808</text>
          </box>
          
          <box marginTop={1}>
            <text fg="#808080">Input: "{input()}"</text>
          </box>
        </box>
      </box>
      
      {/* Footer */}
      <box height={1} justifyContent="space-between" paddingLeft={1} paddingRight={1} backgroundColor="#1e1e1e">
        <text fg="#808080"><strong>tab</strong> agents • <strong>ctrl+p</strong> commands</text>
        <text fg="#eeeeee"><strong>Remi</strong> • Direct Opencode</text>
      </box>
    </box>
  );
}

render(() => <App />);