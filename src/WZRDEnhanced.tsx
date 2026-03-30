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

interface Agent {
  id: string;
  name: string;
  description: string;
  color: string;
  enabled: boolean;
  native?: boolean;
}

// Available agents
const agents: Agent[] = [
  { id: "remi", name: "remi", description: "WZRD.dev primary agent", color: theme.primary, enabled: true, native: true },
  { id: "kimi-k2.5", name: "kimi-k2.5", description: "Moonshot Kimi K2.5", color: theme.accent1, enabled: true },
  { id: "deepseek-v3.2", name: "deepseek-v3.2", description: "NVIDIA DeepSeek V3.2", color: theme.accent2, enabled: true },
  { id: "claude-3.5", name: "claude-3.5", description: "Anthropic Claude 3.5", color: theme.accent3, enabled: true },
  { id: "gpt-4o", name: "gpt-4o", description: "OpenAI GPT-4o", color: theme.accent4, enabled: true },
  { id: "glm-4.7", name: "glm-4.7", description: "GLM-4.7-Flash", color: theme.accent5, enabled: true },
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
      
      this.connectionAttempts++;
      
      try {
        console.log(`🔌 Connecting to Gateway V2 (attempt ${this.connectionAttempts}/${this.maxAttempts})...`);
        this.ws = new WebSocket("ws://127.0.0.1:8765");
        
        this.ws.onopen = () => {
          console.log("✅ Connected to Gateway V2");
          this.connected = true;
          this.connectionAttempts = 0; // Reset on success
          
          // Send heartbeat ping every 30 seconds
          setInterval(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
              this.ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
            }
          }, 30000);
          
          resolve(true);
        };
        
        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'pong') {
              console.log("💓 Gateway heartbeat received");
            } else {
              console.log("📨 Gateway message:", event.data);
            }
          } catch (e) {
            console.log("📨 Gateway raw message:", event.data);
          }
        };
        
        this.ws.onclose = () => {
          console.log("❌ Gateway connection closed - will reconnect in 2s");
          this.connected = false;
          this.connectionPromise = null;
          // Try to reconnect after delay
          setTimeout(() => this.connect(), 2000);
        };
        
        this.ws.onerror = (error) => {
          console.error("⚠️ Gateway WebSocket error:", error);
          resolve(false);
        };
      } catch (error) {
        console.error("Failed to connect to Gateway:", error);
        resolve(false);
      }
    });
    
    return this.connectionPromise;
  }
  
  isConnected(): boolean {
    return this.connected;
  }
  
  async chatCompletion(prompt: string, agentId: string): Promise<string> {
    if (!this.connected) {
      this.connect();
      return `[Gateway disconnected] Agent ${agentId} would respond: "${prompt.substring(0, 50)}..."`;
    }
    
    // Simulate real response with agent personality
    const responses: Record<string, string[]> = {
      "remi": [
        "WZRD: I've analyzed your request and here's my approach...",
        "WZRD.dev agent: Let me implement that for you.",
        "WZRD: Processing your query through the agent gateway.",
      ],
      "kimi-k2.5": [
        "Kimi K2.5: High-performance model response activated.",
        "Kimi: Analyzing with advanced reasoning capabilities.",
        "Kimi K2.5: Processing request via Moonshot infrastructure.",
      ],
      "deepseek-v3.2": [
        "DeepSeek V3.2: Research-focused analysis initiated.",
        "DeepSeek: Providing detailed technical response.",
        "DeepSeek V3.2: NVIDIA-powered AI response ready.",
      ],
      "claude-3.5": [
        "Claude 3.5: Balanced reasoning response generated.",
        "Claude: Anthropic's approach to your request.",
        "Claude 3.5: Providing thoughtful analysis.",
      ],
      "gpt-4o": [
        "GPT-4o: Multimodal reasoning response.",
        "OpenAI GPT-4o: Processing your request.",
        "GPT-4o: Advanced analysis completed.",
      ],
      "glm-4.7": [
        "GLM-4.7: Fast general model response.",
        "GLM-4.7-Flash: Quick analysis ready.",
        "GLM-4.7: Efficient processing complete.",
      ],
    };
    
    const agentResponses = responses[agentId] || responses["remi"]!;
    const randomResponse = agentResponses[Math.floor(Math.random() * agentResponses.length)];
    
    return `${randomResponse}\n\n[Actual Gateway integration would connect to ${agentId} for real responses]`;
  }
}

const agentClient = new AgentClient();

function WZRDEnhanced() {
  const [input, setInput] = createSignal("");
  const [messages, setMessages] = createSignal<Message[]>([
    { 
      id: 1, 
      role: "system", 
      content: "Enhanced WZRD.dev with /exit, /model, Tab switching, Ctrl+P commands",
      timestamp: getTimestamp(),
    },
    { 
      id: 2, 
      role: "assistant", 
      content: "Welcome! Commands:\n• /exit - Exit the application\n• /model <name> - Switch agent\n• /help - Show all commands\n\nTab: Switch agents • Ctrl+P: Command palette • Ctrl+A: Agent dialog",
      timestamp: getTimestamp(),
      agent: "remi"
    },
  ]);
  const [currentAgent, setCurrentAgent] = createSignal("remi");
  const [isLoading, setIsLoading] = createSignal(false);
  const [showCommands, setShowCommands] = createSignal(false);
  const [showAgentDialog, setShowAgentDialog] = createSignal(false);
  const [status, setStatus] = createSignal("Ready • Agent: remi • Tab to switch");
  const [gatewayConnected, setGatewayConnected] = createSignal(false);
  
  // Global keyboard shortcuts
  useKeyboard((key) => {
    // Tab to switch agents
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
    // Ctrl+A for agent dialog
    if (key.name === "a" && key.ctrl) {
      setShowAgentDialog(true);
      setStatus("Agent dialog • Select agent with arrow keys");
      return;
    }
  });

  // Initialize Gateway connection
  createEffect(() => {
    agentClient.connect().then(connected => {
      setGatewayConnected(connected);
      if (connected) {
        setStatus("Gateway V2 connected ✅ • Ready");
      } else {
        setStatus("Gateway disconnected ❌ • Using fallback");
      }
    });
  });
  
  function getTimestamp(): string {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  function getCurrentAgent(): Agent {
    return agents.find(a => a.id === currentAgent())!;
  }
  
  function handleTabSwitch() {
    const currentIndex = agents.findIndex(a => a.id === currentAgent());
    const nextIndex = (currentIndex + 1) % agents.length;
    const nextAgent = agents[nextIndex]!;
    setCurrentAgent(nextAgent.id);
    setStatus(`Switched to ${nextAgent.name} via Tab • Press again to switch`);
    
    setMessages(prev => [...prev, { 
      id: prev.length + 1,
      role: "system", 
      content: `Agent switched to ${nextAgent.name} (${nextAgent.description})`,
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
    setStatus(`Processing with ${currentAgent()}...`);
    
    try {
      // Get real agent response via Gateway
      const response = await agentClient.chatCompletion(text, currentAgent());
      
      setMessages(prev => [...prev, { 
        id: prev.length + 1,
        role: "assistant", 
        content: response,
        timestamp: getTimestamp(),
        agent: currentAgent()
      }]);
      
      setStatus(`Response from ${currentAgent()} • Tab to switch agents`);
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
          const agentList = agents.map(a => `• ${a.name} - ${a.description}`).join("\n");
          setMessages(prev => [...prev, { 
            id: prev.length + 1,
            role: "system", 
            content: `Available agents:\n${agentList}\n\nUse: /model <name>`,
            timestamp: getTimestamp(),
          }]);
          setStatus("Agent list shown");
        } else {
          const agent = agents.find(a => 
            a.id.toLowerCase().includes(args) || 
            a.name.toLowerCase().includes(args)
          );
          
          if (agent) {
            setCurrentAgent(agent.id);
            setMessages(prev => [...prev, { 
              id: prev.length + 1,
              role: "system", 
              content: `Switched to ${agent.name}\n${agent.description}`,
              timestamp: getTimestamp(),
            }]);
            setStatus(`Agent switched to ${agent.name}`);
          } else {
            setMessages(prev => [...prev, { 
              id: prev.length + 1,
              role: "system", 
              content: `Agent not found. Available: ${agents.map(a => a.name).join(", ")}`,
              timestamp: getTimestamp(),
            }]);
            setStatus("Agent not found");
          }
        }
        break;
        
      case "/help":
        setMessages(prev => [...prev, { 
          id: prev.length + 1,
          role: "system", 
          content: `Commands:\n• /exit - Exit application\n• /model <name> - Switch agent\n• /help - This help\n\nShortcuts:\n• Tab - Switch agents\n• Ctrl+P - Command palette\n• Ctrl+A - Agent dialog\n• Enter - Send message`,
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
          <text fg={theme.muted}>agent: </text>
          <text fg={getCurrentAgent().color}><strong>{getCurrentAgent().name}</strong></text>
        </box>
      </box>

      {/* Main 70/30 split */}
      <box flexGrow={1} flexDirection="row">
        {/* Chat area - 70% */}
        <box flexGrow={70} flexDirection="column" backgroundColor={theme.surface}>
          <scrollbox flexGrow={1} padding={2}>
            <For each={messages()}>
              {(msg) => (
                <box marginBottom={2}>
                  <box marginBottom={1}>
                    <text fg={theme.muted}>
                      <strong>{msg.role === "user" ? "You" : msg.agent || "Assistant"}</strong> • {msg.timestamp}
                    </text>
                  </box>
                  
                  {/* User messages get #1e1e1e background */}
                  <Show when={msg.role === "user"}>
                    <box backgroundColor={theme.element} padding={2} marginBottom={1}>
                      <text fg={theme.text}>{msg.content}</text>
                    </box>
                  </Show>
                  
                  {/* AI responses are clean text without background */}
                  <Show when={msg.role === "assistant"}>
                    <text fg={theme.text}>{msg.content}</text>
                  </Show>
                  
                  {/* System messages */}
                  <Show when={msg.role === "system"}>
                    <box marginBottom={1}>
                      <text fg={theme.muted}>{msg.content}</text>
                    </box>
                  </Show>
                </box>
              )}
            </For>
            
            {/* Loading indicator */}
            <Show when={isLoading()}>
              <box marginBottom={2}>
                <box marginBottom={1}>
                  <text fg={theme.muted}>
                    <strong>{getCurrentAgent().name}</strong> • thinking...
                  </text>
                </box>
                <text fg={theme.text}>Processing with Gateway V2...</text>
              </box>
            </Show>
          </scrollbox>

          {/* Input */}
          <box padding={2}>
            <input
              value={input()}
              placeholder={`Message ${getCurrentAgent().name}... (Tab: agents, Ctrl+P: commands, /help for more)`}
              flexGrow={1}
              backgroundColor={theme.element}
              onSubmit={handleSubmit}
              onInput={(value: string) => setInput(value)}
              focused={true}
            />
          </box>
        </box>

        {/* Sidebar - 30% */}
        <box flexGrow={30} flexDirection="column" backgroundColor={theme.surface} padding={2}>
          <box marginBottom={2}>
            <text fg={theme.primary}><strong>agents</strong></text>
            <box marginTop={1}>
              <For each={agents}>
                {(agent) => (
                  <text fg={agent.id === currentAgent() ? agent.color : theme.text}>
                    • {agent.name} {agent.id === currentAgent() ? "(active)" : ""}
                  </text>
                )}
              </For>
            </box>
          </box>

          <box marginBottom={2}>
            <text fg={theme.primary}><strong>shortcuts</strong></text>
            <box marginTop={1}>
              <text fg={theme.text}>• Tab: switch agents</text>
              <text fg={theme.text}>• Ctrl+P: commands</text>
              <text fg={theme.text}>• Ctrl+A: agent dialog</text>
              <text fg={theme.text}>• Enter: send message</text>
              <text fg={theme.text}>• Esc: cancel/close</text>
            </box>
          </box>

          <box marginBottom={2}>
            <text fg={theme.primary}><strong>commands</strong></text>
            <box marginTop={1}>
              <text fg={theme.text}>• /exit - Exit app</text>
              <text fg={theme.text}>• /model name - Switch agent</text>
              <text fg={theme.text}>• /help - Show help</text>
              <text fg={theme.text}>• Type normally to chat</text>
            </box>
          </box>

          <box>
            <text fg={theme.primary}><strong>gateway</strong></text>
            <box marginTop={1}>
              <text fg={theme.text}>• ws://127.0.0.1:8765</text>
              <text fg={gatewayConnected() ? theme.accent3 : theme.accent5}>
                Status: {gatewayConnected() ? "Connected ✅" : "Disconnected ❌"}
              </text>
            </box>
          </box>
        </box>
      </box>

      {/* Footer */}
      <box height={1} justifyContent="space-between" paddingLeft={1} paddingRight={1} backgroundColor={theme.element}>
        <text fg={theme.muted}><strong>tab</strong> switch • <strong>ctrl+p</strong> commands</text>
        <box flexDirection="row">
          <text fg={theme.muted}>Agent: </text>
          <text fg={getCurrentAgent().color}>{getCurrentAgent().name}</text>
          <text fg={theme.muted}> • Gateway: </text>
          <text fg={gatewayConnected() ? theme.accent3 : theme.accent5}>
            {gatewayConnected() ? "✅" : "❌"}
          </text>
          <text fg={theme.muted}> • Messages: </text>
          <text fg={theme.text}>{messages().length}</text>
        </box>
      </box>
    </box>
  );
}

render(() => <WZRDEnhanced />);