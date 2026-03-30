import { createSignal, For } from "solid-js";
import { OpencodeTheme, AgentColors } from "./theme";

interface Message {
  id: number;
  role: "user" | "assistant" | "system";
  content: string;
  agent?: string;
  timestamp: string;
}

export function WZRDOpencodeFinal() {
  const [input, setInput] = createSignal("");
  const [messages, setMessages] = createSignal<Message[]>([
    { id: 1, role: "system", content: "WZRD.dev - Opencode exact clone", timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) },
    { id: 2, role: "user", content: "What did we do so far?", timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) },
    { id: 3, role: "assistant", content: "We're building an exact visual clone of Opencode using OpenTUI SolidJS with exact colors.", timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), agent: "Remi" },
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
          content: `You said: "${text}"\n\nTesting Opencode visual match with all corrections applied.`,
          agent: "Remi",
          timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        }
      ]);
    }, 500);
  };

  const handleKeyDown = (e: any) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const skills = ["automation", "git", "platform-integration", "transform-model-c", "auto-memory", "system-health"];
  const commands = [
    { name: "/help", desc: "Show this help" },
    { name: "/models", desc: "List available models" },
    { name: "/skills", desc: "List loaded skills" },
    { name: "/clear", desc: "Clear chat history" }
  ];

  const getAgentColor = (index: number) => {
    return AgentColors[index % AgentColors.length];
  };

  return (
    <box flexDirection="column" flexGrow={1} backgroundColor="#080808"> {/* DARK NEAR-BLACK */}
      {/* Header */}
      <box 
        height={1} 
        justifyContent="space-between" 
        paddingLeft={2} 
        paddingRight={2} 
        backgroundColor="#141414"
      >
        <text fg="#808080">
          <strong>WZRD.dev</strong> - Opencode Clone
        </text>
        <text fg="#808080">
          Session: wzrd-session
        </text>
      </box>
      
      {/* Main area with CORRECT PROPORTIONS */}
      <box flexGrow={1} flexDirection="row" padding={1}>
        {/* Chat area - 65% */}
        <box flexGrow={65} flexDirection="column" backgroundColor="#0c0c0c" padding={2}>
          {/* Messages with MORE PADDING */}
          <scrollbox flexGrow={1}>
            <For each={messages()}>
              {(msg, index) => (
                <box 
                  marginBottom={2} 
                  padding={2}
                  backgroundColor="#1a1a1a"  // CONTRASTING DARK GREY
                  border
                  borderStyle="single"
                  borderColor="#333333"
                >
                  {/* Opencode-style message header */}
                  <box marginBottom={1}>
                    <text fg={getAgentColor(index())}>
                      <strong>{msg.role === "user" ? "You" : msg.agent || "Assistant"}</strong>
                    </text>
                    <text fg="#808080">
                      {" "}• {msg.timestamp}
                    </text>
                  </box>
                  
                  {/* Message content with proper spacing */}
                  <box marginTop={1} marginLeft={1}>
                    <text fg="#eeeeee">
                      {msg.content}
                    </text>
                  </box>
                </box>
              )}
            </For>
          </scrollbox>
          
          {/* Input area - WORKING ENTER/SHIFT+ENTER */}
          <box marginTop={2} padding={2} backgroundColor="#1e1e1e">
            <textarea
              value={input()}
              onInput={(e: any) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask WZRD anything..."
              rows={3}
              flexGrow={1}
              backgroundColor="#141414"
              fg="#eeeeee"
            />
            {/* Hint BELOW input (no overlap) */}
            <box marginTop={1} justifyContent="space-between">
              <text fg="#808080">
                Enter to send • Shift+Enter for new line
              </text>
              <text fg="#808080">
                {input().length > 0 ? `${input().length} chars` : "Ready"}
              </text>
            </box>
          </box>
        </box>
        
        {/* Sidebar - 35% (WIDER) */}
        <box 
          flexGrow={35}
          flexDirection="column" 
          backgroundColor="#141414" 
          padding={2}
          marginLeft={1}
          border
          borderStyle="single"
          borderColor="#333333"
        >
          {/* Session */}
          <box marginBottom={2}>
            <text fg="#fab283">
              <strong>Session</strong>
            </text>
            <text fg="#eeeeee" marginTop={0.5}>
              wzrd-session
            </text>
            
            <box marginTop={1}>
              <text fg="#808080">
                <strong>Context:</strong> 847 tokens
              </text>
            </box>
            <box marginTop={0.5}>
              <text fg="#808080">
                <strong>Total:</strong> 1245 tokens
              </text>
            </box>
          </box>
          
          {/* Model */}
          <box marginBottom={2}>
            <text fg="#fab283">
              <strong>Model</strong>
            </text>
            <text fg="#7fd88f" marginTop={0.5}>
              nvidia/z-ai/glm4.7
            </text>
          </box>
          
          {/* Skills */}
          <box marginBottom={2}>
            <text fg="#fab283">
              <strong>Skills ({skills.length})</strong>
            </text>
            <scrollbox height={8} marginTop={0.5}>
              <For each={skills}>
                {(skill) => (
                  <box marginBottom={0.5}>
                    <text fg="#eeeeee">• {skill}</text>
                  </box>
                )}
              </For>
            </scrollbox>
          </box>
          
          {/* Commands */}
          <box>
            <text fg="#fab283">
              <strong>Commands</strong>
            </text>
            <For each={commands}>
              {(cmd) => (
                <box marginBottom={0.5} marginTop={0.5}>
                  <text fg="#808080">{cmd.name}</text>
                  <text fg="#eeeeee">{" "}{cmd.desc}</text>
                </box>
              )}
            </For>
          </box>
        </box>
      </box>
      
      {/* Footer - SEPARATE ROWS, MORE SPACE */}
      <box 
        height={2}
        flexDirection="column"
        justifyContent="space-between"
        paddingLeft={2}
        paddingRight={2}
        paddingTop={0.5}
        backgroundColor="#1e1e1e"
        border
        borderStyle="single"
        borderColor="#333333"
      >
        {/* Row 1: Shortcuts */}
        <box justifyContent="space-between">
          <text fg="#808080">
            <strong>tab</strong> switch agents • <strong>ctrl+p</strong> commands
          </text>
          <text fg="#808080">
            <strong>esc</strong> clear • <strong>↑/↓</strong> history
          </text>
        </box>
        
        {/* Row 2: Agent & Model */}
        <box justifyContent="space-between">
          <text fg="#eeeeee">
            <strong>Remi</strong> • WZRD Agent
          </text>
          <text fg="#eeeeee">
            Model: <strong>nvidia/z-ai/glm4.7</strong>
          </text>
        </box>
      </box>
    </box>
  );
}