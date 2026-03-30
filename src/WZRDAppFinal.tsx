import { createSignal, createEffect, For } from "solid-js";
import { AgentColors, OpencodeTheme } from "./theme";

// Types
interface Message {
  id: number;
  role: "user" | "assistant" | "system";
  content: string;
  agent?: string;
  timestamp: Date;
}

interface SessionInfo {
  name: string;
  contextTokens: number;
  totalTokens: number;
  modifiedFiles: string[];
  todos: string[];
}

interface Skill {
  name: string;
  description: string;
}

const COMMANDS = [
  { name: "/help", description: "Show this help" },
  { name: "/models", description: "List available models" },
  { name: "/skills", description: "List loaded skills" },
  { name: "/memory", description: "Show memory usage" },
  { name: "/clear", description: "Clear chat history" },
  { name: "/exit", description: "Exit WZRD" },
];

const SKILLS: Skill[] = [
  { name: "automation", description: "Task automation and workflows" },
  { name: "git", description: "Version control and Git workflows" },
  { name: "platform-integration", description: "Edge.dev platform integration" },
  { name: "transform-model-c", description: "Transform scanner patterns" },
  { name: "auto-memory", description: "Automatically inject memory" },
  { name: "system-health", description: "Health monitoring and metrics" },
];

export function WZRDAppFinal() {
  // State
  const [input, setInput] = createSignal("");
  const [messages, setMessages] = createSignal<Message[]>([
    { id: 1, role: "system", content: "WZRD.dev started - Opencode visual clone", timestamp: new Date() },
    { id: 2, role: "user", content: "What did we do so far?", timestamp: new Date() },
    { id: 3, role: "assistant", content: "We're building an exact visual clone of Opencode using OpenTUI SolidJS with the exact color values from opencode.json theme.", timestamp: new Date(), agent: "Remi" },
  ]);
  const [session] = createSignal<SessionInfo>({
    name: "wzrd-session",
    contextTokens: 847,
    totalTokens: 1245,
    modifiedFiles: ["theme.tsx", "WZRDApp.tsx", "index.tsx"],
    todos: ["Create sidebar", "Implement chat scrolling", "Add command processing"],
  });
  const [currentModel] = createSignal("nvidia/z-ai/glm4.7");
  const [showSidebar] = createSignal(true);
  
  // Handle input submission
  const handleSubmit = () => {
    const text = input().trim();
    if (!text) return;
    
    const userMsg: Message = {
      id: messages().length + 1,
      role: "user",
      content: text,
      timestamp: new Date(),
    };
    
    setMessages([...messages(), userMsg]);
    setInput("");
    
    // Simulate assistant response
    setTimeout(() => {
      const assistantMsg: Message = {
        id: messages().length + 2,
        role: "assistant",
        content: `You said: "${text}"\n\nThis is WZRD.dev - an exact Opencode visual clone using OpenTUI SolidJS.`,
        agent: "Remi",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMsg]);
    }, 500);
  };
  
  // Handle keydown event
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };
  
  // Get agent color for message left border
  const getAgentColor = (index: number) => {
    return AgentColors[index % AgentColors.length];
  };
  
  return (
    <box flexDirection="column" flexGrow={1} backgroundColor={OpencodeTheme.background}>
      {/* Header - EXACT OPENCODE STYLE */}
      <box 
        height={1} 
        border
        borderStyle="single"
        borderColor={OpencodeTheme.border}
        backgroundColor={OpencodeTheme.backgroundPanel}
        justifyContent="space-between"
        paddingLeft={1}
        paddingRight={1}
      >
        <text fg={OpencodeTheme.textMuted}>
          <strong>WZRD.dev</strong> - Exact Opencode Clone
        </text>
        <text fg={OpencodeTheme.textMuted}>
          Session: {session().name}
        </text>
      </box>
      
      {/* Main content area */}
      <box flexGrow={1} flexDirection="row">
        {/* Chat area (left ~70%) */}
        <box 
          flexGrow={70} 
          flexDirection="column"
          backgroundColor={OpencodeTheme.backgroundPanel}
        >
          {/* Messages scroll area */}
          <scrollbox flexGrow={1} padding={1}>
            <For each={messages()}>
              {(msg, index) => (
                <box 
                  marginBottom={1}
                  paddingLeft={1}
                  backgroundColor={OpencodeTheme.backgroundPanel}
                >
                  {/* Message header with colored agent name */}
                  <box marginBottom={0.5}>
                    <text fg={getAgentColor(index())}>
                      <strong>{msg.role === "user" ? "You" : msg.agent || "Assistant"}</strong>
                    </text>
                    <text fg={OpencodeTheme.textMuted}>
                      {" "}• {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </text>
                  </box>
                  
                  {/* Message content */}
                  <box marginLeft={1} marginTop={0.5}>
                    <text fg={OpencodeTheme.text}>
                      {msg.content}
                    </text>
                  </box>
                </box>
              )}
            </For>
          </scrollbox>
          
          {/* Input area */}
          <box 
            borderTop
            borderStyle="single"
            borderColor={OpencodeTheme.border}
            padding={1}
            backgroundColor={OpencodeTheme.backgroundElement}
          >
            <textarea
              value={input()}
              onInput={(value: string) => setInput(value)}
              onSubmit={handleSubmit}
              placeholder="Ask WZRD anything... (Enter to send)"
              backgroundColor={OpencodeTheme.backgroundPanel}
              fg={OpencodeTheme.text}
              border={false}
            />
            <box marginTop={0.5} justifyContent="flex-end">
              <text fg={OpencodeTheme.textMuted}>Press Enter to send, Shift+Enter for new line</text>
            </box>
          </box>
        </box>
        
        {/* Sidebar (right ~30%) */}
        {showSidebar() && (
          <box 
            flexGrow={30}
            flexDirection="column"
            backgroundColor={OpencodeTheme.backgroundPanel}
            padding={1}
            borderLeft
            borderStyle="single"
            borderColor={OpencodeTheme.border}
          >
            {/* Session info */}
            <box marginBottom={1}>
              <text fg={OpencodeTheme.primary}>
                <strong>Session</strong>
              </text>
              <text fg={OpencodeTheme.text}>
                {session().name}
              </text>
              
              <box marginTop={0.5}>
                <text fg={OpencodeTheme.textMuted}>
                  <strong>Context:</strong> {session().contextTokens} tokens
                </text>
              </box>
              <box>
                <text fg={OpencodeTheme.textMuted}>
                  <strong>Total:</strong> {session().totalTokens} tokens
                </text>
              </box>
            </box>
            
            {/* Current model */}
            <box marginBottom={1}>
              <text fg={OpencodeTheme.primary}>
                <strong>Model</strong>
              </text>
              <text fg={OpencodeTheme.success}>
                {currentModel()}
              </text>
            </box>
            
            {/* Skills */}
            <box marginBottom={1}>
              <text fg={OpencodeTheme.primary}>
                <strong>Skills</strong>
              </text>
              <scrollbox height={8}>
                <For each={SKILLS}>
                  {(skill) => (
                    <box marginBottom={0.25}>
                      <text fg={OpencodeTheme.text}>
                        • {skill.name}
                      </text>
                    </box>
                  )}
                </For>
              </scrollbox>
            </box>
            
            {/* Commands */}
            <box marginBottom={1}>
              <text fg={OpencodeTheme.primary}>
                <strong>Commands</strong>
              </text>
              <For each={COMMANDS}>
                {(cmd) => (
                  <box marginBottom={0.25}>
                    <text fg={OpencodeTheme.textMuted}>
                      {cmd.name}
                    </text>
                    <text fg={OpencodeTheme.text}>
                      {" "}{cmd.description}
                    </text>
                  </box>
                )}
              </For>
            </box>
            
            {/* Modified files */}
            <box>
              <text fg={OpencodeTheme.primary}>
                <strong>Modified</strong>
              </text>
              <For each={session().modifiedFiles}>
                {(file) => (
                  <box marginBottom={0.25}>
                    <text fg={OpencodeTheme.textMuted}>
                      • {file}
                    </text>
                  </box>
                )}
              </For>
            </box>
          </box>
        )}
      </box>
      
      {/* Bottom bar */}
      <box 
        height={1}
        borderTop
        borderStyle="single"
        borderColor={OpencodeTheme.border}
        backgroundColor={OpencodeTheme.backgroundElement}
        justifyContent="space-between"
        paddingLeft={1}
        paddingRight={1}
      >
        <text fg={OpencodeTheme.textMuted}>
          <strong>tab</strong> agents • <strong>ctrl+p</strong> commands
        </text>
        <text fg={OpencodeTheme.text}>
          <strong>Remi</strong> • {currentModel()}
        </text>
      </box>
    </box>
  );
}