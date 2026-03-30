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
}

interface Skill {
  id: string;
  name: string;
  description: string;
  category: string;
  enabled: boolean;
}

// Key skills to integrate (first 10 from .claude/skills/)
const availableSkills: Skill[] = [
  { id: "platform-integration", name: "Platform Integration", description: "Edge.dev scanner uploads/runs", category: "integration", enabled: true },
  { id: "transform-model-a", name: "Transform Model A", description: "V31 column-based transformations", category: "transformation", enabled: true },
  { id: "transform-model-b", name: "Transform Model B", description: "V31 row-iteration transformations", category: "transformation", enabled: true },
  { id: "transform-model-c", name: "Transform Model C", description: "V31 multi-pass transformations", category: "transformation", enabled: true },
  { id: "react-ui-master", name: "React UI Master", description: "UI/UX editing with shadcn/ui", category: "ui", enabled: true },
  { id: "gold-standard", name: "Gold Standard", description: "Quality protocols", category: "quality", enabled: true },
  { id: "e2e-test", name: "E2E Testing", description: "Comprehensive testing", category: "testing", enabled: true },
  { id: "opentui", name: "OpenTUI", description: "TUI development", category: "development", enabled: true },
  { id: "documentation", name: "Documentation", description: "Technical writing", category: "writing", enabled: true },
  { id: "file-ops", name: "File Operations", description: "File management", category: "operations", enabled: true },
  { id: "automation", name: "Automation", description: "Task automation", category: "operations", enabled: true },
  { id: "heartbeat", name: "Heartbeat", description: "Cron scheduling", category: "operations", enabled: true },
  { id: "background-agents", name: "Background Agents", description: "Parallel execution", category: "agents", enabled: true },
  { id: "transcribe", name: "Transcription", description: "Audio/video transcription", category: "media", enabled: true },
  { id: "auto-memory", name: "Auto Memory", description: "Context injection", category: "memory", enabled: true },
];

function WZRDWithSkills() {
  const [input, setInput] = createSignal("");
  const [messages, setMessages] = createSignal<Message[]>([
    { 
      id: 1, 
      role: "system", 
      content: "🎨 WZRD.dev v2.0 - Exact Opencode Visual Clone Ready for Skills Integration",
      timestamp: new Date().toLocaleTimeString() 
    },
    { 
      id: 2, 
      role: "assistant", 
      content: "Welcome to WZRD.dev! UI fixes applied and 75+ skills ready for integration. Try asking about a specific skill or use '/skills' to see available options.",
      timestamp: new Date().toLocaleTimeString() 
    },
  ]);
  const [status, setStatus] = createSignal("Ready - Enter to send, Tab to navigate, /skills for list");
  const [isLoading, setIsLoading] = createSignal(false);
  const [activeSkill, setActiveSkill] = createSignal<string | null>(null);
  const [showSkills, setShowSkills] = createSignal(false);

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
    setStatus(`Processing: "${text.substring(0, 30)}..."`);
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
      if (text.startsWith("/skills")) {
        setMessages(prev => [...prev, { 
          id: userMessageId + 1,
          role: "system", 
          content: `📚 Available Skills (${availableSkills.length} total)\n\n${availableSkills.map(s => `• ${s.name} - ${s.description}`).join("\n")}\n\nUse '/skill <name>' to learn more.`,
          timestamp: new Date().toLocaleTimeString()
        }]);
        setStatus(`✅ Skills list shown`);
      } else if (text.startsWith("/skill ")) {
        const skillName = text.substring(7).toLowerCase();
        const skill = availableSkills.find(s => s.id.toLowerCase().includes(skillName) || s.name.toLowerCase().includes(skillName));
        
        if (skill) {
          setActiveSkill(skill.id);
          setMessages(prev => [...prev, { 
            id: userMessageId + 1,
            role: "system", 
            content: `🔧 Skill: ${skill.name}\nCategory: ${skill.category}\nDescription: ${skill.description}\nStatus: ${skill.enabled ? "✅ Enabled" : "⚠️ Disabled"}\n\nSkill file: /home/mdwzrd/.claude/skills/${skill.id}/SKILL.md`,
            timestamp: new Date().toLocaleTimeString()
          }]);
          setStatus(`✅ ${skill.name} activated`);
        } else {
          setMessages(prev => [...prev, { 
            id: userMessageId + 1,
            role: "system", 
            content: `❌ Skill not found. Use '/skills' to see available options.`,
            timestamp: new Date().toLocaleTimeString()
          }]);
          setStatus(`❌ Skill not found`);
        }
      } else {
        // Default AI response
        setMessages(prev => [...prev, { 
          id: userMessageId + 1,
          role: "assistant", 
          content: `WZRD: Thanks for your message about "${text.substring(0, 50)}..."\n\nAvailable commands:\n• /skills - List all available skills\n• /skill <name> - Get details about a skill\n• Type normally for chat\n\nTry: "/skill platform-integration" to learn about Edge.dev integration`,
          timestamp: new Date().toLocaleTimeString()
        }]);
        setStatus(`✅ Response sent at ${new Date().toLocaleTimeString()}`);
      }
    } catch (error: any) {
      setMessages(prev => [...prev, { 
        id: userMessageId + 1,
        role: "system", 
        content: `❌ Error: ${error.message}\n\nYour message: "${text}"`,
        timestamp: new Date().toLocaleTimeString()
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

  return (
    <box flexDirection="row" flexGrow={1} backgroundColor={theme.background}>
      {/* Main chat area - 75% */}
      <box flexDirection="column" flexGrow={15} width="75%" backgroundColor={theme.background} padding={1}>
        <text fg={theme.primary} marginBottom={1}><strong>🤖 WZRD.dev v2.0</strong></text>
        
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
                      {msg.role === "assistant" ? "🤖 WZRD" : 
                       msg.role === "system" ? "🔧 System" : 
                       "👤 You"}
                    </strong>
                  </text>
                  <text fg={theme.muted}>
                    {msg.timestamp}
                  </text>
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
              <text fg={theme.text}>Processing...</text>
            </box>
          </Show>
        </scrollbox>

        {/* Input */}
        <box flexDirection="row">
          <input
            value={input()}
            placeholder="Type message or use /skills, /skill <name>..."
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
            Skills: {availableSkills.length} • Active: {activeSkill() || "None"}
          </text>
        </box>
      </box>

      {/* Sidebar - 25% */}
      <box flexDirection="column" flexGrow={5} width="25%" backgroundColor={theme.surface} padding={2}>
        <text fg={theme.primary} marginBottom={2}><strong>🔧 Skills Integration</strong></text>
        
        {/* Active Skill */}
        <Show when={activeSkill()}>
          {() => {
            const skill = availableSkills.find(s => s.id === activeSkill());
            return (
              <box backgroundColor={theme.element} padding={2} marginBottom={2}>
                <text fg={getAccentColor(0)} marginBottom={1}><strong>✅ Active Skill</strong></text>
                <box flexDirection="column">
                  <text fg={theme.text}>{skill?.name}</text>
                  <text fg={theme.muted} marginTop={1}>{skill?.description}</text>
                </box>
              </box>
            );
          }}
        </Show>

        {/* Quick Actions */}
        <box backgroundColor={theme.element} padding={2} marginBottom={2}>
          <text fg={theme.primary} marginBottom={1}><strong>⚡ Quick Actions</strong></text>
          <box flexDirection="column">
            <text fg={theme.text}>1. Type "/skills" for list</text>
            <text fg={theme.text}>2. "/skill name" for details</text>
            <text fg={theme.text}>3. Chat normally for responses</text>
          </box>
        </box>

        {/* Key Skills */}
        <box backgroundColor={theme.element} padding={2} marginBottom={2}>
          <text fg={theme.primary} marginBottom={1}><strong>🔑 Key Skills</strong></text>
          <box flexDirection="column">
            <For each={availableSkills.slice(0, 5)}>
              {(skill, index) => (
                <box flexDirection="row" marginBottom={1}>
                  <text fg={getAccentColor(index())} marginRight={1}>•</text>
                  <text fg={theme.text}>{skill.name}</text>
                </box>
              )}
            </For>
          </box>
        </box>

        {/* UI Status */}
        <box backgroundColor={theme.element} padding={2}>
          <text fg={theme.primary} marginBottom={1}><strong>🎨 UI Status</strong></text>
          <box flexDirection="column">
            <text fg={theme.text}>✓ Exact Opencode colors</text>
            <text fg={theme.text}>✓ 75/25 split layout</text>
            <text fg={theme.text}>✓ Skills integration ready</text>
            <text fg={theme.text}>✓ Global launcher: ~/wzrd.dev/wzrd</text>
          </box>
        </box>
      </box>
    </box>
  );
}

render(() => <WZRDWithSkills />);