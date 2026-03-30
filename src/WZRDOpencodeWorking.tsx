import { createSignal, For } from "solid-js";
import { OpencodeTheme, AgentColors } from "./theme";

interface Message {
  id: number;
  role: "user" | "assistant" | "system";
  content: string;
  agent?: string;
  timestamp: string;
}

export function WZRDOpencodeWorking() {
  const [input, setInput] = createSignal("");
  const [messages, setMessages] = createSignal<Message[]>([
    { id: 1, role: "system", content: "WZRD.dev started - Opencode visual clone", timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) },
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
    <box flexDirection="column" flexGrow={1} backgroundColor={OpencodeTheme.background}>
      {/* Top header */}
      <box 
        height={1} 
        justifyContent="space-between" 
        paddingLeft={1} 
        paddingRight={1} 
        backgroundColor={OpencodeTheme.backgroundPanel}
      >
        <text fg={OpencodeTheme.textMuted}>
          <strong>WZRD.dev</strong> - Exact Opencode Clone
        </text>
        <text fg={OpencodeTheme.textMuted}>
          Session: wzrd-session
        </text>
      </box>
      
      {/* Main area */}
      <box flexGrow={1} flexDirection="row">
        {/* Chat area */}
        <box flexGrow={70} flexDirection="column" backgroundColor={OpencodeTheme.backgroundPanel}>
          {/* Messages */}
          <scrollbox flexGrow={1} padding={1}>
            <For each={messages()}>
              {(msg, index) => (
                <box marginBottom={1} paddingLeft={1}>
                  {/* Message header with colored agent name */}
                  <box marginBottom={0.5}>
                    <text fg={getAgentColor(index())}>
                      <strong>{msg.role === "user" ? "You" : msg.agent || "Assistant"}</strong>
                    </text>
                    <text fg={OpencodeTheme.textMuted}>
                      {" "}• {msg.timestamp}
                    </text>
                  </box>
                  {/* Message content */}
                  <text fg={OpencodeTheme.text}>{msg.content}</text>
                </box>
              )}
            </For>
          </scrollbox>
          
          {/* Input area - FIXED ENTER */}
          <box padding={1} backgroundColor={OpencodeTheme.backgroundElement}>
            <textarea
              value={input()}
              onInput={(e: any) => setInput(e.target.value)}
              onKeyDown={(e: any) => {
                // Debug log
                console.log("Key pressed:", e.key);
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder="Ask WZRD anything... (Enter to send)"
              rows={2}
              flexGrow={1}
              backgroundColor={OpencodeTheme.backgroundPanel}
              fg={OpencodeTheme.text}
            />
            <box marginTop={0.5} justifyContent="flex-end">
              <text fg={OpencodeTheme.textMuted}>Press Enter to send</text>
            </box>
          </box>
        </box>
        
        {/* Sidebar */}
        <box 
          width={30} 
          flexDirection="column" 
          backgroundColor={OpencodeTheme.backgroundPanel} 
          padding={1}
        >
          {/* Session info */}
          <text fg={OpencodeTheme.primary}>
            <strong>Session</strong>
          </text>
          <text fg={OpencodeTheme.text}>wzrd-session</text>
          
          <box marginTop={1}>
            <text fg={OpencodeTheme.textMuted}>
              <strong>Context:</strong> 847 tokens
            </text>
          </box>
          <box>
            <text fg={OpencodeTheme.textMuted}>
              <strong>Total:</strong> 1245 tokens
            </text>
          </box>
          
          {/* Model */}
          <box marginTop={1}>
            <text fg={OpencodeTheme.primary}>
              <strong>Model</strong>
            </text>
            <text fg={OpencodeTheme.success}>nvidia/z-ai/glm4.7</text>
          </box>
          
          {/* Skills */}
          <box marginTop={1}>
            <text fg={OpencodeTheme.primary}>
              <strong>Skills</strong>
            </text>
            <scrollbox height={6}>
              <For each={skills}>
                {(skill) => (
                  <box marginBottom={0.25}>
                    <text fg={OpencodeTheme.text}>• {skill}</text>
                  </box>
                )}
              </For>
            </scrollbox>
          </box>
          
          {/* Commands */}
          <box marginTop={1}>
            <text fg={OpencodeTheme.primary}>
              <strong>Commands</strong>
            </text>
            <For each={commands}>
              {(cmd) => (
                <box marginBottom={0.25}>
                  <text fg={OpencodeTheme.textMuted}>{cmd.name}</text>
                  <text fg={OpencodeTheme.text}>{" "}{cmd.desc}</text>
                </box>
              )}
            </For>
          </box>
        </box>
      </box>
      
      {/* Bottom bar */}
      <box 
        height={1}
        justifyContent="space-between"
        paddingLeft={1}
        paddingRight={1}
        backgroundColor={OpencodeTheme.backgroundElement}
      >
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