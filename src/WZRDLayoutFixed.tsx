import { createSignal, For, Show, createEffect } from "solid-js";
import { render, useKeyboard } from "@opentui/solid";
import { spawn } from "child_process";
import { existsSync } from "fs";
import { homedir } from "os";

// AI Response Handler - Uses Opencode CLI for real AI
class AIClient {
  private opencodePath: string;

  constructor() {
    // Find opencode binary
    const possiblePaths = [
      `${homedir()}/.opencode/bin/opencode`,
      `${homedir()}/.local/bin/opencode`,
      "/usr/local/bin/opencode",
      "/usr/bin/opencode",
    ];
    this.opencodePath = possiblePaths.find(p => existsSync(p)) || "opencode";
  }

  connect(): Promise<boolean> {
    return new Promise((resolve) => {
      const hasOpencode = existsSync(this.opencodePath);
      console.log(hasOpencode
        ? `✅ Found Opencode at ${this.opencodePath}`
        : "⚠️ Opencode not found - will use fallback");
      resolve(hasOpencode);
    });
  }

  async chat(message: string, model: string): Promise<string> {
    return new Promise((resolve, reject) => {
      // Map our model names to Opencode model names
      const modelMap: Record<string, string> = {
        "kimi-k2.5": "kimi-k2.5",
        "deepseek-v3.2": "deepseek-chat",
        "claude-3.5": "claude-sonnet-4-20250514",
        "gpt-4o": "gpt-4o",
        "glm-4.7": "glm-4-flash",
      };

      const opencodeModel = modelMap[model] || model;

      // Check if opencode exists
      if (!existsSync(this.opencodePath)) {
        // Fallback to echo
        resolve(`[${model}] Echo: ${message}\n\n(Opencode CLI not found - install with: curl -sSL https://opencode.ai/install | bash)`);
        return;
      }

      // Spawn opencode process
      const proc = spawn(this.opencodePath, ["run", message], {
        env: {
          ...process.env,
          MODEL: opencodeModel,
        },
        timeout: 60000, // 60 second timeout
      });

      let output = "";
      let errorOutput = "";

      proc.stdout.on("data", (data) => {
        output += data.toString();
      });

      proc.stderr.on("data", (data) => {
        errorOutput += data.toString();
      });

      proc.on("close", (code) => {
        if (code !== 0 && code !== null) {
          reject(new Error(`Opencode exited with code ${code}: ${errorOutput}`));
        } else if (output.trim()) {
          resolve(output.trim());
        } else if (errorOutput.trim()) {
          resolve(`Error: ${errorOutput.trim()}`);
        } else {
          resolve("(No response from AI)");
        }
      });

      proc.on("error", (err) => {
        reject(new Error(`Failed to spawn Opencode: ${err.message}`));
      });
    });
  }
}

const aiClient = new AIClient();

// Note: Gateway V2 is optional - app works with fallback responses

// Exact Opencode colors
const theme = {
  background: "#0a0a0a",
  surface: "#141414",
  element: "#1e1e1e",
  primary: "#fab283",
  muted: "#808080",
  text: "#eeeeee",
  accent1: "#6ba4ff",
  accent2: "#d06efa",
  accent3: "#4cd964",
  accent4: "#ff9500",
  accent5: "#ff6b6b",
};

const agentModes = [
  { id: "remi", name: "remi", description: "WZRD.dev primary agent", color: theme.primary },
  { id: "plan", name: "plan", description: "Planning/research mode", color: theme.accent3 },
  { id: "build", name: "build", description: "Build/implementation mode", color: theme.accent4 },
];

const aiModels = [
  { id: "kimi-k2.5", name: "kimi-k2.5", description: "Moonshot Kimi K2.5", color: theme.accent1 },
  { id: "deepseek-v3.2", name: "deepseek-v3.2", description: "NVIDIA DeepSeek V3.2", color: theme.accent2 },
  { id: "claude-3.5", name: "claude-3.5", description: "Anthropic Claude 3.5", color: theme.accent3 },
  { id: "gpt-4o", name: "gpt-4o", description: "OpenAI GPT-4o", color: theme.accent4 },
  { id: "glm-4.7", name: "glm-4.7", description: "GLM-4.7-Flash", color: theme.accent5 },
];

function WZRDLayoutFixed() {
  const [currentMode, setCurrentMode] = createSignal("remi");
  const [currentModel, setCurrentModel] = createSignal("kimi-k2.5");
  const [input, setInput] = createSignal("");
  const [gatewayConnected, setGatewayConnected] = createSignal(false);
  const [messages, setMessages] = createSignal([
    { id: 1, role: "system", content: "Tab switches modes • /model switches AI • Ctrl+P for commands", timestamp: new Date().toLocaleTimeString() }
  ]);
  const [showCommands, setShowCommands] = createSignal(false);

// Check gateway connection on mount (optional)
createEffect(() => {
  const checkConnection = async () => {
    console.log("🔍 Checking AI connection...");
    const connected = await aiClient.connect();
console.log(`Gateway V2 status: ${connected ? "✅ connected" : "❌ not running"}`);
setGatewayConnected(connected);

// Show status message only if not already shown
setMessages(prev => {
const newMessages = [...prev];
const lastMsg = newMessages[newMessages.length - 1];
if (lastMsg?.role === "system" && lastMsg.content.includes("Gateway")) {
return newMessages;
}
return [...prev, {
id: prev.length + 1,
role: "system" as const,
content: connected
? "✅ Gateway V2 connected - AI requests enabled"
: "ℹ️  Gateway V2 not running - using local fallback (start with: gateway-v2)",
timestamp: new Date().toLocaleTimeString()
}];
});
};
checkConnection();
});

  useKeyboard((key) => {
    if (key.name === "tab") {
      const modes: string[] = ["remi", "plan", "build"];
      const idx = modes.indexOf(currentMode());
      const next: string = modes[(idx + 1) % modes.length] || "remi";
      setCurrentMode(next);
      setMessages(prev => [...prev, { 
        id: prev.length + 1, 
        role: "system", 
        content: `Switched to ${next} mode`, 
        timestamp: new Date().toLocaleTimeString() 
      }]);
    }
    if (key.name === "p" && key.ctrl) {
      setShowCommands(s => !s);
    }
  });

  async function handleSubmit() {
    const text = input().trim();
    if (!text) return;
    
    const cmd = text.toLowerCase();
    
    // Handle commands
    if (text.startsWith("/")) {
      // /model or /models - switch AI model
      if (cmd.startsWith("/model") || cmd.startsWith("/models")) {
        const parts = text.split(/\s+/);
        if (parts.length < 2) {
          // Show available models
          const modelList = aiModels.map(m => `• ${m.id} - ${m.description}`).join("\n");
          setMessages(prev => [...prev, { 
            id: prev.length + 1, 
            role: "system", 
            content: `Available models:\n${modelList}\n\nUse: /model <name>`, 
            timestamp: new Date().toLocaleTimeString() 
          }]);
        } else {
          const modelName = parts.slice(1).join(" ").toLowerCase();
          const model = aiModels.find(m => m.id.includes(modelName) || m.name.toLowerCase().includes(modelName));
          if (model) {
            setCurrentModel(model.id);
            setMessages(prev => [...prev, { 
              id: prev.length + 1, 
              role: "system", 
              content: `✓ Switched to ${model.name}`, 
              timestamp: new Date().toLocaleTimeString() 
            }]);
          } else {
            setMessages(prev => [...prev, { 
              id: prev.length + 1, 
              role: "system", 
              content: `Model not found. Use /model to see available models.`, 
              timestamp: new Date().toLocaleTimeString() 
            }]);
          }
        }
      } else if (cmd === "/help") {
        setMessages(prev => [...prev, { 
          id: prev.length + 1, 
          role: "system", 
          content: `Commands:\n• /model <name> - Switch AI model\n• /models - List available models\n• /help - Show this help\n• /exit - Exit application\n\nShortcuts:\n• Tab - Switch agent modes\n• Ctrl+P - Toggle commands panel`, 
          timestamp: new Date().toLocaleTimeString() 
        }]);
      } else if (cmd === "/exit" || cmd === "/quit") {
        setMessages(prev => [...prev, { 
          id: prev.length + 1, 
          role: "system", 
          content: "Exiting... Press Ctrl+C to close", 
          timestamp: new Date().toLocaleTimeString() 
        }]);
        // Give user a moment to read, then exit
        setTimeout(() => process.exit(0), 1000);
      } else {
        setMessages(prev => [...prev, { 
          id: prev.length + 1, 
          role: "system", 
          content: `Unknown command: ${text}\nUse /help for available commands`, 
          timestamp: new Date().toLocaleTimeString() 
        }]);
      }
      return;
    }
    
    // Regular message - add to chat
    setMessages(prev => [...prev, { id: prev.length + 1, role: "user", content: text, timestamp: new Date().toLocaleTimeString() }]);
    
// Try AI client first, fallback to echo if not available
  if (gatewayConnected()) {
    try {
      const response = await aiClient.chat(text, currentModel());
      setMessages(prev => [...prev, {
        id: prev.length + 1,
        role: "assistant",
        content: response,
        timestamp: new Date().toLocaleTimeString(),
        agent: currentMode()
      }]);
    } catch (error) {
      console.log("AI request failed, using fallback:", error);
      setMessages(prev => [...prev, {
        id: prev.length + 1,
        role: "system",
        content: `Error: ${error}. Using fallback.`,
        timestamp: new Date().toLocaleTimeString()
      }]);
      // Fallback response
      setMessages(prev => [...prev, {
        id: prev.length + 1,
        role: "assistant",
        content: `[${currentMode()} via ${currentModel()}] Fallback: ${text}`,
        timestamp: new Date().toLocaleTimeString(),
        agent: currentMode()
      }]);
    }
  } else {
      // Gateway not connected - use fallback
      setMessages(prev => [...prev, { 
        id: prev.length + 1, 
        role: "assistant", 
        content: `[${currentMode()} via ${currentModel()}] Echo: ${text}\n\n(Gateway not connected - this is a fallback response)`, 
        timestamp: new Date().toLocaleTimeString(), 
        agent: currentMode() 
      }]);
    }
    
    setInput("");
  }

  return (
    <box flexDirection="column" flexGrow={1} backgroundColor={theme.background}>
      {/* Header */}
      <box flexDirection="row" justifyContent="space-between" padding={1}>
        <text fg={theme.primary}><strong>wzrd.dev</strong></text>
        <box flexDirection="row">
          <text fg={theme.muted}>mode:</text>
          <text fg={agentModes.find(m => m.id === currentMode())?.color || theme.primary}> {currentMode()}</text>
          <text fg={theme.muted}> • model:</text>
          <text fg={aiModels.find(m => m.id === currentModel())?.color || theme.accent1}> {currentModel()}</text>
        </box>
      </box>

      {/* Main content - Two columns */}
      <box flexDirection="row" flexGrow={1}>
        {/* Left: Chat (60%) */}
        <box flexDirection="column" flexGrow={1} padding={1} backgroundColor={theme.surface}>
          <box flexDirection="column" flexGrow={1}>
            <For each={messages()}>
              {(msg) => (
                <box flexDirection="column" marginBottom={1}>
                  <text fg={theme.muted}>[{msg.role}] {msg.timestamp}</text>
                  <text fg={theme.text}>{msg.content}</text>
                </box>
              )}
            </For>
          </box>
          <box marginTop={1}>
            <input
              placeholder="Type message or /model, /help..."
              value={input()}
              onInput={setInput}
              onSubmit={handleSubmit}
              backgroundColor={theme.element}
              padding={1}
            />
          </box>
        </box>

        {/* Right: Sidebar (40%) */}
        <box flexDirection="column" width={40} padding={1} backgroundColor={theme.background} border>
          <text fg={theme.primary}><strong>Agent Modes</strong></text>
          <text fg={theme.muted}>Tab to switch</text>
          <For each={agentModes}>
            {(mode) => (
              <box flexDirection="row" alignItems="center" padding={1}>
                <box width={2} height={1} backgroundColor={mode.color} marginRight={1} />
                <text fg={currentMode() === mode.id ? theme.text : theme.muted}>{mode.name}</text>
              </box>
            )}
          </For>

          <text fg={theme.primary} marginTop={2}><strong>AI Models</strong></text>
          <text fg={theme.muted}>Use /model</text>
          <For each={aiModels}>
            {(model) => (
              <box flexDirection="row" alignItems="center" padding={1}>
                <box width={2} height={1} backgroundColor={model.color} marginRight={1} />
                <text fg={currentModel() === model.id ? theme.text : theme.muted}>{model.name}</text>
              </box>
            )}
          </For>

<text fg={theme.primary} marginTop={2}><strong>Gateway V2 Status</strong></text>
<box padding={1} backgroundColor={theme.element}>
<Show when={gatewayConnected()}>
<text fg={theme.accent3}>✅ Connected</text>
<text fg={theme.muted}>AI requests enabled</text>
</Show>
<Show when={!gatewayConnected()}>
<text fg={theme.muted}>ℹ️  Not running</text>
<text fg={theme.muted}>Using fallback mode</text>
</Show>
</box>

          <text fg={theme.primary} marginTop={2}><strong>Shortcuts</strong></text>
          <text fg={theme.muted}>Tab - Switch mode</text>
          <text fg={theme.muted}>Ctrl+P - Commands</text>
          <text fg={theme.muted}>Enter - Send</text>
        </box>
      </box>

      {/* Status bar */}
      <box flexDirection="row" justifyContent="space-between" padding={1}>
        <text fg={theme.muted}>Mode: {currentMode()} • Model: {currentModel()}</text>
        <text fg={theme.muted}>Tab to switch modes</text>
      </box>
    </box>
  );
}

render(() => <WZRDLayoutFixed />);
