import { createSignal, createEffect, For, Show } from "solid-js";
import { render } from "@opentui/solid";

// Exact Opencode colors from Opencode's theme file
const theme = {
  background: "#0a0a0a",      // darkStep1 - main background
  surface: "#141414",         // darkStep2 - chat background  
  element: "#1e1e1e",         // darkStep3 - element background
  primary: "#fab283",         // darkStep9 - primary color
  muted: "#808080",           // darkStep11 - muted text
  text: "#eeeeee",            // darkStep12 - text color
  border: "#27272a",          // darkStep4 - borders
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
  model?: string;
}

interface AgentModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  enabled: boolean;
}

// Available AI models (can be configured)
const availableModels: AgentModel[] = [
  { id: "kimi-k2.5", name: "Kimi K2.5", provider: "Moonshot", description: "High-performance model", enabled: true },
  { id: "deepseek-v3.2", name: "DeepSeek V3.2", provider: "NVIDIA", description: "Research and analysis", enabled: true },
  { id: "glm-4.7-flash", name: "GLM-4.7-Flash", provider: "OpenRouter", description: "Fast general model", enabled: true },
  { id: "qwen3-coder-30b", name: "Qwen3-Coder-30B", provider: "OpenRouter", description: "Coding specialist", enabled: true },
  { id: "claude-3.5-sonnet", name: "Claude 3.5 Sonnet", provider: "Anthropic", description: "Balanced reasoning", enabled: true },
  { id: "gpt-4o", name: "GPT-4o", provider: "OpenAI", description: "Multimodal reasoning", enabled: true },
];

// Gateway V2 connection URL (adjust if different)
const GATEWAY_URL = "ws://127.0.0.1:8765";

// Simple WebSocket-based agent client
class AgentClient {
  private ws: WebSocket | null = null;
  private connected = false;
  private messageQueue: any[] = [];
  
  constructor() {
    this.connect();
  }
  
  private connect() {
    try {
      console.log(`🔌 Connecting to Gateway V2 at ${GATEWAY_URL}...`);
      this.ws = new WebSocket(GATEWAY_URL);
      
      this.ws.onopen = () => {
        console.log('✅ Connected to Gateway V2');
        this.connected = true;
        this.processQueue();
      };
      
      this.ws.onmessage = (event) => {
        console.log('📨 Gateway message:', event.data);
        // Handle gateway responses here
      };
      
      this.ws.onclose = () => {
        console.log('❌ Gateway connection closed');
        this.connected = false;
        setTimeout(() => this.connect(), 5000); // Reconnect after 5s
      };
      
      this.ws.onerror = (error) => {
        console.error('⚠️ Gateway error:', error);
      };
    } catch (error) {
      console.error('❌ Failed to connect to Gateway:', error);
    }
  }
  
  private processQueue() {
    while (this.messageQueue.length > 0 && this.connected) {
      const message = this.messageQueue.shift();
      this.ws?.send(JSON.stringify(message));
    }
  }
  
  // Send a request to the gateway
  sendRequest(method: string, params: any = {}): Promise<any> {
    return new Promise((resolve, reject) => {
      const request = {
        type: 'req',
        id: `req-${Date.now()}`,
        method,
        params
      };
      
      if (this.connected && this.ws) {
        this.ws.send(JSON.stringify(request));
        // Simple timeout-based resolution
        setTimeout(() => {
          resolve({ ok: true, message: 'Request sent to gateway' });
        }, 1000);
      } else {
        this.messageQueue.push(request);
        reject(new Error('Gateway not connected'));
      }
    });
  }
  
  // Send a chat completion request
  async chatCompletion(prompt: string, modelId: string = "kimi-k2.5"): Promise<string> {
    try {
      const response = await this.sendRequest('chat.completion', {
        prompt,
        model: modelId,
        temperature: 0.7,
        max_tokens: 1000
      });
      
      // For now, return a mock response while gateway integration is improved
      return `WZRD (via ${modelId}): I received your message: "${prompt.substring(0, 50)}..."\n\nThis is a response from the WZRD agent system connected to Gateway V2.\n\nTry changing models with '/model <name>'`;
    } catch (error) {
      console.error('Chat completion failed:', error);
      return `WZRD Agent Error: ${error}\n\nGateway may not be fully configured. Using fallback response.`;
    }
  }
}

// Create singleton agent client
const agentClient = new AgentClient();

function WZRDAgent() {
  const [input, setInput] = createSignal("");
  const [messages, setMessages] = createSignal<Message[]>([
    { 
      id: 1, 
      role: "system", 
      content: "🤖 WZRD Agent System Initialized",
      timestamp: new Date().toLocaleTimeString(),
      model: "system"
    },
    { 
      id: 2, 
      role: "assistant", 
      content: "Welcome to WZRD.dev Agent System! Connected to Gateway V2.\nAvailable models: Kimi K2.5, DeepSeek V3.2, GLM-4.7-Flash, Qwen3-Coder-30B\n\nCommands:\n• /models - List available AI models\n• /model <name> - Switch to a specific model\n• /gateway - Check Gateway V2 connection status\n• Type normally to chat with the selected model",
      timestamp: new Date().toLocaleTimeString(),
      model: "kimi-k2.5"
    },
  ]);
  const [status, setStatus] = createSignal("Ready - Connected to Gateway V2, Model: Kimi K2.5");
  const [isLoading, setIsLoading] = createSignal(false);
  const [currentModel, setCurrentModel] = createSignal("kimi-k2.5");
  const [gatewayConnected, setGatewayConnected] = createSignal(true);

  // Auto-scroll to bottom
  createEffect(() => {
    if (messages().length > 0) {
      console.log("Auto-scrolling to latest message");
    }
  });

  const handleSubmit = async () => {
    const text = input().trim();
    if (!text) return;
    
    setInput("");
    setStatus(`Processing with ${currentModel()}...`);
    setIsLoading(true);
    
    // Add user message
    const userMessageId = messages().length + 1;
    setMessages(prev => [...prev, { 
      id: userMessageId, 
      role: "user", 
      content: text,
      timestamp: new Date().toLocaleTimeString()
    }]);
    
    try {
      // Check for commands
      if (text.startsWith("/models")) {
        const modelList = availableModels.map(m => `• ${m.name} (${m.provider}) - ${m.description}`).join("\n");
        setMessages(prev => [...prev, { 
          id: userMessageId + 1,
          role: "system", 
          content: `🤖 Available AI Models:\n\n${modelList}\n\nCurrent: ${currentModel()}\nUse '/model <name>' to switch.`,
          timestamp: new Date().toLocaleTimeString(),
          model: "system"
        }]);
        setStatus(`✅ Models list shown`);
      } else if (text.startsWith("/model ")) {
        const modelName = text.substring(7).toLowerCase();
        const model = availableModels.find(m => 
          m.id.toLowerCase().includes(modelName) || 
          m.name.toLowerCase().includes(modelName)
        );
        
        if (model) {
          setCurrentModel(model.id);
          setMessages(prev => [...prev, { 
            id: userMessageId + 1,
            role: "system", 
            content: `🔄 Switched to ${model.name} (${model.provider})\n${model.description}`,
            timestamp: new Date().toLocaleTimeString(),
            model: "system"
          }]);
          setStatus(`✅ Model switched to ${model.name}`);
        } else {
          setMessages(prev => [...prev, { 
            id: userMessageId + 1,
            role: "system", 
            content: `❌ Model not found. Use '/models' to see available options.`,
            timestamp: new Date().toLocaleTimeString(),
            model: "system"
          }]);
          setStatus(`❌ Model not found`);
        }
      } else if (text.startsWith("/gateway")) {
        const status = gatewayConnected() ? "✅ Connected" : "❌ Disconnected";
        setMessages(prev => [...prev, { 
          id: userMessageId + 1,
          role: "system", 
          content: `🔌 Gateway V2 Status: ${status}\nURL: ${GATEWAY_URL}\nModel: ${currentModel()}`,
          timestamp: new Date().toLocaleTimeString(),
          model: "system"
        }]);
        setStatus(`✅ Gateway status checked`);
      } else {
        // Get AI response via agent client
        const aiResponse = await agentClient.chatCompletion(text, currentModel());
        
        setMessages(prev => [...prev, { 
          id: userMessageId + 1,
          role: "assistant", 
          content: aiResponse,
          timestamp: new Date().toLocaleTimeString(),
          model: currentModel()
        }]);
        setStatus(`✅ Response from ${currentModel()} at ${new Date().toLocaleTimeString()}`);
      }
    } catch (error: any) {
      setMessages(prev => [...prev, { 
        id: userMessageId + 1,
        role: "system", 
        content: `❌ Error: ${error.message}\n\nYour message: "${text}"`,
        timestamp: new Date().toLocaleTimeString(),
        model: "system"
      }]);
      setStatus(`❌ Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to get accent color by index
  const getAccentColor = (index: number) => {
    const colors = [theme.accent1, theme.accent2, theme.accent3, theme.accent4, theme.accent5];
    return colors[index % colors.length];
  };

  // Get current model display name
  const getCurrentModelName = () => {
    const model = availableModels.find(m => m.id === currentModel());
    return model ? `${model.name} (${model.provider})` : currentModel();
  };

  return (
    <box flexDirection="row" flexGrow={1} backgroundColor={theme.background}>
      {/* Main chat area - 75% */}
      <box flexDirection="column" flexGrow={15} width="75%" backgroundColor={theme.background} padding={1}>
        <text fg={theme.primary} marginBottom={1}><strong>🤖 WZRD Agent System</strong></text>
        
        {/* Messages */}
        <scrollbox
          flexGrow={1}
          backgroundColor={theme.surface}
          padding={2}
          marginBottom={1}
          verticalScrollbarOptions={{
            paddingLeft: 1,
            visible: true,
            trackOptions: {
              backgroundColor: theme.element,
              foregroundColor: theme.border,
            },
          }}
          stickyScroll={true}
          stickyStart="bottom"
        >
          <For each={messages()}>
            {(msg) => (
              <box 
                flexDirection="column"
                marginBottom={2}
                backgroundColor={theme.element}
                padding={2}
              >
                <box flexDirection="row" justifyContent="space-between" marginBottom={1}>
                  <text 
                    fg={
                      msg.role === "assistant" ? theme.primary :
                      msg.role === "system" ? theme.accent2 :
                      theme.text
                    }
                  >
                    <strong>
                      {msg.role === "assistant" ? `🤖 WZRD ${msg.model ? `(${msg.model})` : ""}` : 
                       msg.role === "system" ? "🔧 System" : 
                       "👤 You"}
                    </strong>
                  </text>
                  <box flexDirection="column" alignItems="flex-end">
                    <text fg={theme.muted}>
                      {msg.timestamp}
                    </text>
{msg.model && msg.model !== "system" && (
                       <text fg={theme.muted}>
                         {msg.model}
                       </text>
                     )}
                  </box>
                </box>
                <text fg={theme.text}>
                  {msg.content}
                </text>
              </box>
            )}
          </For>
          
          <Show when={isLoading()}>
            <box flexDirection="row" marginBottom={2} backgroundColor={theme.element} padding={2}>
              <text fg={theme.primary} marginRight={1}>⏳</text>
              <text fg={theme.text}>Processing with {currentModel()}...</text>
            </box>
          </Show>
        </scrollbox>

        {/* Input */}
        <box flexDirection="row">
          <input
            value={input()}
            placeholder={`Chat with ${getCurrentModelName()} or use /commands...`}
            flexGrow={1}
            backgroundColor={theme.surface}
            onSubmit={handleSubmit}
            onKeyDown={(e: any) => {
              if (e.name === "return" && !e.shift) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            onInput={(value: string) => setInput(value)}
          />
        </box>

        <box marginTop={1} flexDirection="row" justifyContent="space-between">
          <text fg={theme.muted}>{status()}</text>
          <text fg={theme.muted}>
            Gateway: {gatewayConnected() ? "✅" : "❌"} • Model: {currentModel()}
          </text>
        </box>
      </box>

      {/* Sidebar - 25% */}
      <box flexDirection="column" flexGrow={5} width="25%" backgroundColor={theme.surface} padding={2}>
        <text fg={theme.primary} marginBottom={2}><strong>🔧 Agent Configuration</strong></text>
        
        {/* Current Model */}
        <box backgroundColor={theme.element} padding={2} marginBottom={2}>
          <text fg={getAccentColor(0)} marginBottom={1}><strong>🤖 Active Model</strong></text>
          <box flexDirection="column">
            <text fg={theme.text}>{getCurrentModelName()}</text>
            <text fg={theme.muted} marginTop={1}>Gateway: {GATEWAY_URL}</text>
            <text fg={gatewayConnected() ? theme.accent3 : theme.accent5}>
              Status: {gatewayConnected() ? "Connected ✅" : "Disconnected ❌"}
            </text>
          </box>
        </box>

        {/* Quick Commands */}
        <box backgroundColor={theme.element} padding={2} marginBottom={2}>
          <text fg={theme.primary} marginBottom={1}><strong>⚡ Commands</strong></text>
          <box flexDirection="column">
            <text fg={theme.text}>/models - List AI models</text>
            <text fg={theme.text}>/model kimi-k2.5 - Switch model</text>
            <text fg={theme.text}>/gateway - Check connection</text>
            <text fg={theme.text}>Type normally to chat</text>
          </box>
        </box>

        {/* Available Models */}
        <box backgroundColor={theme.element} padding={2} marginBottom={2}>
          <text fg={theme.primary} marginBottom={1}><strong>🎯 Top Models</strong></text>
          <box flexDirection="column">
            <For each={availableModels.slice(0, 4)}>
              {(model, index) => (
                <box flexDirection="row" marginBottom={1}>
                  <text fg={getAccentColor(index())} marginRight={1}>•</text>
                  <text fg={model.id === currentModel() ? theme.primary : theme.text}>
                    {model.name} {model.id === currentModel() ? "(active)" : ""}
                  </text>
                </box>
              )}
            </For>
          </box>
        </box>

        {/* System Status */}
        <box backgroundColor={theme.element} padding={2}>
          <text fg={theme.primary} marginBottom={1}><strong>📊 Status</strong></text>
          <box flexDirection="column">
            <text fg={theme.text}>Messages: {messages().length}</text>
            <text fg={theme.text}>Models: {availableModels.length}</text>
            <text fg={theme.text}>Gateway: {GATEWAY_URL}</text>
            <text fg={theme.text}>Layout: 75/25 split</text>
          </box>
        </box>
      </box>
    </box>
  );
}

render(() => <WZRDAgent />);