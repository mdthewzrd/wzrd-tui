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

export function WZRDApp() {
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
  const [currentModel] = createSignal("deepseek-v3.2");
  const [showSidebar] = createSignal(true);
  
  // Handle input submission
  const handleSubmit = () => {
    const currentInput = input();
    if (!currentInput.trim()) return;
    
    const userMsg: Message = {
      id: messages().length + 1,
      role: "user",
      content: currentInput,
      timestamp: new Date(),
    };
    
    setMessages([...messages(), userMsg]);
    
    // Simulate assistant response
    setTimeout(() => {
      const assistantMsg: Message = {
        id: messages().length + 2,
        role: "assistant",
        content: `You said: "${currentInput}"\n\nThis is WZRD.dev - an exact Opencode visual clone using OpenTUI SolidJS.`,
        agent: "Remi",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMsg]);
    }, 500);
    
    setInput("");
  };
  
  // Get agent color for message left border
  const getAgentColor = (index: number) => {
    return AgentColors[index % AgentColors.length];
  };
  
  return (
    <box 
      flexDirection="column" 
      flexGrow={1}
      backgroundColor={OpencodeTheme.background}
    >
      {/* Header */}
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
          <strong>WZRD.dev</strong> - Opencode Visual Clone
        </text>
        <text fg={OpencodeTheme.textMuted}>
          Session: {session().name}
        </text>
      </box>
      
      {/* Main content area */}
      <box flexGrow={1} flexDirection="row">
        {/* Chat area (left ~75%) */}
        <box 
          flexGrow={3} 
          flexDirection="column"
          backgroundColor={OpencodeTheme.backgroundPanel}
          borderRight={showSidebar()}
          borderStyle="single"
          borderColor={OpencodeTheme.border}
        >
          {/* Messages scroll area */}
          <scrollbox flexGrow={1} padding={1}>
            <For each={messages()}>
              {(msg, index) => (
                <box 
                  marginBottom={1}
                  borderLeft
                  borderStyle="single"
                  borderColor={getAgentColor(index())}
                  paddingLeft={1}
                  backgroundColor={OpencodeTheme.backgroundPanel}
                >
                  {/* Message header */}
                  <box marginBottom={0.5}>
                    <text fg={OpencodeTheme.textMuted}>
                      {msg.role === "user" ? "You" : msg.agent || "Assistant"} • {msg.timestamp.toLocaleTimeString()}
                    </text>
                  </box>
                  
                  {/* Message content */}
                  <box marginLeft={1}>
                    <text color={OpencodeTheme.text}>
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
              onInput={(e: any) => setInput(e.target.value)}
              onKeyDown={(e: any) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder="Ask WZRD anything... (Shift+Enter for new line)"
              rows={3}
              flexGrow={1}
              backgroundColor={OpencodeTheme.backgroundPanel}
              color={OpencodeTheme.text}
              border={false}
            />
          </box>
        </box>
        
        {/* Sidebar (right ~25%) - only if showSidebar */}
        {showSidebar() && (
          <box 
            width={Math.floor(100 * 0.25)} // 25% of width
            flexDirection="column"
            backgroundColor={OpencodeTheme.backgroundPanel}
            padding={1}
            borderLeft
            borderStyle="single"
            borderColor={OpencodeTheme.border}
          >
            {/* Session info */}
            <box marginBottom={2}>
              <text color={OpencodeTheme.primary}>
                <strong>Session</strong>
              </text>
              <text color={OpencodeTheme.text}>
                {session().name}
              </text>
              
              <box marginTop={1}>
                <text color={OpencodeTheme.textMuted}>
                  <strong>Context:</strong> {session().contextTokens} tokens
                </text>
              </box>
              <box>
                <text color={OpencodeTheme.textMuted}>
                  <strong>Total:</strong> {session().totalTokens} tokens
                </text>
              </box>
            </box>
            
            {/* Current model */}
            <box marginBottom={2}>
              <text color={OpencodeTheme.primary}>
                <strong>Model</strong>
              </text>
              <text color={OpencodeTheme.success}>
                {currentModel()}
              </text>
            </box>
            
            {/* Skills */}
            <box marginBottom={2}>
              <text color={OpencodeTheme.primary}>
                <strong>Skills ({SKILLS.length})</strong>
              </text>
              <scrollbox height={10}>
                <For each={SKILLS.slice(0, 6)}>
                  {(skill) => (
                    <box marginBottom={0.5}>
                      <text color={OpencodeTheme.text}>
                        • {skill.name}
                      </text>
                    </box>
                  )}
                </For>
              </scrollbox>
            </box>
            
            {/* Commands */}
            <box marginBottom={2}>
              <text color={OpencodeTheme.primary}>
                <strong>Commands</strong>
              </text>
              <For each={COMMANDS.slice(0, 5)}>
                {(cmd) => (
                  <box marginBottom={0.5}>
                    <text color={OpencodeTheme.textMuted}>
                      {cmd.name}
                    </text>
                    <text color={OpencodeTheme.text}>
                      {" "}{cmd.description}
                    </text>
                  </box>
                )}
              </For>
            </box>
            
            {/* Modified files */}
            <box>
              <text color={OpencodeTheme.primary}>
                <strong>Modified Files ({session().modifiedFiles.length})</strong>
              </text>
              <For each={session().modifiedFiles}>
                {(file) => (
                  <box marginBottom={0.5}>
                    <text color={OpencodeTheme.textMuted}>
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
        <text color={OpencodeTheme.textMuted}>
          <strong>tab</strong> agents • <strong>ctrl+p</strong> commands
        </text>
        <text color={OpencodeTheme.text}>
          <strong>Remi</strong> • {currentModel()}
        </text>
      </box>
    </box>
  );
}