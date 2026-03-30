import { createSignal, For } from "solid-js";
import { OpencodeTheme, AgentColors } from "./theme";

interface Message {
  id: number;
  role: "user" | "assistant" | "system";
  content: string;
  agent?: string;
  timestamp: string;
}

export function WZRDOpencodeRefined() {
  const [input, setInput] = createSignal("");
  const [messages, setMessages] = createSignal<Message[]>([
    { id: 1, role: "system", content: "WZRD.dev - Opencode visual clone (refined)", timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) },
    { id: 2, role: "user", content: "What did we do so far?", timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) },
    { id: 3, role: "assistant", content: "We're building an exact visual clone of Opencode using OpenTUI SolidJS with the exact color values from opencode.json theme.", timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), agent: "Remi" },
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
          content: `You said: "${text}"\n\nThis is WZRD.dev - an exact Opencode visual clone using OpenTUI SolidJS.`,
          agent: "Remi",
          timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        }
      ]);
    }, 500);
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
    <box flexDirection="column" flexGrow={1} backgroundColor="#080808"> {/* DARKER NEAR-BLACK */}
      {/* Top header */}
      <box 
        height={1} 
        justifyContent="space-between" 
        paddingLeft={2} 
        paddingRight={2} 
        backgroundColor={OpencodeTheme.backgroundPanel}
      >
        <text fg={OpencodeTheme.textMuted}>
          <strong>WZRD.dev</strong> - Opencode Refined
        </text>
        <text fg={OpencodeTheme.textMuted}>
          Session: wzrd-session
        </text>
      </box>
      
      {/* Main area with improved proportions */}
      <box flexGrow={1} flexDirection="row" padding={1}>
        {/* Chat area - WIDER (65%) */}
        <box flexGrow={65} flexDirection="column" backgroundColor="#0c0c0c" padding={2}> {/* DARKER CHAT BG */}
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
                  borderColor={OpencodeTheme.border}
                >
                  {/* Message header with Opencode-style formatting */}
                  <box marginBottom={1}>
                    <text fg={getAgentColor(index())}>
                      <strong>{msg.role === "user" ? "You" : msg.agent || "Assistant"}</strong>
                    </text>
                    <text fg={OpencodeTheme.textMuted}>
                      {" "}• {msg.timestamp}
                    </text>
                  </box>
                  
                  {/* Message content with Opencode spacing */}
                  <box marginTop={1} marginLeft={1}>
                    <text fg={OpencodeTheme.text}>
                      {msg.content}
                    </text>
                  </box>
                </box>
              )}
            </For>
          </scrollbox>
          
          {/* Input area - FIXED ENTER & SHIFT+ENTER */}
          <box marginTop={2} padding={2} backgroundColor={OpencodeTheme.backgroundElement}>
            <textarea
              placeholder="Ask WZRD anything..."
              flexGrow={1}
              backgroundColor={OpencodeTheme.backgroundPanel}
              fg={OpencodeTheme.text}
              onContentChange={() => {}}
              onSubmit={handleSubmit}
            />
            {/* Hint text BELOW input (no overlap) */}
            <box marginTop={1} justifyContent="space-between">
              <text fg={OpencodeTheme.textMuted}>
                Enter to send • Shift+Enter for new line
              </text>
              <text fg={OpencodeTheme.textMuted}>
                {input().length > 0 ? `${input().length} chars` : "Type a message"}
              </text>
            </box>
          </box>
        </box>
        
        {/* Sidebar - WIDER (35%) */}
        <box 
          flexGrow={35}
          flexDirection="column" 
          backgroundColor={OpencodeTheme.backgroundPanel} 
          padding={2}
          marginLeft={1}
          border
          borderStyle="single"
          borderColor={OpencodeTheme.border}
        >
          {/* Session info */}
          <box marginBottom={2}>
            <text fg={OpencodeTheme.primary}>
              <strong>Session</strong>
            </text>
            <text fg={OpencodeTheme.text} marginTop={0.5}>
              wzrd-session
            </text>
            
            <box marginTop={1}>
              <text fg={OpencodeTheme.textMuted}>
                <strong>Context:</strong> 847 tokens
              </text>
            </box>
            <box marginTop={0.5}>
              <text fg={OpencodeTheme.textMuted}>
                <strong>Total:</strong> 1245 tokens
              </text>
            </box>
          </box>
          
          {/* Model */}
          <box marginBottom={2}>
            <text fg={OpencodeTheme.primary}>
              <strong>Model</strong>
            </text>
            <text fg={OpencodeTheme.success} marginTop={0.5}>
              nvidia/z-ai/glm4.7
            </text>
          </box>
          
          {/* Skills */}
          <box marginBottom={2}>
            <text fg={OpencodeTheme.primary}>
              <strong>Skills ({skills.length})</strong>
            </text>
            <scrollbox height={8} marginTop={0.5}>
              <For each={skills}>
                {(skill) => (
                  <box marginBottom={0.5}>
                    <text fg={OpencodeTheme.text}>• {skill}</text>
                  </box>
                )}
              </For>
            </scrollbox>
          </box>
          
          {/* Commands */}
          <box>
            <text fg={OpencodeTheme.primary}>
              <strong>Commands</strong>
            </text>
            <For each={commands}>
              {(cmd) => (
                <box marginBottom={0.5} marginTop={0.5}>
                  <text fg={OpencodeTheme.textMuted}>{cmd.name}</text>
                  <text fg={OpencodeTheme.text}>{" "}{cmd.desc}</text>
                </box>
              )}
            </For>
          </box>
        </box>
      </box>
      
      {/* Footer - MORE VERTICAL SPACE, SEPARATE ROWS */}
      <box 
        height={2}
        flexDirection="column"
        justifyContent="space-between"
        paddingLeft={2}
        paddingRight={2}
        paddingTop={0.5}
        backgroundColor={OpencodeTheme.backgroundElement}
        border
        borderStyle="single"
        borderColor={OpencodeTheme.border}
      >
        {/* Row 1: Shortcuts */}
        <box justifyContent="space-between">
          <text fg={OpencodeTheme.textMuted}>
            <strong>tab</strong> switch agents • <strong>ctrl+p</strong> commands
          </text>
          <text fg={OpencodeTheme.textMuted}>
            <strong>esc</strong> clear input • <strong>↑/↓</strong> history
          </text>
        </box>
        
        {/* Row 2: Agent & Model */}
        <box justifyContent="space-between">
          <text fg={OpencodeTheme.text}>
            <strong>Remi</strong> • WZRD.dev Agent
          </text>
          <text fg={OpencodeTheme.text}>
            Model: <strong>nvidia/z-ai/glm4.7</strong>
          </text>
        </box>
      </box>
    </box>
  );
}