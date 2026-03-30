import { createSignal, For, Show } from "solid-js";
import { render } from "@opentui/solid";

interface Message {
  id: number;
  role: "user" | "assistant" | "system";
  content: string;
  agent?: string;
  timestamp: string;
}

function WZRDOpencodeClean() {
  const [input, setInput] = createSignal("");
  const [messages, setMessages] = createSignal<Message[]>([
    { id: 1, role: "system", content: "WZRD.dev - Clean version", timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) },
    { id: 2, role: "user", content: "Testing clean version", timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) },
    { id: 3, role: "assistant", content: "Clean version with no orphan text errors.", timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), agent: "Remi" },
  ]);

  const handleSubmit = () => {
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
          content: `Response to: "${text}"`,
          agent: "Remi",
          timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        }
      ]);
    }, 500);
  };

  return (
    <box flexDirection="column" flexGrow={1} backgroundColor="#0a0a0a">
      {/* Header - Opencode exact */}
      <box flexDirection="row" justifyContent="space-between" paddingLeft={1} paddingRight={1} backgroundColor="#0a0a0a">
        <text fg="#fab283"><strong>wzrd.dev</strong></text>
        <box flexDirection="row">
          <text fg="#808080">agent:</text>
          <text fg="#6ba4ff" marginLeft={1}><strong>remi</strong></text>
        </box>
      </box>
        <text fg="#808080"><strong>WZRD.dev</strong></text>
        <text fg="#808080">Session: test</text>
      </box>
      
      {/* Main */}
      <box flexGrow={1} flexDirection="row">
        {/* Chat */}
        <box flexGrow={70} flexDirection="column" backgroundColor="#0c0c0c">
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
          
          {/* Input - SIMPLE */}
          <box padding={1} backgroundColor="#1e1e1e">
<input
            value={input()}
            onInput={(value: string) => setInput(value)}
            onKeyDown={(e: any) => {
              if (e.name === "return" && !e.shift) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="Type message..."
            flexGrow={1}
            backgroundColor="#141414"
          />
            <box marginTop={0.5}>
              <text fg="#808080">Enter to send</text>
            </box>
          </box>
        </box>
        
        {/* Sidebar */}
        <box width={30} flexDirection="column" backgroundColor="#141414" padding={1}>
          <text fg="#fab283"><strong>Model</strong></text>
          <text fg="#7fd88f">nvidia/z-ai/glm4.7</text>
          
          <box marginTop={1}>
            <text fg="#fab283"><strong>Skills</strong></text>
            <text fg="#eeeeee">• automation</text>
            <text fg="#eeeeee">• git</text>
            <text fg="#eeeeee">• platform-integration</text>
          </box>
        </box>
      </box>
      
      {/* Footer */}
      <box height={1} justifyContent="space-between" paddingLeft={1} paddingRight={1} backgroundColor="#1e1e1e">
        <text fg="#808080"><strong>tab</strong> agents</text>
        <text fg="#eeeeee"><strong>Remi</strong></text>
      </box>
    </box>
  );
}

render(() => <WZRDOpencodeClean />);