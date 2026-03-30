import { createSignal, For } from "solid-js";
import { AgentColors, OpencodeTheme } from "./theme";

// Simple working version without complex props
export function SimpleWorkingApp() {
  const [input, setInput] = createSignal("");
  const [messages, setMessages] = createSignal([
    { id: 1, role: "user", content: "Hello!", timestamp: "12:00 PM" },
    { id: 2, role: "assistant", content: "Hi there! This is WZRD.dev.", timestamp: "12:01 PM" },
  ]);
  
  const handleSubmit = () => {
    const text = input().trim();
    if (!text) return;
    
    setMessages([
      ...messages(),
      { id: messages().length + 1, role: "user", content: text, timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }
    ]);
    setInput("");
    
    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        { id: prev.length + 1, role: "assistant", content: `You said: "${text}"`, timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }
      ]);
    }, 500);
  };
  
  const handleKeyDown = (e: any) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };
  
  return (
    <box flexDirection="column" flexGrow={1} backgroundColor={OpencodeTheme.background}>
      {/* Top bar */}
      <box height={1} justifyContent="space-between" paddingLeft={1} paddingRight={1} backgroundColor={OpencodeTheme.backgroundPanel}>
        <text fg={OpencodeTheme.textMuted}>
          <strong>WZRD.dev</strong>
        </text>
        <text fg={OpencodeTheme.textMuted}>
          Simple Working Version
        </text>
      </box>
      
      {/* Main chat */}
      <box flexGrow={1} flexDirection="row">
        {/* Chat area */}
        <box flexGrow={3} flexDirection="column" backgroundColor={OpencodeTheme.backgroundPanel}>
          <scrollbox flexGrow={1} padding={1}>
            <For each={messages()}>
              {(msg, index) => (
                <box marginBottom={1} paddingLeft={1}>
                  <box marginBottom={0.5}>
                    <text fg={OpencodeTheme.textMuted}>
                      <strong>{msg.role === "user" ? "You" : "Assistant"}</strong> • {msg.timestamp}
                    </text>
                  </box>
                  <box marginLeft={1}>
                    <text fg={OpencodeTheme.text}>
                      {msg.content}
                    </text>
                  </box>
                </box>
              )}
            </For>
          </scrollbox>
          
          {/* Input - WORKING ENTER KEY */}
          <box padding={1} backgroundColor={OpencodeTheme.backgroundElement}>
            <textarea
              value={input()}
              onInput={(e: any) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type message and press Enter..."
              rows={2}
              flexGrow={1}
              backgroundColor={OpencodeTheme.backgroundPanel}
              fg={OpencodeTheme.text}
            />
            <box marginTop={0.5}>
              <text fg={OpencodeTheme.textMuted}>
                Press Enter to send
              </text>
            </box>
          </box>
        </box>
        
        {/* Simple sidebar */}
        <box width={25} flexDirection="column" backgroundColor={OpencodeTheme.backgroundPanel} padding={1}>
          <text fg={OpencodeTheme.primary}>
            <strong>Model</strong>
          </text>
          <text fg={OpencodeTheme.success}>
            nvidia/z-ai/glm4.7
          </text>
          
          <box marginTop={1}>
            <text fg={OpencodeTheme.primary}>
              <strong>Commands</strong>
            </text>
            <text fg={OpencodeTheme.text}>
              /help - Show help
            </text>
            <text fg={OpencodeTheme.text}>
              /clear - Clear chat
            </text>
          </box>
        </box>
      </box>
      
      {/* Bottom bar */}
      <box height={1} justifyContent="space-between" paddingLeft={1} paddingRight={1} backgroundColor={OpencodeTheme.backgroundElement}>
        <text fg={OpencodeTheme.textMuted}>
          <strong>tab</strong> agents • <strong>ctrl+p</strong> commands
        </text>
        <text fg={OpencodeTheme.text}>
          <strong>Remi</strong> • nvidia/z-ai/glm4.7
        </text>
      </box>
    </box>
  );
}