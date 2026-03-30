import { createSignal, For } from "solid-js";

interface Message {
  id: number;
  role: "user" | "assistant" | "system";
  content: string;
  agent?: string;
  timestamp: string;
}

export function WZRDOpencodeWithButton() {
  const [input, setInput] = createSignal("");
  const [messages, setMessages] = createSignal<Message[]>([
    { id: 1, role: "system", content: "WZRD.dev - With Send Button", timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) },
    { id: 2, role: "user", content: "Testing send button", timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) },
    { id: 3, role: "assistant", content: "Manual send button added.", timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), agent: "Remi" },
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
          content: `You sent: "${text}"`,
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
        <text fg="#808080"><strong>WZRD.dev</strong> - Send Button</text>
        <text fg="#808080">Session: test</text>
      </box>
      
      {/* Main - WIDER RIGHT PANEL */}
      <box flexGrow={1} flexDirection="row">
        {/* Chat - 60% */}
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
          
          {/* Input with SEND BUTTON */}
          <box padding={1} backgroundColor="#1e1e1e">
            <box flexDirection="row" alignItems="flex-end">
              <textarea
                value={input()}
                onInput={(e: any) => setInput(e.target.value)}
                onSubmit={handleSubmit}  // Try onSubmit prop
                placeholder="Type message..."
                rows={2}
                flexGrow={1}
                backgroundColor="#141414"
                fg="#eeeeee"
              />
              {/* SEND BUTTON */}
              <box 
                width={10} 
                height={3}
                marginLeft={1}
                backgroundColor="#fab283"
                justifyContent="center"
                alignItems="center"
              >
                <text fg="#000000"><strong>SEND</strong></text>
              </box>
            </box>
            <box marginTop={0.5} justifyContent="space-between">
              <text fg="#808080">Click SEND button or press Enter</text>
              <text fg="#808080">Chars: {input().length}</text>
            </box>
          </box>
        </box>
        
        {/* Sidebar - 40% (WIDER) */}
        <box width={40} flexDirection="column" backgroundColor="#141414" padding={1}>
          <text fg="#fab283"><strong>Panel (40% width)</strong></text>
          <text fg="#7fd88f">Model: nvidia/z-ai/glm4.7</text>
          
          <box marginTop={1}>
            <text fg="#fab283"><strong>Features</strong></text>
            <text fg="#eeeeee">• Send button</text>
            <text fg="#eeeeee">• Wider sidebar</text>
            <text fg="#eeeeee">• Manual submit</text>
          </box>
          
          <box marginTop={1}>
            <text fg="#808080">Try the send button!</text>
          </box>
        </box>
      </box>
      
      {/* Footer */}
      <box height={1} justifyContent="space-between" paddingLeft={1} paddingRight={1} backgroundColor="#1e1e1e">
        <text fg="#808080"><strong>tab</strong> agents • <strong>ctrl+p</strong> commands</text>
        <text fg="#eeeeee"><strong>Remi</strong> • WZRD Agent</text>
      </box>
    </box>
  );
}