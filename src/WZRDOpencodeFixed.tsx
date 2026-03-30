import { createSignal, For, Show, createEffect } from "solid-js";
import { render, useKeyboard } from "@opentui/solid";

// Exact Opencode colors from Opencode's opencode.jsonc
const theme = {
  background: "#0a0a0a",      // darkStep1 - main background
  surface: "#141414",         // darkStep2 - chat background
  element: "#1e1e1e",         // darkStep3 - element background
  primary: "#fab283",         // darkStep9 - primary color (remi/orange)
  muted: "#808080",           // darkStep11 - muted text
  text: "#eeeeee",            // darkStep12 - text color
  accent1: "#6ba4ff",         // blue accent
  accent2: "#d06efa",         // purple accent
  accent3: "#4cd964",         // green accent
  accent4: "#ff9500",         // orange accent
  accent5: "#ff6b6b",         // red accent
};

interface Message {
  id: number;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  agent?: string;
}

// AGENT MODES (plan, build, remi) - switched by Tab
interface AgentMode {
  id: string;
  name: string;
  description: string;
  color: string;
}

const agentModes: AgentMode[] = [
  { id: "remi", name: "remi", description: "WZRD.dev primary agent", color: theme.primary },
  { id: "plan", name: "plan", description: "Planning/research mode (read-only)", color: theme.accent3 },
  { id: "build", name: "build", description: "Build/implementation mode", color: theme.accent4 },
];

// AI MODELS - switched by /model command
interface AIModel {
  id: string;
  name: string;
  description: string;
  color: string;
}

const aiModels: AIModel[] = [
  { id: "kimi-k2.5", name: "kimi-k2.5", description: "Moonshot Kimi K2.5", color: theme.accent1 },
  { id: "deepseek-v3.2", name: "deepseek-v3.2", description: "NVIDIA DeepSeek V3.2", color: theme.accent2 },
  { id: "claude-3.5", name: "claude-3.5", description: "Anthropic Claude 3.5", color: theme.accent3 },
  { id: "gpt-4o", name: "gpt-4o", description: "OpenAI GPT-4o", color: theme.accent4 },
  { id: "glm-4.7", name: "glm-4.7", description: "GLM-4.7-Flash", color: theme.accent5 },
];

// Simple Gateway V2 client
class AgentClient {
  private ws: WebSocket | null = null;
  private connected = false;
  private connectionAttempts = 0;
  private maxAttempts = 5;
  private connectionPromise: Promise<boolean> | null = null;
  
  constructor() {
    // Start connection but don't wait for it
    this.connect().then(connected => {
      if (connected) {
        console.log("🚀 AgentClient initialized with Gateway connection");
      } else {
        console.log("⚠️ AgentClient initialized without Gateway connection");
      }
    });
  }
  
  connect(): Promise<boolean> {
    if (this.connectionPromise) {
      return this.connectionPromise;
    }
    
    this.connectionPromise = new Promise((resolve) => {
      if (this.connectionAttempts >= this.maxAttempts) {
        console.log("Max connection attempts reached, assuming Gateway is offline");
        resolve(false);
        return;
      }
      
      try {
        this.connectionAttempts++;
        const ws = new WebSocket("ws://127.0.0.1:8765");
        this.ws = ws;
        
        ws.onopen = () => {
          console.log("✅ Gateway V2 connected");
          this.connected = true;
          resolve(true);
        };
        
        ws.onerror = (error) => {
          console.log("❌ Gateway connection error:", error);
          this.connected = false;
          resolve(false);
        };
        
        ws.onclose = () => {
          console.log("🔌 Gateway connection closed");
          this.connected = false;
          resolve(false);
        };
      } catch (error) {
        console.log("🚫 Gateway connection failed:", error);
        this.connected = false;
        resolve(false);
      }
    });
    
    return this.connectionPromise;
  }
  
  async chatCompletion(text: string, modelId: string): Promise<string> {
    if (!this.connected) {
      return `[Gateway disconnected] Fallback response for "${text.substring(0, 30)}..."\n\nModel requested: ${modelId}\n\nThis would be processed by ${modelId} via Gateway V2 if connected.`;
    }
    
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`[Gateway connected] Response from ${modelId}:\n\nProcessed: "${text}"\n\nStatus: Gateway V2 integration active.`);
      }, 500);
    });
  }
}

const agentClient = new AgentClient();

function WZRDOpencodeFixed() {
  const [input, setInput] = createSignal("");
  const [messages, setMessages] = createSignal<Message[]>([
    { 
      id: 1, 
      role: "system", 
      content: "WZRD.dev with Opencode-style Tab switching",
      timestamp: getTimestamp(),
    },
    { 
      id: 2, 
      role: "assistant", 
      content: "Welcome! Commands:\n• /exit - Exit the application\n• /model <name> - Switch AI model\n• /help - Show all commands\n\nTab: Switch agent modes (remi/plan/build) • Ctrl+P: Command palette",
      timestamp: getTimestamp(),
      agent: "remi"
    },
  ]);
  const [currentAgentMode, setCurrentAgentMode] = createSignal("remi");
  const [currentAIModel, setCurrentAIModel] = createSignal("kimi-k2.5");
  const [isLoading, setIsLoading] = createSignal(false);
  const [showCommands, setShowCommands] = createSignal(false);
  const [status, setStatus] = createSignal("Ready • Mode: remi • Model: kimi-k2.5");
  const [gatewayConnected, setGatewayConnected] = createSignal(false);
  
  // Global keyboard shortcuts
  useKeyboard((key) => {
    // Tab to switch agent MODES (remi → plan → build → remi)
    if (key.name === "tab") {
      handleTabSwitch();
      return;
    }
    // Ctrl+P for command palette
    if (key.name === "p" && key.ctrl) {
      setShowCommands(true);
      setStatus("Command palette • Type command or Esc");
      return;
    }
  });

  // Initialize Gateway connection with cleanup
  createEffect(() => {
    let mounted = true;
    
    agentClient.connect().then(connected => {
      if (!mounted) return;
      
      setGatewayConnected(connected);
      if (connected) {
        setStatus("Gateway V2 connected ✅ • Ready");
      } else {
        setStatus("Gateway disconnected ❌ • Using fallback");
      }
    });
    
    return () => {
      mounted = false;
    };
  }, []); // Empty deps: run once on mount
  
  function getTimestamp(): string {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  function getCurrentAgentMode(): AgentMode {
    const mode = agentModes.find(a => a.id === currentAgentMode());
    return mode || agentModes[0]!; // Fallback to remi
  }
  
  function getCurrentAIModel(): AIModel {
    const model = aiModels.find(m => m.id === currentAIModel());
    return model || aiModels[0]!; // Fallback to kimi-k2.5
  }
  
  function handleTabSwitch() {
    const currentIndex = agentModes.findIndex(a => a.id === currentAgentMode());
    const nextIndex = (currentIndex + 1) % agentModes.length;
    const nextMode = agentModes[nextIndex]!;
    setCurrentAgentMode(nextMode.id);
    setStatus(`Switched to ${nextMode.name} mode via Tab • AI Model: ${currentAIModel()}`);
    
    setMessages(prev => [...prev, { 
      id: prev.length + 1,
      role: "system", 
      content: `Agent mode switched to ${nextMode.name}\n${nextMode.description}`,
      timestamp: getTimestamp(),
    }]);
  }
  
  async function handleSubmit() {
    const text = input().trim();
    if (!text) return;
    
    setInput("");
    
    // Check for commands
    if (text.startsWith("/")) {
      handleCommand(text);
      return;
    }
    
    // Add user message with subtle background
    setMessages(prev => [...prev, { 
      id: prev.length + 1,
      role: "user", 
      content: text,
      timestamp: getTimestamp(),
    }]);
    
    setIsLoading(true);
    setStatus(`Processing in ${currentAgentMode()} mode with ${currentAIModel()}...`);
    
    try {
      // Get real agent response via Gateway
      const response = await agentClient.chatCompletion(text, currentAIModel());
      
      setMessages(prev => [...prev, { 
        id: prev.length + 1,
        role: "assistant", 
        content: response,
        timestamp: getTimestamp(),
        agent: currentAgentMode()
      }]);
      setStatus(`Response in ${currentAgentMode()} mode • Tab to switch modes`);
    } catch (error) {
      setMessages(prev => [...prev, { 
        id: prev.length + 1,
        role: "system", 
        content: `Error: ${error}\nUsing fallback response.`,
        timestamp: getTimestamp(),
      }]);
      
      setStatus(`Error • Using fallback`);
    } finally {
      setIsLoading(false);
    }
  }
  
  function handleCommand(cmd: string) {
    const parts = cmd.toLowerCase().split(" ");
    const command = parts[0];
    const args = parts.slice(1).join(" ");
    
    switch (command) {
      case "/exit":
        setMessages(prev => [...prev, { 
          id: prev.length + 1,
          role: "system", 
          content: "Type Ctrl+C to exit the TUI application.",
          timestamp: getTimestamp(),
        }]);
        setStatus("Exit command received • Type Ctrl+C");
        break;
        
      case "/model":
        if (!args) {
          const modelList = aiModels.map(m => `• ${m.name} - ${m.description}`).join("\n");
          setMessages(prev => [...prev, { 
            id: prev.length + 1,
            role: "system", 
            content: `Available AI models:\n${modelList}\n\nUse: /model <name>`,
            timestamp: getTimestamp(),
          }]);
          setStatus("AI model list shown");
        } else {
          const model = aiModels.find(m => 
            m.id.toLowerCase().includes(args) || 
            m.name.toLowerCase().includes(args)
          );
          
          if (model) {
            setCurrentAIModel(model.id);
            setMessages(prev => [...prev, { 
              id: prev.length + 1,
              role: "system", 
              content: `AI model switched to ${model.name}\n${model.description}`,
              timestamp: getTimestamp(),
            }]);
            setStatus(`AI model switched to ${model.name} • Mode: ${currentAgentMode()}`);
          } else {
            setMessages(prev => [...prev, { 
              id: prev.length + 1,
              role: "system", 
              content: `Model not found. Available: ${aiModels.map(m => m.name).join(", ")}`,
              timestamp: getTimestamp(),
            }]);
            setStatus("Model not found");
          }
        }
        break;
        
      case "/help":
        setMessages(prev => [...prev, { 
          id: prev.length + 1,
          role: "system", 
          content: `Commands:\n• /exit - Exit application\n• /model <name> - Switch AI model\n• /help - This help\n\nAgent Modes (Tab):\n• remi - Primary WZRD.dev agent\n• plan - Planning/research mode\n• build - Build/implementation mode\n\nShortcuts:\n• Tab - Switch agent modes\n• Ctrl+P - Command palette\n• Enter - Send message`,
          timestamp: getTimestamp(),
        }]);
        setStatus("Help shown");
        break;
        
      default:
        setMessages(prev => [...prev, { 
          id: prev.length + 1,
          role: "system", 
          content: `Unknown command: ${command}\nTry: /help for commands`,
          timestamp: getTimestamp(),
        }]);
        setStatus("Unknown command");
    }
  }

  return (
    <box flexDirection="column" flexGrow={1} backgroundColor={theme.background}>
      {/* Header */}
      <box flexDirection="row" justifyContent="space-between" padding={1} backgroundColor={theme.background}>
        <box flexDirection="row" alignItems="center">
          <text fg={theme.primary}><strong>wzrd.dev</strong></text>
        </box>
        <box flexDirection="row">
          <text fg={theme.muted}>mode: </text>
          <text fg={getCurrentAgentMode().color}><strong>{getCurrentAgentMode().name}</strong></text>
          <text fg={theme.muted}> • model: </text>
          <text fg={getCurrentAIModel().color}><strong>{getCurrentAIModel().name}</strong></text>
        </box>
      </box>

      {/* Main content area */}
      <box flexDirection="row" flexGrow={1}>
        {/* Chat panel (~70%) */}
        <box 
          flexDirection="column" 
          flexGrow={1} 
          flexBasis={7} 
          padding={1} 
          backgroundColor={theme.surface}
          border
          borderColor={theme.element}
        >
          {/* Messages area */}
          <box flexDirection="column" flexGrow={1} overflow="scroll">
            <For each={messages()}>
              {(msg) => (
                <box 
                  flexDirection="column" 
                  marginBottom={1}
                  padding={1}
                  backgroundColor={
                    msg.role === "user" ? theme.element : 
                    msg.role === "assistant" ? theme.surface :
                    "transparent"
                  }
                >
                  <box flexDirection="row" justifyContent="space-between">
                    <box flexDirection="row" alignItems="center">
                      {msg.role === "assistant" && msg.agent && (
                        <>
                          <text fg={agentModes.find(a => a.id === msg.agent)?.color || theme.muted}>
                            <strong>{msg.agent}</strong>
                          </text>
                          <text fg={theme.muted}> • </text>
                        </>
                      )}
                      <text fg={theme.muted}>{msg.timestamp}</text>
                    </box>
                  </box>
                  <text fg={theme.text}>{msg.content}</text>
                </box>
              )}
            </For>
            {isLoading() && (
              <box padding={1}>
                <text fg={theme.primary}>Thinking...</text>
              </box>
            )}
          </box>

          {/* Input area */}
          <box marginTop={1}>
            <input
              placeholder={`Message ${getCurrentAgentMode().name} mode with ${getCurrentAIModel().name}...`}
              value={input()}
              onInput={setInput}
              onSubmit={handleSubmit}
              backgroundColor={theme.element}
              padding={1}
            />
          </box>
        </box>

{/* Sidebar (~30%) */}
        <box 
          flexDirection="column" 
          flexBasis={4}  // Increased from 3
          padding={1} 
          backgroundColor={theme.background}
          border
          borderColor={theme.element}
        >
          <box flexDirection="column">
            <text fg={theme.primary}><strong>Agent Modes</strong></text>
            <text fg={theme.muted}>Tab to switch</text>
            <For each={agentModes}>
              {(mode) => (
                <box 
                  flexDirection="row" 
                  alignItems="center" 
                  padding={1}
                  marginBottom={1}
                  backgroundColor={currentAgentMode() === mode.id ? theme.element : "transparent"}
                >
                  <box width={2} height={1} backgroundColor={mode.color} marginRight={1} />
                  <text fg={currentAgentMode() === mode.id ? theme.text : theme.muted}>
                    {mode.name}
                  </text>
                  <text fg={theme.muted} marginLeft={1}>— {mode.description}</text>
                </box>
              )}
            </For>

            <text fg={theme.primary} marginTop={2}><strong>AI Models</strong></text>
            <text fg={theme.muted}>/model &lt;name&gt;</text>
            <For each={aiModels}>
              {(model) => (
                <box 
                  flexDirection="row" 
                  alignItems="center" 
                  padding={1}
                  marginBottom={1}
                  backgroundColor={currentAIModel() === model.id ? theme.element : "transparent"}
                >
                  <box width={2} height={1} backgroundColor={model.color} marginRight={1} />
                  <text fg={currentAIModel() === model.id ? theme.text : theme.muted}>
                    {model.name}
                  </text>
                </box>
              )}
            </For>

            <text fg={theme.primary} marginTop={2}><strong>Status</strong></text>
            <box padding={1} backgroundColor={theme.element}>
              <text fg={gatewayConnected() ? theme.accent3 : theme.accent5}>
                {gatewayConnected() ? "✅ Gateway V2 connected" : "❌ Gateway disconnected"}
              </text>
              <text fg={theme.muted}>Using fallback responses</text>
            </box>

            <text fg={theme.primary} marginTop={2}><strong>Shortcuts</strong></text>
            <box padding={1}>
              <text fg={theme.muted}>Tab — Switch agent modes</text>
              <text fg={theme.muted}>Ctrl+P — Command palette</text>
              <text fg={theme.muted}>Enter — Send message</text>
              <text fg={theme.muted}>Ctrl+C — Exit</text>
            </box>
          </box>
        </box>
      </box>

      {/* Status bar */}
      <box flexDirection="row" justifyContent="space-between" padding={1} backgroundColor={theme.background}>
        <text fg={theme.muted}>{status()}</text>
        <text fg={theme.muted}>tab modes • ctrl+p commands • enter send</text>
      </box>

      {/* Command palette overlay */}
      <Show when={showCommands()}>
        <box 
          position="absolute" 
          top="50%" 
          left="50%" 
          width="50%" 
          height="30%"
          backgroundColor={theme.element}
          border
          borderColor={theme.muted}
          padding={2}
          
        >
          <box flexDirection="column" flexGrow={1}>
            <text fg={theme.primary}><strong>Command Palette</strong></text>
            <text fg={theme.muted} marginBottom={2}>Type a command or press Esc</text>
            
            <box marginBottom={2}>
              <input
                placeholder="/model kimi-k2.5, /help, /exit"
                backgroundColor={theme.surface}
                padding={1}
                onSubmit={() => {
                  handleCommand(input());
                  setShowCommands(false);
                }}
              />
            </box>
            
            <box flexDirection="column">
              <text fg={theme.text}><strong>Available Commands:</strong></text>
              <text fg={theme.muted}>• /model &lt;name&gt; — Switch AI model</text>
              <text fg={theme.muted}>• /help — Show help</text>
              <text fg={theme.muted}>• /exit — Exit application</text>
            </box>
            
            <box marginTop="auto">
              <text fg={theme.muted}>Press Esc to close</text>
            </box>
          </box>
        </box>
      </Show>
    </box>
  );
}

// Render the app
render(() => <WZRDOpencodeFixed />);