import { render, useKeyboard, useTerminalDimensions } from "@opentui/solid";
import { createSignal, createEffect, createMemo, For, Show } from "solid-js";
import { VisionSkill } from "./skills/vision";
import { fileSkill } from "./skills/files";
import { shellSkill } from "./skills/shell";
import { searchSkill } from "./skills/search";
import { gitSkill } from "./skills/git";
import { saveSession, loadSession, listSessions, autoSave, getStorageStats, getMostRecentSession } from "./storage";
import { aiClient, isAIConfigured, checkAIStatus, providers as aiProviders, modelIds, type ChatMessage } from "./api/providers";
import { getApiKey, setApiKey, loadApiKeysToEnv } from "./config";
import { getSystemPrompt, getPlanModePrompt } from "./agents/prompts";
import { WZRDWebSocketClient, type WZRDMessage } from "./websocket-client";
import { onMount, onCleanup } from "solid-js";
import { WrappedInput } from "./components/WrappedInput";
import { themes, defaultTheme, type Theme } from "./themes";

// Theme state - starts with dark theme
const [currentTheme, setCurrentTheme] = createSignal<Theme>(defaultTheme);

// Theme accessor for components that need the theme object
const theme = currentTheme;

// Agent colors - computed from current theme
const agentColors = () => ({
  remi: currentTheme().accentRed,
  plan: currentTheme().accentGreen,
  build: currentTheme().accentOrange,
  system: currentTheme().textDim,
  user: currentTheme().accentBlue,
});

// Agent modes - computed from current theme
const agentModes = () => [
  { id: "remi", name: "Remi", color: currentTheme().accentRed },
  { id: "plan", name: "Plan", color: currentTheme().accentGreen },
  { id: "build", name: "Build", color: currentTheme().accentOrange },
];

// Skills - computed from current theme
const skills = () => [
  { id: "vision", name: "Vision", description: "Screenshot analysis & comparison", color: currentTheme().accentPurple },
  { id: "git", name: "Git", description: "Version control operations", color: currentTheme().accentOrange },
  { id: "memory", name: "Memory", description: "7-layer memory system", color: currentTheme().accentBlue },
];

// Providers - computed from current theme
const providers = () => [
  { id: "nvidia", name: "Nvidia NIM", color: currentTheme().accentGreen },
  { id: "zai", name: "Z AI", color: currentTheme().accentBlue },
  { id: "openrouter", name: "OpenRouter", color: currentTheme().accentPurple },
];

// Model pricing per 1M tokens (input/output)
// Imported from providers.ts - kept here for UI display
// OpenRouter pricing from https://openrouter.ai/api/v1/models
const modelPricing: Record<string, { input: number; output: number; free?: boolean; subscription?: boolean }> = {
  // Nvidia NIM - FREE
  "kimi-k2.5": { input: 0, output: 0, free: true },
  "kimi-k2-instruct": { input: 0, output: 0, free: true },
  "kimi-k2-instruct-0905": { input: 0, output: 0, free: true },
  "deepseek-v3.2": { input: 0, output: 0, free: true },
  "nemotron-3-super": { input: 0, output: 0, free: true },
  "nemotron-safety": { input: 0, output: 0, free: true },
  "qwen-3.5-122b": { input: 0, output: 0, free: true },
  "qwen-3.5-397b": { input: 0, output: 0, free: true },
  // Z AI - Coding Subscription (UNLIMITED)
  "glm-4.7": { input: 0, output: 0, subscription: true },
  "glm-4.5-air": { input: 0, output: 0, subscription: true },
  "glm-5": { input: 0, output: 0, subscription: true },
  // OpenRouter - Actual pricing (per 1M tokens)
  // Using :free variants where available (marked with free: true)
  "grok-4.1": { input: 0.20, output: 0.50 },           // x-ai/grok-4.1-fast
  "minimax-m2.5": { input: 0, output: 0, free: true }, // minimax/minimax-m2.5:free
  "llama-3.1-8b": { input: 0.02, output: 0.05 },     // meta-llama/llama-3.1-8b-instruct
  "qwen-coder-3-480b": { input: 0, output: 0, free: true }, // qwen/qwen3-coder:free
  "gemini-2.5-flash": { input: 0.30, output: 2.50 },  // google/gemini-2.5-flash
  "qwen-3.5": { input: 0.26, output: 2.08 },           // qwen/qwen3.5-122b-a10b
};

const aiModels = [
  // Nvidia NIM - FREE Models
  { id: "kimi-k2.5", name: "Kimi K2.5", provider: "nvidia", color: theme().accentBlue },
  { id: "kimi-k2-instruct", name: "Kimi K2 Instruct", provider: "nvidia", color: theme().accentBlue },
  { id: "kimi-k2-instruct-0905", name: "Kimi K2 Instruct 0905", provider: "nvidia", color: theme().accentBlue },
  { id: "deepseek-v3.2", name: "DeepSeek V3.2", provider: "nvidia", color: theme().accentPurple },
  { id: "nemotron-3-super", name: "Nemotron 3 Super", provider: "nvidia", color: theme().accentYellow },
  { id: "nemotron-safety", name: "Nemotron Safety Guard", provider: "nvidia", color: theme().accentOrange },
  { id: "qwen-3.5-122b", name: "Qwen 3.5 122B", provider: "nvidia", color: theme().accentGreen },
  { id: "qwen-3.5-397b", name: "Qwen 3.5 397B", provider: "nvidia", color: theme().accentGreen },

  // Z AI - Coding Subscription (GLM Models)
  { id: "glm-4.7", name: "GLM 4.7", provider: "zai", color: theme().accentGreen },
  { id: "glm-4.5-air", name: "GLM 4.5 Air", provider: "zai", color: theme().accentGreen },
  { id: "glm-5", name: "GLM 5", provider: "zai", color: theme().accentGreen },

  // OpenRouter - Main Models
  { id: "grok-4.1", name: "Grok 4.1", provider: "openrouter", color: theme().accentOrange },
  { id: "minimax-m2.5", name: "Minimax M2.5", provider: "openrouter", color: theme().accentPurple },
  { id: "llama-3.1-8b", name: "Llama 3.1 8B", provider: "openrouter", color: theme().accentBlue },
  { id: "qwen-coder-3-480b", name: "Qwen Coder 3 480B", provider: "openrouter", color: theme().accentGreen },
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", provider: "openrouter", color: theme().accentYellow },
  { id: "qwen-3.5", name: "Qwen 3.5", provider: "openrouter", color: theme().accentGreen },
];

interface ThinkingStep {
  status: "pending" | "running" | "complete";
  description: string;
  timestamp: string;
}

interface WorkItem {
  type: "thinking" | "edit" | "create" | "delete" | "command" | "complete" | "error";
  content?: string;
  file?: string;
  description?: string;
  action?: "create" | "modify" | "delete" | "analyze";
  lines?: number;
  additions?: number;
  deletions?: number;
  output?: string;
  exitCode?: number;
  diff?: CodeDiff;
  steps?: ThinkingStep[];
}

interface CodeDiff {
  file: string;
  oldLines: { line: number; content: string }[];
  newLines: { line: number; content: string }[];
}

interface Message {
  id: number;
  role: "user" | "assistant" | "system";
  content: string;
  agent?: string;
  agentFullName?: string;
  model?: string;
  timestamp: string;
  responseTime?: string;
  status?: "complete" | "interrupted" | "thinking";
  attachments?: { type: string; label: string; color: string }[];
  work?: WorkItem[];
}

function WZRDOpencodeClone() {
  const [currentMode, setCurrentMode] = createSignal("remi");
  const [currentModel, setCurrentModel] = createSignal("kimi-k2.5");
  const [input, setInput] = createSignal("");
  const [gatewayConnected, setGatewayConnected] = createSignal(false);
  const [nimConnected, setNimConnected] = createSignal(false);
  const [nimStatusMessage, setNimStatusMessage] = createSignal("Checking...");

  // WebSocket connection state
  const [wsConnected, setWsConnected] = createSignal(false);
  const [wsStatus, setWsStatus] = createSignal("Connecting...");
  let wsClient: WZRDWebSocketClient | null = null;
  const [sessionTitle, setSessionTitle] = createSignal("Remi v2 capability inquiry");
  const [vision] = createSignal(new VisionSkill());
const [contextTokens, setContextTokens] = createSignal(0);
const [totalTokens, setTotalTokens] = createSignal(128000);
const [cost, setCost] = createSignal(0);

// Token budget alerts
const [budgetWarningShown, setBudgetWarningShown] = createSignal(false);
const [budgetCriticalShown, setBudgetCriticalShown] = createSignal(false);
const WARNING_THRESHOLD = 0.8; // 80%
const CRITICAL_THRESHOLD = 0.95; // 95%
  const [isProcessing, setIsProcessing] = createSignal(false);
  const [thinkingDots, setThinkingDots] = createSignal("");
  const [streamingContent, setStreamingContent] = createSignal("");
  const [streamingWork, setStreamingWork] = createSignal<WorkItem[]>([]);
  const [showStreaming, setShowStreaming] = createSignal(false);
  const [currentStreamingId, setCurrentStreamingId] = createSignal<number | null>(null);
  let requestStartTime = 0; // Track when request starts for response time calculation
  const [messages, setMessages] = createSignal<Message[]>([]);
  const [showCommands, setShowCommands] = createSignal(false);
  const [autoScroll, setAutoScroll] = createSignal(true);
  const [inputHistory, setInputHistory] = createSignal<string[]>([]);
  const [historyIndex, setHistoryIndex] = createSignal(-1);
  const [showCommandSuggestions, setShowCommandSuggestions] = createSignal(false);
  const [commandFilter, setCommandFilter] = createSignal("");
  const [selectedCommandIndex, setSelectedCommandIndex] = createSignal(0);
  const [fileTree, setFileTree] = createSignal<string>("");
  const [showModelPicker, setShowModelPicker] = createSignal(false);
  const [modelPickerFilter, setModelPickerFilter] = createSignal("");
  const [selectedModelIndex, setSelectedModelIndex] = createSignal(0);

  // Mode picker state
  const [showModePicker, setShowModePicker] = createSignal(false);
  const [selectedModeIndex, setSelectedModeIndex] = createSignal(0);

// Session picker state
const [showSessionPicker, setShowSessionPicker] = createSignal(false);
const [sessionPickerFilter, setSessionPickerFilter] = createSignal("");
const [selectedSessionIndex, setSelectedSessionIndex] = createSignal(0);
const [availableSessions, setAvailableSessions] = createSignal<{id: string; title: string; updatedAt: string}[]>([]);

// Theme picker state
const [showThemePicker, setShowThemePicker] = createSignal(false);
const [selectedThemeIndex, setSelectedThemeIndex] = createSignal(0);

// File picker state
  const [showFilePicker, setShowFilePicker] = createSignal(false);
  const [filePickerFilter, setFilePickerFilter] = createSignal("");
  const [selectedFileIndex, setSelectedFileIndex] = createSignal(0);
  const [availableFiles, setAvailableFiles] = createSignal<string[]>([]);
  const [filePickerMode, setFilePickerMode] = createSignal<"read" | "edit">("read");

const [activeOverlay, setActiveOverlay] = createSignal<"none" | "model" | "mode" | "session" | "file" | "apikey" | "rename" | "theme">("none");

// API key input state
const [showApiKeyInput, setShowApiKeyInput] = createSignal(false);
const [apiKeyProvider, setApiKeyProvider] = createSignal<string>("");

// Attached files state
const [attachedFiles, setAttachedFiles] = createSignal<{path: string; content: string; size: number}[]>([]);
const MAX_ATTACH_SIZE = 100000; // 100KB max per file
  const [apiKeyInput, setApiKeyInput] = createSignal("");
  
  // Provider view state (for Ctrl+A in model picker)
  const [showProviderView, setShowProviderView] = createSignal(false);
  const [selectedProviderIndex, setSelectedProviderIndex] = createSignal(0);
  
  // Model picker scroll state
  const [modelPickerScrollOffset, setModelPickerScrollOffset] = createSignal(0);
  const maxVisibleModels = 15;
  const dimensions = useTerminalDimensions();

// Expanded sections state (for thinking blocks, work items)
const [expandedThinking, setExpandedThinking] = createSignal<Set<number>>(new Set());
const [expandedWorkItems, setExpandedWorkItems] = createSignal<Set<number>>(new Set());

// Phase 6: Extended Thinking toggle
  const [extendedThinking, setExtendedThinking] = createSignal(false);

  // Verbose mode toggle - shows thinking and work items
  const [verboseMode, setVerboseMode] = createSignal(false);

  // Phase 6: Session rename state
const [renameInput, setRenameInput] = createSignal("");
const [showRenameInput, setShowRenameInput] = createSignal(false);

// Sidebar page state (info vs files)
const [sidebarPage, setSidebarPage] = createSignal<"info" | "files">("info");

// File browser state
const [fileBrowserPath, setFileBrowserPath] = createSignal<string>(".");
const [fileBrowserEntries, setFileBrowserEntries] = createSignal<{name: string; path: string; isDirectory: boolean; depth: number}[]>([]);
const [expandedDirs, setExpandedDirs] = createSignal<Set<string>>(new Set());
const [browserSelectedIndex, setBrowserSelectedIndex] = createSignal<number>(0);
const [fileBrowserLoaded, setFileBrowserLoaded] = createSignal(false);
const [isAttachingFile, setIsAttachingFile] = createSignal(false);

// Phase 6: Custom skills registry
interface CustomSkill {
  name: string;
  description: string;
  pattern: RegExp;
  handler: (args: string[]) => Promise<string>;
}
const [customSkills, setCustomSkills] = createSignal<CustomSkill[]>([]);
const [skillsLoaded, setSkillsLoaded] = createSignal(false);

// Phase 6: CLAUDE.md config
interface ClaudeMdConfig {
  projectName: string;
  description: string;
  instructions: string[];
  rules: string[];
  context: Record<string, string>;
}
const [claudeMdConfig, setClaudeMdConfig] = createSignal<ClaudeMdConfig | null>(null);

  // Animate thinking dots
  createEffect(() => {
    if (!isProcessing()) {
      setThinkingDots("");
      return;
    }
    const dots = [".", "..", "..."];
    let index = 0;
    const interval = setInterval(() => {
      setThinkingDots(dots[index]!);
      index = (index + 1) % dots.length;
    }, 500);
    return () => clearInterval(interval);
  });

  // Check NIM status on mount
  createEffect(() => {
    checkAIStatus().then(status => {
      setNimConnected(status.connected);
      setNimStatusMessage(status.message);
    });
  });

  // Load most recent session on mount
  createEffect(() => {
    const recentSession = getMostRecentSession();
    if (recentSession && recentSession.messages.length > 0) {
      setMessages(recentSession.messages);
      setSessionTitle(recentSession.title);
      setContextTokens(recentSession.contextTokens);
      setCost(recentSession.cost);
      if (recentSession.model) setCurrentModel(recentSession.model);
      if (recentSession.mode) setCurrentMode(recentSession.mode);
    }
  });

  // Auto-save every 3 seconds
  createEffect(() => {
    const interval = setInterval(() => {
      autoSave(messages(), sessionTitle(), contextTokens(), totalTokens(), cost(), currentModel(), currentMode(), undefined, 3000);
    }, 3000);
    return () => clearInterval(interval);
  });

// Show command dropdown when typing /
createEffect(() => {
  const currentInput = input();
  if (currentInput.startsWith("/")) {
    const filter = currentInput.slice(1).toLowerCase();
    setCommandFilter(filter);
    setShowCommandSuggestions(true);
    setSelectedCommandIndex(0);
  } else {
    setShowCommandSuggestions(false);
    setCommandFilter("");
  }
});

// Phase 6: Load CLAUDE.md on mount
createEffect(() => {
  loadClaudeMd();
});

  // Phase 6: Load custom skills on mount
  createEffect(() => {
    if (!skillsLoaded()) {
      loadCustomSkills();
      setSkillsLoaded(true);
    }
  });

  // WebSocket connection setup
  onMount(() => {
    // Initialize WebSocket client
    wsClient = new WZRDWebSocketClient({
      serverUrl: "ws://100.118.174.102:5666",
      autoReconnect: true,
      reconnectDelay: 3000,
      maxReconnectAttempts: 10,
      pingInterval: 30000,
    });

    // Listen for connection events
    wsClient.on("connected", () => {
      setWsConnected(true);
      setWsStatus("Connected");
      console.log("[WebSocket] Connected to server");
    });

    wsClient.on("disconnected", () => {
      setWsConnected(false);
      setWsStatus("Disconnected");
      console.log("[WebSocket] Disconnected from server");
    });

    wsClient.on("reconnecting", (attempt: number) => {
      setWsConnected(false);
      setWsStatus(`Reconnecting (${attempt})...`);
      console.log(`[WebSocket] Reconnecting attempt ${attempt}`);
    });

    wsClient.on("error", (error: Error) => {
      console.error("[WebSocket] Error:", error.message);
    });

    // Handle incoming messages from server
    wsClient.on("agent:started", () => {
      setIsProcessing(true);
      setShowStreaming(true);
    });

    wsClient.on("skills:loading", () => {
      // Skills are loading
      console.log("[WebSocket] Loading skills...");
    });

    wsClient.on("chunk", (content: string) => {
      // Streaming chunk received - update the thinking message
      const streamingId = currentStreamingId();
      if (!streamingId) return;

      setStreamingContent(prev => {
        const newContent = prev + content;
        // Update the message in the messages array
        setMessages(msgs => msgs.map(m =>
          m.id === streamingId
            ? { ...m, content: newContent }
            : m
        ));
        return newContent;
      });
    });

wsClient.on("skills:loaded", () => {
    // Skills loaded
    console.log("[WebSocket] Skills loaded");
  });

  // Accumulate work items during streaming
  let accumulatedWork: WorkItem[] = [];

  wsClient.on("thinking", (steps: ThinkingStep[]) => {
    // Server-sent thinking steps
    const streamingId = currentStreamingId();
    if (!streamingId) return;

    // Add or update thinking work item
    const existingThinkingIndex = accumulatedWork.findIndex(w => w.type === "thinking");
    if (existingThinkingIndex >= 0) {
      accumulatedWork[existingThinkingIndex]!.steps = steps;
    } else {
      accumulatedWork.push({ type: "thinking", steps });
    }

    // Update message with thinking steps
    setMessages(msgs => msgs.map(m =>
      m.id === streamingId
        ? { ...m, work: [...accumulatedWork] }
        : m
    ));
  });

  wsClient.on("work", (work: WorkItem[]) => {
    // Server-sent work items (file edits, creates, etc.)
    const streamingId = currentStreamingId();
    if (!streamingId) return;

    // Accumulate work items
    accumulatedWork.push(...work);

    // Update message with work items
    setMessages(msgs => msgs.map(m =>
      m.id === streamingId
        ? { ...m, work: [...accumulatedWork] }
        : m
    ));
  });

  wsClient.on("complete", (data: { content: string; tokensUsed?: number; latency?: number; work?: WorkItem[] }) => {
    // Reset accumulated work for next message
    accumulatedWork = [];
    // Final response received
    const endTime = Date.now();
    const responseTimeSec = ((endTime - requestStartTime) / 1000).toFixed(1);
    const streamingId = currentStreamingId();

    setMessages(prev => {
      // Update the thinking message to complete
      return prev.map(m =>
        m.id === streamingId
        ? {
            ...m,
            content: data.content || m.content,
            responseTime: `${responseTimeSec}s`,
            status: "complete",
            work: data.work || m.work
          }
        : m
      );
    });

    setIsProcessing(false);
    setShowStreaming(false);
    setStreamingContent("");
    setCurrentStreamingId(null);

    // Update tokens if provided
    if (data.tokensUsed) {
      setContextTokens(prev => prev + data.tokensUsed!);
    }
  });

    wsClient.on("typing", (isTyping: boolean) => {
      // Show/hide typing indicator
      setShowStreaming(isTyping);
    });

    wsClient.on("message", (message: WZRDMessage) => {
      if (message.type === "message" && message.content) {
        setMessages(prev => [...prev, {
          id: prev.length + 1,
          role: "assistant",
          content: message.content!,
          agent: currentMode(),
          agentFullName: "Remi-V2",
          model: currentModel(),
          timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }),
          status: "complete"
        }]);
      }
    });

    // Connect to server
    wsClient.connect().catch((error) => {
      console.error("[WebSocket] Failed to connect:", error.message);
      setWsStatus("Connection failed");
    });
  });

  onCleanup(() => {
    // Cleanup WebSocket connection on unmount
    if (wsClient) {
      wsClient.disconnect();
      wsClient = null;
    }
  });

  // Phase 6: Load CLAUDE.md configuration
async function loadClaudeMd(): Promise<void> {
  try {
    const { existsSync, readFileSync } = await import("fs");
    const { join } = await import("path");
    const claudeMdPath = join(process.cwd(), "CLAUDE.md");

    if (!existsSync(claudeMdPath)) return;

    const content = readFileSync(claudeMdPath, "utf-8");
    const config = parseClaudeMd(content);
    setClaudeMdConfig(config);
  } catch {
    // CLAUDE.md not found
  }
}

// Phase 6: Parse CLAUDE.md content
function parseClaudeMd(content: string): ClaudeMdConfig {
  const config: ClaudeMdConfig = {
    projectName: "",
    description: "",
    instructions: [],
    rules: [],
    context: {},
  };

  const lines = content.split("\n");
  let currentSection = "";

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("# ") && !config.projectName) {
      config.projectName = trimmed.slice(2).trim();
      continue;
    }
    if (trimmed.startsWith("## ")) {
      currentSection = trimmed.slice(3).toLowerCase();
      continue;
    }
    if (trimmed) {
      if (currentSection.includes("description")) {
        config.description += trimmed + " ";
      } else if (currentSection.includes("instruction")) {
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          config.instructions.push(trimmed.slice(2));
        }
      } else if (currentSection.includes("rule")) {
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          config.rules.push(trimmed.slice(2));
        }
      } else if (currentSection.includes("context")) {
        const match = trimmed.match(/^([^:]+):\s*(.+)$/);
        if (match && match[1] && match[2]) {
          config.context[match[1]] = match[2];
        }
      }
    }
  }

  return config;
}

// Phase 6: Load custom skills from .wzrd/skills/
async function loadCustomSkills(): Promise<void> {
  try {
    const { existsSync, readdirSync, readFileSync } = await import("fs");
    const { join } = await import("path");
    const { homedir } = await import("os");

    const skillsDir = join(homedir(), ".wzrd", "skills");
    if (!existsSync(skillsDir)) return;

    const files = readdirSync(skillsDir).filter(f => f.endsWith(".json"));
    const loadedSkills: CustomSkill[] = [];

    for (const file of files) {
      try {
        const content = readFileSync(join(skillsDir, file), "utf-8");
        const skillDef = JSON.parse(content);

        if (skillDef.name && skillDef.pattern && skillDef.description) {
          loadedSkills.push({
            name: skillDef.name,
            description: skillDef.description,
            pattern: new RegExp(skillDef.pattern, "i"),
            handler: async (args: string[]) => {
              if (skillDef.command) {
                const result = await shellSkill.execute(skillDef.command + " " + args.join(" "));
                return result.success ? (result.stdout || "Done") : (result.stderr || "Failed");
              }
              return skillDef.response || "Skill executed";
            },
          });
        }
      } catch {
        // Skip invalid skill files
      }
    }

    setCustomSkills(loadedSkills);
  } catch {
    // Skills directory doesn't exist
  }
}

// Phase 6: Process @ references in input
async function processAtReferences(text: string): Promise<{ processedText: string; atFiles: {path: string; content: string}[] }> {
  const atPattern = /@([a-zA-Z0-9_\-\/.]+)/g;
  const matches = [...text.matchAll(atPattern)];
  const atFiles: {path: string; content: string}[] = [];
  let processedText = text;

  for (const match of matches) {
    const filePath = match[1];
    if (!filePath) continue;

    try {
      const result = await fileSkill.readFile(filePath);
      if (result.success && result.content) {
        atFiles.push({ path: filePath, content: result.content });
        processedText = processedText.replace(match[0], `[${filePath}](${filePath})`);
      }
    } catch {
      // File not found
    }
  }

  return { processedText, atFiles };
}

// Build file browser entries recursively
async function buildFileBrowserEntries(
  dirPath: string, 
  depth: number,
  expanded: Set<string>
): Promise<{name: string; path: string; isDirectory: boolean; depth: number}[]> {
  const entries: {name: string; path: string; isDirectory: boolean; depth: number}[] = [];
  
  try {
    const { readdirSync, statSync } = await import("fs");
    const { join } = await import("path");
    
    const fullPath = join(process.cwd(), dirPath);
    const items = readdirSync(fullPath);
    
    // Sort: directories first, then files
    const sorted = items
      .filter(name => !name.startsWith(".") && name !== "node_modules" && name !== "dist")
      .sort((a, b) => {
        const aPath = join(fullPath, a);
        const bPath = join(fullPath, b);
        const aIsDir = statSync(aPath).isDirectory();
        const bIsDir = statSync(bPath).isDirectory();
        if (aIsDir && !bIsDir) return -1;
        if (!aIsDir && bIsDir) return 1;
        return a.localeCompare(b);
      });
    
    for (const name of sorted) {
      const itemPath = join(dirPath, name);
      const fullItemPath = join(fullPath, name);
      const isDir = statSync(fullItemPath).isDirectory();
      
      entries.push({
        name,
        path: itemPath,
        isDirectory: isDir,
        depth
      });
      
      // If directory is expanded, add its children
      if (isDir && expanded.has(itemPath)) {
        const children = await buildFileBrowserEntries(itemPath, depth + 1, expanded);
        entries.push(...children);
      }
    }
  } catch {
    // Directory not accessible
  }
  
  return entries;
}

// Keyboard shortcuts
  useKeyboard((key) => {
    // Global ESC - interrupt processing if active
    if (key.name === "escape" && isProcessing()) {
      setIsProcessing(false);
      setMessages(prev => [...prev, {
        id: prev.length + 1,
        role: "system",
        content: "⚠️ Interrupted by user",
        timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
      }]);
      return;
    }

    // Handle model picker FIRST (before other checks)
    if (showModelPicker()) {
      // Get filtered models
      const filteredModels = aiModels.filter(m =>
        m.name.toLowerCase().includes(modelPickerFilter().toLowerCase()) ||
        m.id.toLowerCase().includes(modelPickerFilter().toLowerCase())
      );
      
      // Up arrow - navigate up in model picker
      if (key.name === "up") {
        const currentIdx = selectedModelIndex();
        if (currentIdx > 0) {
          setSelectedModelIndex(currentIdx - 1);
          // Auto-scroll if needed
          if (currentIdx - 1 < modelPickerScrollOffset()) {
            setModelPickerScrollOffset(modelPickerScrollOffset() - 1);
          }
        }
        return;
      }

      // Down arrow - navigate down in model picker
      if (key.name === "down") {
        const currentIdx = selectedModelIndex();
        if (currentIdx < filteredModels.length - 1) {
          setSelectedModelIndex(currentIdx + 1);
          // Auto-scroll if needed
          if (currentIdx + 1 >= modelPickerScrollOffset() + maxVisibleModels) {
            setModelPickerScrollOffset(modelPickerScrollOffset() + 1);
          }
        }
        return;
      }

      // Enter - select model
      if (key.name === "return") {
        if (filteredModels.length > 0) {
          const selectedModel = filteredModels[selectedModelIndex()] || filteredModels[0];
          if (selectedModel) {
            // Check if provider needs API key
            const providerConfig = aiProviders[selectedModel.provider as keyof typeof aiProviders];
            const envKey = providerConfig ? process.env[providerConfig.apiKeyEnv] : undefined;
            
            if (!envKey && selectedModel.provider !== "nvidia") {
              // Show API key input for this provider
              setApiKeyProvider(selectedModel.provider);
              setApiKeyInput("");
              setShowApiKeyInput(true);
              setShowModelPicker(false);
              setActiveOverlay("apikey");
              return;
            }
            
            setCurrentModel(selectedModel.id);
            aiClient.setModel(selectedModel.id);
            setMessages(prev => [...prev, {
              id: prev.length + 1,
              role: "system",
              content: `Switched to ${selectedModel.name} (${selectedModel.provider})`,
              timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
            }]);
          }
        }
        setShowModelPicker(false);
        setModelPickerScrollOffset(0);
        setActiveOverlay("none");
        return;
      }

      // Ctrl+A - switch to provider view
      if (key.ctrl && key.name === "a") {
        setShowProviderView(true);
        setShowModelPicker(false);
        setActiveOverlay("none");
        return;
      }

// Escape - close model picker
      if (key.name === "escape") {
        setShowModelPicker(false);
        setModelPickerScrollOffset(0);
        setModelPickerFilter("");
        setActiveOverlay("none");
        return;
      }

      // Backspace - delete last character from search
      if (key.name === "backspace") {
        setModelPickerFilter(prev => prev.slice(0, -1));
        setModelPickerScrollOffset(0);
        return;
      }

      // Regular character - add to search
      if (key.name && key.name.length === 1) {
        // Check if it's a printable character (not a control character)
        const char = key.name;
        if (char >= ' ' && char <= '~') {
          setModelPickerFilter(prev => prev + char);
          setModelPickerScrollOffset(0);
          return;
        }
      }

// Ignore other keys
      return;
    }

    // Handle provider view
    if (showProviderView()) {
      // Up arrow - navigate up
      if (key.name === "up") {
        const currentIdx = selectedProviderIndex();
        if (currentIdx > 0) {
          setSelectedProviderIndex(currentIdx - 1);
        }
        return;
      }

      // Down arrow - navigate down
      if (key.name === "down") {
        const providerList = Object.values(aiProviders);
        const currentIdx = selectedProviderIndex();
        if (currentIdx < providerList.length - 1) {
          setSelectedProviderIndex(currentIdx + 1);
        }
        return;
      }

      // Enter - select provider
      if (key.name === "return") {
        const providerList = Object.values(aiProviders);
        const selectedProvider = providerList[selectedProviderIndex()];
        if (selectedProvider) {
          // Check if provider needs API key (from env or config)
          const envKey = process.env[selectedProvider.apiKeyEnv];
          const savedKey = getApiKey(selectedProvider.id);
          
          if (!envKey && !savedKey && selectedProvider.id !== "nvidia") {
            // Show API key input for this provider
            setApiKeyProvider(selectedProvider.id);
            setApiKeyInput("");
            setShowApiKeyInput(true);
            setShowProviderView(false);
            setActiveOverlay("apikey");
            return;
          }
          
          // Show models for this provider
          setShowProviderView(false);
          setShowModelPicker(true);
          setActiveOverlay("model");
          // Filter to first model of this provider
          const firstModel = aiModels.find(m => m.provider === selectedProvider.id);
          if (firstModel) {
            const modelIdx = aiModels.findIndex(m => m.id === firstModel.id);
            setSelectedModelIndex(modelIdx);
          }
        }
        return;
      }

      // Escape - close provider view
      if (key.name === "escape") {
        setShowProviderView(false);
        setShowModelPicker(true);
        setActiveOverlay("model");
        return;
      }

      // Ignore all other keys
      return;
    }

    // Handle API key input
    if (showApiKeyInput()) {
      if (key.name === "return") {
        // Save API key
        const keyValue = apiKeyInput().trim();
        if (keyValue) {
          const provider = apiKeyProvider();
          const config = aiProviders[provider as keyof typeof aiProviders];
          if (config) {
            // Save to persistent config
            import("./config").then(({ setApiKey }) => {
              setApiKey(provider, keyValue);
            });
            setMessages(prev => [...prev, {
              id: prev.length + 1,
              role: "system",
              content: `API key saved for ${config.name}. Select a model.`,
              timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
            }]);
          }
        }
        // Return to model picker instead of closing
        setShowApiKeyInput(false);
        setShowModelPicker(true);
        setActiveOverlay("model");
        return;
      }
      if (key.name === "escape") {
        setShowApiKeyInput(false);
        setActiveOverlay("none");
        return;
      }
      // Let other keys pass through for typing
      return;
    }

    // Handle mode picker
    if (showModePicker()) {
      const modes = agentModes();
      if (key.name === "up") {
        const currentIdx = selectedModeIndex();
        if (currentIdx > 0) setSelectedModeIndex(currentIdx - 1);
        return;
      }
      if (key.name === "down") {
        const currentIdx = selectedModeIndex();
        if (currentIdx < modes.length - 1) setSelectedModeIndex(currentIdx + 1);
        return;
      }
      if (key.name === "return") {
        const selectedMode = modes[selectedModeIndex()];
        if (selectedMode) {
          setCurrentMode(selectedMode.id);
          setMessages(prev => [...prev, {
            id: prev.length + 1,
            role: "system",
            content: `Switched to ${selectedMode.name} mode`,
            timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
          }]);
        }
        setShowModePicker(false);
        setActiveOverlay("none");
        return;
      }
      if (key.name === "escape") {
        setShowModePicker(false);
        setActiveOverlay("none");
        return;
      }
      return;
    }

    // Handle session picker
    if (showSessionPicker()) {
      if (key.name === "up") {
        const currentIdx = selectedSessionIndex();
        if (currentIdx > 0) setSelectedSessionIndex(currentIdx - 1);
        return;
      }
      if (key.name === "down") {
        const sessions = availableSessions();
        const currentIdx = selectedSessionIndex();
        if (currentIdx < sessions.length - 1) setSelectedSessionIndex(currentIdx + 1);
        return;
      }
      if (key.name === "return") {
        const sessions = availableSessions();
        const selectedSession = sessions[selectedSessionIndex()];
        if (selectedSession) {
          const session = loadSession(selectedSession.id);
          if (session) {
            setMessages(session.messages as Message[]);
            setSessionTitle(session.title);
            setMessages(prev => [...prev, {
              id: prev.length + 1,
              role: "system",
              content: `Loaded session: "${session.title}"`,
              timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
            }]);
          }
        }
        setShowSessionPicker(false);
        setActiveOverlay("none");
        return;
      }
      if (key.name === "escape") {
        setShowSessionPicker(false);
        setActiveOverlay("none");
        return;
      }
      return;
    }

    // Handle theme picker
    if (showThemePicker()) {
      const themeOptions = ["dark", "light"];
      if (key.name === "up") {
        const currentIdx = selectedThemeIndex();
        if (currentIdx > 0) setSelectedThemeIndex(currentIdx - 1);
        return;
      }
      if (key.name === "down") {
        const currentIdx = selectedThemeIndex();
        if (currentIdx < themeOptions.length - 1) setSelectedThemeIndex(currentIdx + 1);
        return;
      }
      if (key.name === "return") {
        const selectedThemeName = themeOptions[selectedThemeIndex()];
        if (selectedThemeName) {
          const newTheme = themes[selectedThemeName];
          if (newTheme) {
            setCurrentTheme(newTheme);
            setMessages(prev => [...prev, {
              id: prev.length + 1,
              role: "system",
              content: `Switched to ${selectedThemeName} theme`,
              timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
            }]);
          }
        }
        setShowThemePicker(false);
        setActiveOverlay("none");
        return;
      }
      if (key.name === "escape") {
        setShowThemePicker(false);
        setActiveOverlay("none");
        return;
      }
      return;
    }

    // Handle file picker
    if (showFilePicker()) {
      if (key.name === "up") {
        const currentIdx = selectedFileIndex();
        if (currentIdx > 0) setSelectedFileIndex(currentIdx - 1);
        return;
      }
      if (key.name === "down") {
        const files = availableFiles();
        const currentIdx = selectedFileIndex();
        if (currentIdx < files.length - 1) setSelectedFileIndex(currentIdx + 1);
        return;
      }
      if (key.name === "return") {
        const files = availableFiles();
        const selectedFile = files[selectedFileIndex()];
        if (selectedFile) {
          if (filePickerMode() === "read") {
            // Handle read file
            fileSkill.readFile(selectedFile).then((result: { success: boolean; content?: string; error?: string }) => {
              if (result.success && result.content) {
                setMessages(prev => [...prev, {
                  id: prev.length + 1,
                  role: "assistant",
                  content: `File: ${selectedFile}\n\n\`\`\`${result.content}\`\`\``,
                  agent: currentMode(),
                  agentFullName: "Remi-V2",
                  model: currentModel(),
                  timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }),
                  status: "complete"
                }]);
              } else {
                setMessages(prev => [...prev, {
                  id: prev.length + 1,
                  role: "system",
                  content: `Error reading file: ${result.error}`,
                  timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
                }]);
              }
            });
          } else {
            // Handle edit file - just show message for now
            setMessages(prev => [...prev, {
              id: prev.length + 1,
              role: "system",
              content: `Selected file for editing: ${selectedFile}. Use /edit ${selectedFile} <old> <new>`,
              timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
            }]);
          }
        }
        setShowFilePicker(false);
        setActiveOverlay("none");
        return;
      }
      if (key.name === "escape") {
        setShowFilePicker(false);
        setActiveOverlay("none");
        return;
      }
      return;
    }

    // Tab switches agent modes (only when not in command completion)
    if (key.name === "tab" && !input().startsWith("/")) {
      const modes = agentModes();
      const currentIdx = modes.findIndex(m => m.id === currentMode());
      const nextIdx = currentIdx >= 0 ? (currentIdx + 1) % modes.length : 0;
      setCurrentMode(modes[nextIdx]!.id);
      return;
    }

    // Ctrl+P toggles command palette
    if (key.ctrl && key.name === "p") {
      setShowCommands(!showCommands());
      return;
    }

    // Phase 6: Ctrl+T toggles extended thinking
    if (key.ctrl && key.name === "t") {
      const modelSupportsThinking = aiModels.find(m => m.id === currentModel())?.id === "kimi-k2.5" || 
                                     aiModels.find(m => m.id === currentModel())?.id === "deepseek-v3.2";
      if (modelSupportsThinking) {
        setExtendedThinking(!extendedThinking());
        setMessages(prev => [...prev, {
          id: prev.length + 1,
          role: "system",
          content: `Extended thinking ${extendedThinking() ? "enabled" : "disabled"}`,
          timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
        }]);
      } else {
        setMessages(prev => [...prev, {
          id: prev.length + 1,
          role: "system",
          content: "Current model doesn't support extended thinking. Try Kimi K2.5 or DeepSeek V3.2.",
          timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
        }]);
      }
      return;
    }

    // Ctrl+F switches to Files tab
    if (key.ctrl && key.name === "f") {
      setSidebarPage(sidebarPage() === "info" ? "files" : "info");
      return;
    }

    // File browser navigation (when on files page and no overlay active)
    if (sidebarPage() === "files" && fileBrowserLoaded() && activeOverlay() === "none" && !showCommands()) {
      const entries = fileBrowserEntries();
      const currentIdx = browserSelectedIndex();
      
      if (key.name === "up" || key.name === "k") {
        if (currentIdx > 0) {
          setBrowserSelectedIndex(currentIdx - 1);
        }
        return;
      }
      
      if (key.name === "down" || key.name === "j") {
        if (currentIdx < entries.length - 1) {
          setBrowserSelectedIndex(currentIdx + 1);
        }
        return;
      }
      
      if (key.name === "return" || key.name === "space" || key.name === "l") {
        // Prevent multiple rapid attachments
        if (isAttachingFile()) {
          return;
        }
        
        const selected = entries[currentIdx];
        if (selected) {
          if (selected.isDirectory) {
            // Toggle directory expansion
            const newExpanded = new Set(expandedDirs());
            if (newExpanded.has(selected.path)) {
              newExpanded.delete(selected.path);
            } else {
              newExpanded.add(selected.path);
            }
            setExpandedDirs(newExpanded);
            // Rebuild entries with new expansion state
            buildFileBrowserEntries(".", 0, newExpanded).then(entries => {
              setFileBrowserEntries(entries);
            });
          } else {
            // Read file - check if already attached first
            const alreadyAttached = attachedFiles().some(f => f.path === selected.path);
            if (alreadyAttached) {
              setMessages(prev => [...prev, {
                id: prev.length + 1,
                role: "system",
                content: `File already attached: ${selected.path}`,
                timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
              }]);
              return;
            }
            
            // Set lock to prevent multiple attachments
            setIsAttachingFile(true);
            
            fileSkill.readFile(selected.path).then(result => {
              if (result.success && result.content) {
                const content = result.content;
                setAttachedFiles(prev => [...prev, { 
                  path: selected.path, 
                  content: content, 
                  size: content.length 
                }]);
                setMessages(prev => [...prev, {
                  id: prev.length + 1,
                  role: "system",
                  content: `Attached: ${selected.path}`,
                  timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
                }]);
              }
              // Release lock after a short delay
              setTimeout(() => setIsAttachingFile(false), 500);
            }).catch(() => {
              setIsAttachingFile(false);
            });
          }
        }
        return;
      }
      
      // h to go back/collapse
      if (key.name === "h") {
        const selected = entries[currentIdx];
        if (selected && selected.isDirectory && expandedDirs().has(selected.path)) {
          const newExpanded = new Set(expandedDirs());
          newExpanded.delete(selected.path);
          setExpandedDirs(newExpanded);
          buildFileBrowserEntries(".", 0, newExpanded).then(entries => {
            setFileBrowserEntries(entries);
          });
        }
        return;
      }
    }

    // Up arrow - command suggestions or input history
    if (key.name === "up") {
      if (showCommandSuggestions()) {
        const matches = Object.keys(commands).filter(cmd =>
          cmd.toLowerCase().startsWith("/" + commandFilter().toLowerCase())
        );
        const currentIdx = selectedCommandIndex();
        if (currentIdx > 0) {
          setSelectedCommandIndex(currentIdx - 1);
        }
        return;
      }
      const history = inputHistory();
      const currentIdx = historyIndex();
      if (currentIdx < history.length - 1) {
        const newIdx = currentIdx + 1;
        setHistoryIndex(newIdx);
        setInput(history[history.length - 1 - newIdx] || "");
      }
      return;
    }

    // Down arrow - command suggestions or input history forward
    if (key.name === "down") {
      if (showCommandSuggestions()) {
        const matches = Object.keys(commands).filter(cmd =>
          cmd.toLowerCase().startsWith("/" + commandFilter().toLowerCase())
        );
        const currentIdx = selectedCommandIndex();
        if (currentIdx < matches.length - 1) {
          setSelectedCommandIndex(currentIdx + 1);
        }
        return;
      }
      const history = inputHistory();
      const currentIdx = historyIndex();
      if (currentIdx > 0) {
        const newIdx = currentIdx - 1;
        setHistoryIndex(newIdx);
        setInput(history[history.length - 1 - newIdx] || "");
      } else if (currentIdx === 0) {
        setHistoryIndex(-1);
        setInput("");
      }
      return;
    }

    // Enter to select command from dropdown
      if (key.name === "return" && showCommandSuggestions()) {
        const matches = Object.keys(commands).filter(cmd =>
          cmd.toLowerCase().startsWith("/" + commandFilter().toLowerCase())
        );
        if (matches.length > 0) {
          const selectedIndex = selectedCommandIndex();
          const selected = matches[selectedIndex] ?? matches[0];
          if (!selected) return;
          
          setShowCommandSuggestions(false);
          setInput("");

          // Check if command needs an overlay
          if (selected === "/model") {
          setActiveOverlay("model");
          setShowModelPicker(true);
          setModelPickerFilter("");
          setSelectedModelIndex(0);
        } else if (selected === "/mode") {
          setActiveOverlay("mode");
          setShowModePicker(true);
          const modes = agentModes();
          const currentIdx = modes.findIndex(m => m.id === currentMode());
          setSelectedModeIndex(currentIdx >= 0 ? currentIdx : 0);
        } else if (selected === "/sessions" && commands["/sessions"]) {
          // Execute /sessions immediately
          setShowCommandSuggestions(false);
          setInput("");
          commands["/sessions"].handler([]);
        } else if (selected === "/save" && commands["/save"]) {
          // Execute /save immediately
          setShowCommandSuggestions(false);
          setInput("");
          commands["/save"].handler([]);
        } else if (selected === "/load" && commands["/load"]) {
          // Open load overlay
          setShowCommandSuggestions(false);
          setInput("");
          commands["/load"].handler([]);
        } else if (selected === "/theme") {
          // Open theme picker overlay
          setShowCommandSuggestions(false);
          setInput("");
          setActiveOverlay("theme");
          setShowThemePicker(true);
          setSelectedThemeIndex(currentTheme().name === "dark" ? 0 : 1);
        } else {
          // Regular command - just set input
          setInput(selected + " ");
        }
      }
      return;
    }

    // Tab completion for commands
    if (key.name === "tab" && input().startsWith("/")) {
      const partial = input().toLowerCase();
      const matches = Object.keys(commands).filter(cmd => cmd.startsWith(partial));
      if (matches.length === 1) {
        setInput(matches[0] + " ");
        setShowCommandSuggestions(false);
      } else if (matches.length > 1) {
        setShowCommandSuggestions(true);
        setCommandFilter(partial.slice(1));
      }
      return;
    }
  });

  const commands: Record<string, { description: string; handler: (args: string[]) => void }> = {
    "/help": {
      description: "Show all commands",
      handler: () => {
        setMessages(prev => [...prev, {
          id: prev.length + 1,
          role: "system",
          content: `Available commands:\n${Object.entries(commands).map(([cmd, info]) => `${cmd} - ${info.description}`).join("\n")}`,
          timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
        }]);
      }
    },
    "/exit": {
      description: "Exit TUI",
      handler: () => {
        process.stdout.write('\x1b[2J\x1b[0f\x1b[?25h');
        process.exit(0);
      }
    },
    "/clear": {
      description: "Clear messages",
      handler: () => setMessages([])
    },
    "/test": {
      description: "Test thinking and work items UI",
      handler: () => {
        setMessages(prev => [...prev, {
          id: prev.length + 1,
          role: "assistant",
          content: "I've analyzed your codebase and made some improvements.",
          agent: currentMode(),
          agentFullName: "Remi-V2",
          model: currentModel(),
          timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }),
          status: "complete",
          work: [
            {
              type: "thinking",
              steps: [
                { status: "complete", description: "Analyzing project structure", timestamp: new Date().toISOString() },
                { status: "complete", description: "Found 23 TypeScript files", timestamp: new Date().toISOString() },
                { status: "running", description: "Planning optimizations", timestamp: new Date().toISOString() },
                { status: "pending", description: "Generating changes", timestamp: new Date().toISOString() }
              ]
            },
            {
              type: "edit",
              file: "src/index.tsx",
              description: "Added error handling",
              additions: 12,
              deletions: 3
            },
            {
              type: "edit",
              file: "src/utils.ts",
              description: "Optimized imports",
              additions: 8,
              deletions: 0
            },
            {
              type: "create",
              file: "src/types.ts",
              description: "New type definitions",
              additions: 45,
              deletions: 0
            },
            {
              type: "command",
              file: "npm run build",
              description: "Build project",
              output: "> wzrd-tui@1.0.0 build\n> tsc\n\nBuild completed successfully!\n\nOutput: dist/",
              exitCode: 0
            }
          ]
        }]);
      }
    },
"/theme": {
      description: "Switch theme (dark/light)",
      handler: (args) => {
        const themeName = args[0]?.toLowerCase();
        if (themeName === "light") {
          const light = themes.light;
          if (light) {
            setCurrentTheme(light);
            setMessages(prev => [...prev, {
              id: prev.length + 1,
              role: "system",
              content: "Switched to light theme",
              timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
            }]);
          }
        } else if (themeName === "dark") {
          const dark = themes.dark;
          if (dark) {
            setCurrentTheme(dark);
            setMessages(prev => [...prev, {
              id: prev.length + 1,
              role: "system",
              content: "Switched to dark theme",
              timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
            }]);
          }
        } else {
          setMessages(prev => [...prev, {
            id: prev.length + 1,
            role: "system",
            content: `Current theme: ${currentTheme().name}\n\nAvailable themes:\n- dark\n- light\n\nUsage: /theme <dark|light>`,
            timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
          }]);
        }
}
    },
    "/verbose": {
      description: "Toggle verbose mode (shows thinking & work items)",
      handler: () => {
        const newState = !verboseMode();
        setVerboseMode(newState);
        setMessages(prev => [...prev, {
          id: prev.length + 1,
          role: "system",
          content: `Verbose mode ${newState ? "enabled" : "disabled"}. ${newState ? "You will now see thinking steps and work items in responses." : "Responses will be shown in compact mode."}`,
          timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
        }]);
      }
    },
    "/demo": {
      description: "Run live demo of chat responses",
    handler: async () => {
        // Demo 1: Simple greeting (no thinking)
        setMessages(prev => [...prev, {
          id: prev.length + 1,
          role: "user",
          content: "hey remi",
          timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
        }]);
        
        await new Promise(r => setTimeout(r, 500));
        
        setMessages(prev => [...prev, {
          id: prev.length + 1,
          role: "assistant",
          content: "Hey! I'm here. What are you working on today?",
          agent: currentMode(),
          agentFullName: "Remi-V2",
          model: currentModel(),
          timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }),
          status: "complete"
        }]);
        
        await new Promise(r => setTimeout(r, 1500));
        
        // Demo 2: Code generation (with thinking)
        setMessages(prev => [...prev, {
          id: prev.length + 1,
          role: "user",
          content: "can you write a Button component?",
          timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
        }]);
        
        await new Promise(r => setTimeout(r, 500));
        
        const streamingId = (messages().length + 2) + 2;
        
        // Start streaming message
        setMessages(prev => [...prev, {
          id: streamingId,
          role: "assistant",
          content: "",
          agent: currentMode(),
          agentFullName: "Remi-V2",
          model: currentModel(),
          timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }),
          status: "thinking",
          work: [
            {
              type: "thinking",
              steps: [
                { status: "running", description: "Analyzing request...", timestamp: new Date().toISOString() }
              ]
            }
          ]
        }]);
        
        await new Promise(r => setTimeout(r, 800));
        
        // Update with more thinking
        setMessages(prev => prev.map(m => 
          m.id === streamingId 
            ? {
                ...m,
                content: "I'll",
                work: [
                  {
                    type: "thinking",
                    steps: [
                      { status: "complete", description: "Analyzed request", timestamp: new Date().toISOString() },
                      { status: "running", description: "Generating component...", timestamp: new Date().toISOString() }
                    ]
                  }
                ]
              }
            : m
        ));
        
        await new Promise(r => setTimeout(r, 600));
        
        // Add work items
        setMessages(prev => prev.map(m => 
          m.id === streamingId 
            ? {
                ...m,
                content: "I'll create a Button component for you.",
                work: [
                  {
                    type: "thinking",
                    steps: [
                      { status: "complete", description: "Analyzed request", timestamp: new Date().toISOString() },
                      { status: "complete", description: "Generating component...", timestamp: new Date().toISOString() }
                    ]
                  },
                  {
                    type: "create",
                    file: "src/components/Button.tsx",
                    description: "React Button component",
                    additions: 45,
                    deletions: 0
                  }
                ]
              }
            : m
        ));
        
        await new Promise(r => setTimeout(r, 400));
        
        // Final message with code
        setMessages(prev => prev.map(m => 
          m.id === streamingId 
            ? {
                ...m,
                content: "I'll create a Button component for you.\n\n```typescript\nexport function Button({ children, onClick }: ButtonProps) {\n  return <button onClick={onClick}>{children}</button>;\n}\n```",
                status: "complete",
                work: [
                  {
                    type: "thinking",
                    steps: [
                      { status: "complete", description: "Analyzed request", timestamp: new Date().toISOString() },
                      { status: "complete", description: "Generated component", timestamp: new Date().toISOString() }
                    ]
                  },
                  {
                    type: "create",
                    file: "src/components/Button.tsx",
                    description: "React Button component with TypeScript",
                    additions: 45,
                    deletions: 0
                  }
                ]
              }
            : m
        ));
        
        await new Promise(r => setTimeout(r, 1500));
        
        // Demo 3: File edit with command
        setMessages(prev => [...prev, {
          id: prev.length + 1,
          role: "user",
          content: "update the button to have a variant prop",
          timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
        }]);
        
        await new Promise(r => setTimeout(r, 500));
        
        const editId = streamingId + 1;
        
        setMessages(prev => [...prev, {
          id: editId,
          role: "assistant",
          content: "",
          agent: currentMode(),
          agentFullName: "Remi-V2",
          model: currentModel(),
          timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }),
          status: "thinking",
          work: [
            {
              type: "thinking",
              steps: [
                { status: "running", description: "Analyzing changes...", timestamp: new Date().toISOString() }
              ]
            }
          ]
        }]);
        
        await new Promise(r => setTimeout(r, 800));
        
        setMessages(prev => prev.map(m => 
          m.id === editId 
            ? {
                ...m,
                content: "I'll",
                work: [
                  {
                    type: "thinking",
                    steps: [
                      { status: "complete", description: "Analyzed changes", timestamp: new Date().toISOString() },
                      { status: "running", description: "Updating component...", timestamp: new Date().toISOString() }
                    ]
                  },
                  {
                    type: "edit",
                    file: "src/components/Button.tsx",
                    description: "Added variant prop support",
                    additions: 12,
                    deletions: 3
                  }
                ]
              }
            : m
        ));
        
        await new Promise(r => setTimeout(r, 600));
        
        setMessages(prev => prev.map(m => 
          m.id === editId 
            ? {
                ...m,
                content: "I'll update the Button component to support variants.",
                status: "complete",
                work: [
                  {
                    type: "thinking",
                    steps: [
                      { status: "complete", description: "Analyzed changes", timestamp: new Date().toISOString() },
                      { status: "complete", description: "Updated component", timestamp: new Date().toISOString() }
                    ]
                  },
                  {
                    type: "edit",
                    file: "src/components/Button.tsx",
                    description: "Added variant prop with primary/secondary styles",
                    additions: 12,
                    deletions: 3
                  },
                  {
                    type: "command",
                    file: "npm run build",
                    description: "Build to verify changes",
                    output: "> wzrd-tui@1.0.0 build\n> tsc\n\nBuild completed successfully!",
                    exitCode: 0
                  }
                ]
              }
            : m
        ));
        
        await new Promise(r => setTimeout(r, 1000));
        
        // Final message
        setMessages(prev => [...prev, {
          id: prev.length + 1,
          role: "assistant",
          content: "Done! The Button component now supports primary and secondary variants. Build passed successfully.",
          agent: currentMode(),
          agentFullName: "Remi-V2",
          model: currentModel(),
          timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }),
          status: "complete"
        }]);
      }
    },
    "/vision": {
      description: "Analyze screenshot (e.g., /vision ./screenshot.png)",
      handler: (args) => {
        const path = args[0];
        if (!path) {
          setMessages(prev => [...prev, {
            id: prev.length + 1,
            role: "system",
            content: "Usage: /vision <path>",
            timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
          }]);
          return;
        }
        vision().analyzeScreenshot(path).then((result: { description: string }) => {
          setMessages(prev => [...prev, {
            id: prev.length + 1,
            role: "assistant",
            content: result.description,
            agent: currentMode(),
            agentFullName: "Remi-V2",
            model: currentModel(),
            timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }),
            status: "complete"
          }]);
        });
      }
    },
  "/model": {
    description: "Switch AI model (e.g., /model kimi-k2.5)",
    handler: (args) => {
      const modelName = args[0]?.toLowerCase() || "";
      if (!modelName) {
        // Open model picker overlay when no argument provided
        setActiveOverlay("model");
        setShowModelPicker(true);
        setModelPickerFilter("");
        setSelectedModelIndex(0);
        // Add a message to indicate the picker is open
        setMessages(prev => [...prev, {
          id: prev.length + 1,
          role: "system",
          content: "Select a model from the overlay",
          timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
        }]);
        return;
      }
      const model = aiModels.find(m => m.id.toLowerCase().includes(modelName) || m.name.toLowerCase().includes(modelName));
      if (model) {
        setCurrentModel(model.id);
        aiClient.setModel(model.id);
        setMessages(prev => [...prev, {
          id: prev.length + 1,
          role: "system",
          content: `Switched to ${model.name}`,
          timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
        }]);
      }
    }
  },
"/mode": {
      description: "Switch agent mode (remi/plan/build)",
      handler: (args) => {
        const mode = args[0]?.toLowerCase() || "";
        if (!mode) {
          // Open mode picker overlay when no argument provided
          setActiveOverlay("mode");
          setShowModePicker(true);
          const modes = agentModes();
          setSelectedModeIndex(modes.findIndex(m => m.id === currentMode()));
          return;
        }
        if (["remi", "plan", "build"].includes(mode)) {
          setCurrentMode(mode as "remi" | "plan" | "build");
          setMessages(prev => [...prev, {
            id: prev.length + 1,
            role: "system",
            content: `Switched to ${mode} mode`,
            timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
          }]);
        }
      }
    },
    "/cost": {
      description: "Show session cost",
      handler: () => {
        setMessages(prev => [...prev, {
          id: prev.length + 1,
          role: "system",
          content: `Session cost: $${cost().toFixed(4)}\nTokens used: ${contextTokens().toLocaleString()} / ${totalTokens().toLocaleString()}`,
          timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
        }]);
      }
    },
    "/save": {
      description: "Save current session",
      handler: (args) => {
        try {
          const title = args.join(" ") || sessionTitle();
          console.log(`[Save] Saving session: "${title}"`);
          const session = saveSession(messages(), title, contextTokens(), totalTokens(), cost(), currentModel(), currentMode());
          console.log(`[Save] Session saved with ID: ${session.id}`);
          setMessages(prev => [...prev, {
            id: prev.length + 1,
            role: "system",
            content: `Session saved: "${title}"\nID: ${session.id.slice(0, 20)}...`,
            timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
          }]);
        } catch (error) {
          console.error("[Save] Error:", error);
          setMessages(prev => [...prev, {
            id: prev.length + 1,
            role: "system",
            content: `Error saving session: ${error instanceof Error ? error.message : String(error)}`,
            timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
          }]);
        }
      }
    },
"/load": {
      description: "Load a session by ID",
      handler: (args) => {
        const sessionId = args[0];
        if (!sessionId) {
          // Open session picker overlay when no argument provided
          const sessions = listSessions();
          if (sessions.length === 0) {
            setMessages(prev => [...prev, {
              id: prev.length + 1,
              role: "system",
              content: "No saved sessions found",
              timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
            }]);
            return;
          }
          setAvailableSessions(sessions);
          setActiveOverlay("session");
          setShowSessionPicker(true);
          setSelectedSessionIndex(0);
          return;
        }
        const session = loadSession(sessionId);
        if (session) {
          setMessages(session.messages as Message[]);
          setSessionTitle(session.title);
          setMessages(prev => [...prev, {
            id: prev.length + 1,
            role: "system",
            content: `Loaded session: "${session.title}"`,
            timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
          }]);
        }
      }
    },
    "/sessions": {
      description: "List saved sessions",
      handler: () => {
        try {
          console.log("[Sessions] Loading sessions...");
          const sessions = listSessions();
          console.log(`[Sessions] Found ${sessions.length} sessions`);
          setMessages(prev => [...prev, {
            id: prev.length + 1,
            role: "system",
            content: sessions.length ? `Saved sessions (${sessions.length}):\n${sessions.map(s => `[${s.id.slice(0, 20)}...] ${s.title} - ${new Date(s.updatedAt).toLocaleDateString()}`).join("\n")}` : "No saved sessions found. Use /save <title> to create one.",
            timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
          }]);
        } catch (error) {
          console.error("[Sessions] Error:", error);
          setMessages(prev => [...prev, {
            id: prev.length + 1,
            role: "system",
            content: `Error loading sessions: ${error instanceof Error ? error.message : String(error)}`,
            timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
          }]);
        }
      }
    },
    "/nim": {
      description: "Check NIM API status",
      handler: async () => {
        const status = await checkAIStatus();
        setNimConnected(status.connected);
        setNimStatusMessage(status.message);
        setMessages(prev => [...prev, {
          id: prev.length + 1,
          role: "system",
          content: `NIM API Status: ${status.connected ? "✓ Connected" : "✗ Disconnected"}\n${status.message}\n\nTo configure, set NIM_API_KEY environment variable.`,
          timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
        }]);
      }
    },
    "/ws": {
      description: "Check WebSocket connection status",
      handler: () => {
        const status = wsConnected() ? "✓ Connected" : "✗ Disconnected";
        setMessages(prev => [...prev, {
          id: prev.length + 1,
          role: "system",
          content: `WebSocket Status: ${status}\nServer: ws://100.118.174.102:5666\nStatus: ${wsStatus()}`,
          timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
        }]);
      }
    },
    "/read": {
      description: "Read file contents (e.g., /read src/index.tsx)",
      handler: async (args) => {
        const path = args[0];
        if (!path) {
          // Open file picker overlay when no argument provided
          const tree = await fileSkill.getFileTree(".", 3);
          const files = tree.split('\n').filter(line => line.trim() && !line.endsWith('/'));
          if (files.length === 0) {
            setMessages(prev => [...prev, {
              id: prev.length + 1,
              role: "system",
              content: "No files found in project",
              timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
            }]);
            return;
          }
          setAvailableFiles(files.map(f => f.replace(/^[^a-zA-Z0-9_\-\.]*\s*/, '').trim()).filter(f => f));
          setFilePickerMode("read");
          setActiveOverlay("file");
          setShowFilePicker(true);
          setSelectedFileIndex(0);
          return;
        }
        const result = await fileSkill.readFile(path);
        if (result.success && result.content) {
          setMessages(prev => [...prev, {
            id: prev.length + 1,
            role: "assistant",
            content: `File: ${path}\n\n\`\`\`${result.content}\`\`\``,
            agent: currentMode(),
            agentFullName: "Remi-V2",
            model: currentModel(),
            timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }),
            status: "complete"
          }]);
        } else {
          setMessages(prev => [...prev, {
            id: prev.length + 1,
            role: "system",
            content: `Error reading file: ${result.error}`,
            timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
          }]);
        }
      }
    },
  "/write": {
    description: "Write file contents (e.g., /write test.txt Hello)",
    handler: async (args) => {
      const path = args[0];
      const content = args.slice(1).join(" ");
      if (!path || !content) {
        setMessages(prev => [...prev, {
          id: prev.length + 1,
          role: "system",
          content: "Usage: /write <file-path> <content>",
          timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
        }]);
        return;
      }
      const result = await fileSkill.writeFile(path, content);
      setMessages(prev => [...prev, {
        id: prev.length + 1,
        role: "system",
        content: result.success ? `File written: ${path}` : `Error: ${result.error}`,
        timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
      }]);
    }
  },
  "/tree": {
    description: "Show file tree (e.g., /tree src)",
    handler: async (args) => {
      const path = args[0] || ".";
      const tree = await fileSkill.getFileTree(path);
      setMessages(prev => [...prev, {
        id: prev.length + 1,
        role: "assistant",
        content: `File tree for ${path}:\n\n${tree}`,
        agent: currentMode(),
        agentFullName: "Remi-V2",
        model: currentModel(),
        timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }),
        status: "complete"
      }]);
    }
  },
"/edit": {
      description: "Edit file (e.g., /edit file.ts oldText newText)",
      handler: async (args) => {
        const path = args[0];
        const oldText = args[1];
        const newText = args[2];
        if (!path) {
          // Open file picker overlay when no argument provided
          const tree = await fileSkill.getFileTree(".", 3);
          const files = tree.split('\n').filter(line => line.trim() && !line.endsWith('/'));
          if (files.length === 0) {
            setMessages(prev => [...prev, {
              id: prev.length + 1,
              role: "system",
              content: "No files found in project",
              timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
            }]);
            return;
          }
          setAvailableFiles(files.map(f => f.replace(/^[^a-zA-Z0-9_\-\.]*\s*/, '').trim()).filter(f => f));
          setFilePickerMode("edit");
          setActiveOverlay("file");
          setShowFilePicker(true);
          setSelectedFileIndex(0);
          return;
        }
        if (!oldText || !newText) {
          setMessages(prev => [...prev, {
            id: prev.length + 1,
            role: "system",
            content: "Usage: /edit <file-path> <old-text> <new-text>",
            timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
          }]);
          return;
        }
      // Use edit with backup for undo support
      const messageId = messages().length + 1;
      const result = await fileSkill.editFileWithBackup(
        path,
        oldText,
        newText,
        messageId,
        "current-session"
      );
      
      setMessages(prev => [...prev, {
        id: prev.length + 1,
        role: "system",
        content: result.success 
          ? `File edited: ${path}${result.backupId ? " (backup created)" : ""}` 
          : `Error: ${result.error}`,
        timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
      }]);
    }
  },
"/files": {
      description: "Show project files in sidebar (switches to Files tab)",
      handler: async () => {
        // Build file browser entries
        const entries = await buildFileBrowserEntries(".", 0, expandedDirs());
        setFileBrowserEntries(entries);
        setFileBrowserLoaded(true);
        setBrowserSelectedIndex(0);
        setSidebarPage("files");
        setMessages(prev => [...prev, {
          id: prev.length + 1,
          role: "system",
          content: "File browser loaded. Switched to Files tab. Use ↑↓ to navigate, Enter to open, Space to toggle.",
          timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
        }]);
      }
    },
    "/run": {
      description: "Execute shell command (e.g., /run npm test)",
      handler: async (args) => {
        const command = args.join(" ");
        if (!command) {
          setMessages(prev => [...prev, {
            id: prev.length + 1,
            role: "system",
            content: "Usage: /run <command>",
            timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
          }]);
          return;
        }

        // Add message showing command is running
        const runMsgId = messages().length + 1;
        setMessages(prev => [...prev, {
          id: runMsgId,
          role: "assistant",
          content: `Running: ${command}`,
          agent: currentMode(),
          agentFullName: "Remi-V2",
          model: currentModel(),
          timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }),
          status: "thinking",
          work: [{
            type: "command",
            file: command,
            description: "Executing shell command",
            output: "...",
            exitCode: undefined
          }]
        }]);

        const result = await shellSkill.execute(command);

        // Update message with result
        setMessages(prev => prev.map(m =>
          m.id === runMsgId
            ? {
                ...m,
                content: result.success
                  ? `Command completed successfully: ${command}`
                  : `Command failed: ${command}`,
                status: result.success ? "complete" : "interrupted",
                work: [{
                  type: "command",
                  file: command,
                  description: result.success ? "Command executed" : `Exit code: ${result.exitCode}`,
                  output: result.stdout || result.stderr,
                  exitCode: result.exitCode ?? undefined
                }]
              }
            : m
        ));
      }
    },
    "/search": {
      description: "Search codebase (e.g., /search function name)",
      handler: async (args) => {
        const query = args.join(" ");
        if (!query) {
          setMessages(prev => [...prev, {
            id: prev.length + 1,
            role: "system",
            content: "Usage: /search <pattern>",
            timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
          }]);
          return;
        }

        const result = await searchSkill.search(query);
        const formatted = searchSkill.formatResults(result);

        setMessages(prev => [...prev, {
          id: prev.length + 1,
          role: "assistant",
          content: formatted,
          agent: currentMode(),
          agentFullName: "Remi-V2",
          model: currentModel(),
          timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }),
          status: "complete"
        }]);
      }
    },
    "/git": {
      description: "Git operations (e.g., /git status, /git diff, /git commit <msg>)",
      handler: async (args) => {
        if (!gitSkill.isRepo()) {
          setMessages(prev => [...prev, {
            id: prev.length + 1,
            role: "system",
            content: "Not a git repository",
            timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
          }]);
          return;
        }

        const subcommand = args[0] || "status";
        const subArgs = args.slice(1);

        const result = await gitSkill.handleCommand(subcommand, subArgs);

        setMessages(prev => [...prev, {
          id: prev.length + 1,
          role: result.success ? "assistant" : "system",
          content: result.success ? result.output : (result.error || "Git command failed"),
          agent: result.success ? currentMode() : undefined,
          agentFullName: result.success ? "Remi-V2" : undefined,
          model: result.success ? currentModel() : undefined,
          timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }),
          status: result.success ? "complete" : undefined
        }]);
      }
    },
"/undo": {
    description: "Revert last AI file edit",
    handler: async () => {
      // Import backup module
      const { listBackups, restoreBackup } = await import("./skills/backup");

      // Get all backups
      const backups = listBackups();

      if (backups.length === 0) {
        setMessages(prev => [...prev, {
          id: prev.length + 1,
          role: "system",
          content: "No backups found. Undo only works for files edited in this session.",
          timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
        }]);
        return;
      }

      // Sort by timestamp (newest first)
      backups.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      // Group backups by file
      const fileBackups = new Map<string, typeof backups>();
      for (const backup of backups) {
        if (!fileBackups.has(backup.filePath)) {
          fileBackups.set(backup.filePath, []);
        }
        fileBackups.get(backup.filePath)!.push(backup);
      }

      // Restore the most recent backup for each file
      const restored: string[] = [];
      const failed: string[] = [];

      for (const [filePath, fileBackupList] of fileBackups) {
        const latestBackup = fileBackupList[0];
        if (!latestBackup) continue;

        const result = await restoreBackup(latestBackup.id);
        if (result.success) {
          restored.push(filePath);
        } else {
          failed.push(`${filePath}: ${result.error}`);
        }
      }

      // Build response message
      let content = "";
      if (restored.length > 0) {
        content += `Restored ${restored.length} file(s):\n${restored.map(f => `  ✓ ${f}`).join("\n")}`;
      }
      if (failed.length > 0) {
        if (content) content += "\n\n";
        content += `Failed to restore ${failed.length} file(s):\n${failed.map(f => `  ✗ ${f}`).join("\n")}`;
      }

      setMessages(prev => [...prev, {
        id: prev.length + 1,
        role: "system",
        content: content || "No files to restore",
        timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
      }]);
    }
  },
  
  "/diff": {
    description: "Show diff for a file (e.g., /diff file.ts)",
    handler: async (args) => {
      const { listBackups, getBackupPath } = await import("./skills/backup");
      const { calculateDiff, formatDiff } = await import("./skills/diff");
      const { readFileSync, existsSync } = await import("fs");
      
      if (args.length === 0) {
        setMessages(prev => [...prev, {
          id: prev.length + 1,
          role: "system",
          content: "Usage: /diff <file-path>",
          timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
        }]);
        return;
      }
      
      const filePath = args[0] || "";
      if (!filePath) {
        setMessages(prev => [...prev, {
          id: prev.length + 1,
          role: "system",
          content: "Please specify a file path",
          timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
        }]);
        return;
      }
      
      // Find backup for this file
      const backups = listBackups().filter(b => b.filePath === filePath);
      if (backups.length === 0) {
        setMessages(prev => [...prev, {
          id: prev.length + 1,
          role: "system",
          content: `No backup found for: ${filePath}`,
          timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
        }]);
        return;
      }
      
      // Get most recent backup
      const backup = backups.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )[0];
      
      if (!backup) {
        setMessages(prev => [...prev, {
          id: prev.length + 1,
          role: "system",
          content: `No backup found for: ${filePath}`,
          timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
        }]);
        return;
      }
      
      // Read backup content
      const backupPath = getBackupPath(backup.id);
      if (!existsSync(backupPath)) {
        setMessages(prev => [...prev, {
          id: prev.length + 1,
          role: "system",
          content: `Backup file not found: ${backupPath}`,
          timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
        }]);
        return;
      }
      
      const oldContent = readFileSync(backupPath, "utf-8");
      
      // Read current content
      if (!existsSync(filePath)) {
        setMessages(prev => [...prev, {
          id: prev.length + 1,
          role: "system",
          content: `File not found: ${filePath}`,
          timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
        }]);
        return;
      }
      
      const newContent = readFileSync(filePath, "utf-8");
      
      // Calculate and format diff
      const diff = calculateDiff(filePath, oldContent, newContent);
      const formattedDiff = formatDiff(diff, { maxLines: 30, showContext: 3 });
      
      setMessages(prev => [...prev, {
        id: prev.length + 1,
        role: "system",
        content: formattedDiff,
        timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
      }]);
    }
  },
  
  "/backups": {
    description: "Show backup statistics and manage backups",
    handler: async () => {
      const { getBackupStats, listBackups, clearAllBackups } = await import("./skills/backup");
      const stats = getBackupStats();
      const backups = listBackups();
      
      // Group by file
      const byFile = new Map<string, number>();
      for (const backup of backups) {
        byFile.set(backup.filePath, (byFile.get(backup.filePath) || 0) + 1);
      }
      
      let content = `Backup Statistics:\n`;
      content += `  Total backups: ${stats.totalBackups}\n`;
      content += `  Files with backups: ${stats.filesWithBackups}\n`;
      content += `  Total size: ${(stats.totalSize / 1024 / 1024).toFixed(2)} MB\n\n`;
      
      if (backups.length > 0) {
        content += `Recent backups:\n`;
        const recent = backups
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 10);
        
        for (const backup of recent) {
          const date = new Date(backup.timestamp).toLocaleString();
          content += `  ${backup.filePath} (${date})\n`;
        }
      }
      
      setMessages(prev => [...prev, {
        id: prev.length + 1,
        role: "system",
        content,
        timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
      }]);
    }
  },
  
  "/clear-backups": {
    description: "Clear all file backups",
    handler: async () => {
      const { clearAllBackups, getBackupStats } = await import("./skills/backup");
      const beforeStats = getBackupStats();
      clearAllBackups();
      
      setMessages(prev => [...prev, {
        id: prev.length + 1,
        role: "system",
        content: `Cleared ${beforeStats.totalBackups} backups (${(beforeStats.totalSize / 1024 / 1024).toFixed(2)} MB)`,
        timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
      }]);
    }
  },
  
  "/prune": {
    description: "Remove messages from context (e.g., /prune 5, /prune all, /prune before 10)",
    handler: async (args) => {
      const subcommand = args[0];
      
      if (!subcommand) {
        setMessages(prev => [...prev, {
          id: prev.length + 1,
          role: "system",
          content: "Usage: /prune <count> | /prune all | /prune before <id> | /prune after <id>",
          timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
        }]);
        return;
      }

      const currentMessages = messages();
      let prunedCount = 0;
      let newMessages: typeof currentMessages = [];

      if (subcommand === "all") {
        // Clear all messages except system
        newMessages = currentMessages.filter(m => m.role === "system");
        prunedCount = currentMessages.length - newMessages.length;
      } else if (subcommand === "before" && args[1]) {
        // Remove all messages before message ID
        const beforeId = parseInt(args[1], 10);
        if (isNaN(beforeId)) {
          setMessages(prev => [...prev, {
            id: prev.length + 1,
            role: "system",
            content: "Invalid message ID. Usage: /prune before <message-id>",
            timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
          }]);
          return;
        }
        const beforeIndex = currentMessages.findIndex(m => m.id === beforeId);
        if (beforeIndex === -1) {
          setMessages(prev => [...prev, {
            id: prev.length + 1,
            role: "system",
            content: `Message ${beforeId} not found`,
            timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
          }]);
          return;
        }
        newMessages = currentMessages.slice(beforeIndex);
        prunedCount = beforeIndex;
      } else if (subcommand === "after" && args[1]) {
        // Remove all messages after message ID
        const afterId = parseInt(args[1], 10);
        if (isNaN(afterId)) {
          setMessages(prev => [...prev, {
            id: prev.length + 1,
            role: "system",
            content: "Invalid message ID. Usage: /prune after <message-id>",
            timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
          }]);
          return;
        }
        const afterIndex = currentMessages.findIndex(m => m.id === afterId);
        if (afterIndex === -1) {
          setMessages(prev => [...prev, {
            id: prev.length + 1,
            role: "system",
            content: `Message ${afterId} not found`,
            timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
          }]);
          return;
        }
        newMessages = currentMessages.slice(0, afterIndex + 1);
        prunedCount = currentMessages.length - newMessages.length;
      } else {
        // Remove last N messages
        const count = parseInt(subcommand, 10);
        if (isNaN(count) || count <= 0) {
          setMessages(prev => [...prev, {
            id: prev.length + 1,
            role: "system",
            content: "Invalid count. Usage: /prune <number>",
            timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
          }]);
          return;
        }
        newMessages = currentMessages.slice(0, Math.max(0, currentMessages.length - count));
        prunedCount = Math.min(count, currentMessages.length);
      }

      // Update messages
      setMessages(newMessages);
      
      // Recalculate context tokens
      const newTokenCount = newMessages.reduce((acc, m) => acc + (m.content?.length || 0) / 4, 0);
      setContextTokens(Math.round(newTokenCount));

      setMessages(prev => [...prev, {
        id: prev.length + 1,
        role: "system",
        content: `Pruned ${prunedCount} messages. Context now has ${newMessages.length} messages (${Math.round(newTokenCount).toLocaleString()} tokens).`,
        timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
      }]);
      
      // Reset budget warnings after pruning
      setBudgetWarningShown(false);
      setBudgetCriticalShown(false);
    }
  },
  
  "/compress": {
    description: "Summarize old messages to reduce token usage",
    handler: async () => {
      const currentMessages = messages();
      const messageCount = currentMessages.length;
      
      if (messageCount < 10) {
        setMessages(prev => [...prev, {
          id: prev.length + 1,
          role: "system",
          content: "Not enough messages to compress (minimum 10)",
          timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
        }]);
        return;
      }
      
      // Keep last 5 messages, summarize the rest
      const keepCount = 5;
      const toSummarize = currentMessages.slice(0, -keepCount);
      const toKeep = currentMessages.slice(-keepCount);
      
      // Create summary of old messages
      const summaryContent = toSummarize.map(m => {
        const role = m.role === "user" ? "User" : m.role === "assistant" ? "Assistant" : "System";
        return `${role}: ${m.content.slice(0, 200)}${m.content.length > 200 ? "..." : ""}`;
      }).join("\n\n");
      
      const summaryMessage: Message = {
        id: currentMessages.length + 1,
        role: "system",
        content: `## Previous Conversation Summary\n\n${summaryContent}\n\n[${toSummarize.length} messages summarized to save tokens]`,
        timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
      };
      
      // Update messages with summary + kept messages
      const newMessages = [summaryMessage, ...toKeep];
      setMessages(newMessages);
      
      // Recalculate tokens
      const newTokenCount = newMessages.reduce((acc, m) => acc + (m.content?.length || 0) / 4, 0);
      setContextTokens(Math.round(newTokenCount));
      
      // Reset budget warnings
      setBudgetWarningShown(false);
      setBudgetCriticalShown(false);
      
      setMessages(prev => [...prev, {
        id: prev.length + 1,
        role: "system",
        content: `Compressed ${toSummarize.length} messages into summary. Context now has ${newMessages.length} items (${Math.round(newTokenCount).toLocaleString()} tokens).`,
        timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
      }]);
    }
  },
  
  "/memory": {
    description: "Access 7-layer memory system (e.g., /memory, /memory search <query>, /memory add <content>)",
    handler: async (args) => {
      const { 
        MemoryLayer, 
        getMemoryStats, 
        getMemoriesByLayer, 
        searchMemories, 
        addMemory,
        getLayerName,
        getLayerDescription,
        clearAllMemories
      } = await import("./skills/memory");
      
      const subcommand = args[0] || "status";
      
      if (subcommand === "status" || subcommand === "stats") {
        const stats = getMemoryStats();
        
        let content = "## Memory System Statistics\n\n";
        content += `Total memories: ${stats.totalMemories}\n`;
        content += `Total size: ${(stats.totalSize / 1024).toFixed(2)} KB\n\n`;
        
        content += "### By Layer:\n";
        for (let layer = 1; layer <= 7; layer++) {
          const count = (stats.byLayer as Record<number, number>)[layer] || 0;
          const name = getLayerName(layer);
          content += `  ${layer}. ${name}: ${count}\n`;
        }
        
        if (Object.keys(stats.byCategory).length > 0) {
          content += "\n### By Category:\n";
          for (const [category, count] of Object.entries(stats.byCategory)) {
            content += `  ${category}: ${count}\n`;
          }
        }
        
        setMessages(prev => [...prev, {
          id: prev.length + 1,
          role: "system",
          content,
          timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
        }]);
        
      } else if (subcommand === "search" && args[1]) {
        const query = args.slice(1).join(" ");
        const results = searchMemories(query, { limit: 10 });
        
        if (results.length === 0) {
          setMessages(prev => [...prev, {
            id: prev.length + 1,
            role: "system",
            content: `No memories found for: "${query}"`,
            timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
          }]);
          return;
        }
        
        let content = `## Search Results for "${query}"\n\n`;
        for (const result of results) {
          const mem = result.memory;
          content += `**${getLayerName(mem.layer)}** (${mem.category})\n`;
          content += `${mem.content.slice(0, 200)}${mem.content.length > 200 ? "..." : ""}\n`;
          content += `Relevance: ${(result.score * 100).toFixed(0)}% | Accessed: ${mem.accessCount} times\n\n`;
        }
        
        setMessages(prev => [...prev, {
          id: prev.length + 1,
          role: "system",
          content,
          timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
        }]);
        
      } else if (subcommand === "layer" && args[1]) {
        const layerNum = parseInt(args[1], 10);
        if (isNaN(layerNum) || layerNum < 1 || layerNum > 7) {
          setMessages(prev => [...prev, {
            id: prev.length + 1,
            role: "system",
            content: "Invalid layer. Use 1-7 (1=Working, 7=Procedural)",
            timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
          }]);
          return;
        }
        
        const memories = getMemoriesByLayer(layerNum, 20);
        const layerName = getLayerName(layerNum);
        const layerDesc = getLayerDescription(layerNum);
        
        let content = `## ${layerName}\n${layerDesc}\n\n`;
        
        if (memories.length === 0) {
          content += "No memories in this layer.";
        } else {
          for (const mem of memories) {
            content += `**${mem.category}** (${new Date(mem.timestamp).toLocaleDateString()})\n`;
            content += `${mem.content.slice(0, 150)}${mem.content.length > 150 ? "..." : ""}\n\n`;
          }
        }
        
        setMessages(prev => [...prev, {
          id: prev.length + 1,
          role: "system",
          content,
          timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
        }]);
        
      } else if (subcommand === "add" && args[1]) {
        const content = args.slice(1).join(" ");
        const layer = MemoryLayer.LONG_TERM; // Default to long-term
        const category = "manual";
        
        await addMemory(content, layer, category, ["manual", "user-added"]);
        
        setMessages(prev => [...prev, {
          id: prev.length + 1,
          role: "system",
          content: "Memory added to long-term storage.",
          timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
        }]);
        
      } else if (subcommand === "clear") {
        clearAllMemories();
        setMessages(prev => [...prev, {
          id: prev.length + 1,
          role: "system",
          content: "All memories cleared.",
          timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
        }]);
        
      } else {
        setMessages(prev => [...prev, {
          id: prev.length + 1,
          role: "system",
          content: "Usage:\n  /memory - Show stats\n  /memory search <query> - Search memories\n  /memory layer <1-7> - Show layer contents\n  /memory add <content> - Add memory\n  /memory clear - Clear all memories",
          timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
        }]);
      }
    }
  },
  
  "/remember": {
    description: "Save current conversation to memory",
    handler: async () => {
      const { MemoryLayer, addMemory } = await import("./skills/memory");
      
      const currentMessages = messages();
      const userMessages = currentMessages.filter(m => m.role === "user");
      const assistantMessages = currentMessages.filter(m => m.role === "assistant");
      
      if (userMessages.length === 0) {
        setMessages(prev => [...prev, {
          id: prev.length + 1,
          role: "system",
          content: "No conversation to remember.",
          timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
        }]);
        return;
      }
      
      // Create summary
      const summary = `Conversation with ${userMessages.length} user messages and ${assistantMessages.length} assistant responses. Mode: ${currentMode()}. Model: ${currentModel()}.`;
      
      await addMemory(summary, MemoryLayer.MEDIUM_TERM, "conversation-summary", [currentMode(), "session"], undefined, "user-saved");
      
      // Save recent user queries
      for (const msg of userMessages.slice(-3)) {
        if (msg.content.length > 10) {
          await addMemory(msg.content.slice(0, 500), MemoryLayer.SHORT_TERM, "user-query", [currentMode(), "query"], undefined, "user-saved");
        }
      }
      
      setMessages(prev => [...prev, {
        id: prev.length + 1,
        role: "system",
        content: `Conversation saved to memory (${userMessages.length} messages).`,
        timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
      }]);
    }
  },
  
  "/attach": {
    description: "Add files to conversation context (e.g., /attach file.ts)",
    handler: async (args) => {
      if (args.length === 0) {
        // Show file picker for attach mode
        const tree = await fileSkill.getFileTree(".", 3);
        const files = tree.split('\n').filter(line => line.trim() && !line.endsWith('/'));
        if (files.length === 0) {
          setMessages(prev => [...prev, {
            id: prev.length + 1,
            role: "system",
            content: "No files found in project",
            timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
          }]);
          return;
        }
        setAvailableFiles(files.map(f => f.replace(/^[^a-zA-Z0-9_\-\.]*\s*/, '').trim()).filter(f => f));
        setFilePickerMode("read");
        setActiveOverlay("file");
        setShowFilePicker(true);
        setSelectedFileIndex(0);
        return;
      }

      const filePath = args[0] || "";
      if (!filePath) {
        setMessages(prev => [...prev, {
          id: prev.length + 1,
          role: "system",
          content: "Please specify a file path",
          timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
        }]);
        return;
      }
      
      // Check if already attached
      const alreadyAttached = attachedFiles().some(f => f.path === filePath);
      if (alreadyAttached) {
        setMessages(prev => [...prev, {
          id: prev.length + 1,
          role: "system",
          content: `File already attached: ${filePath}`,
          timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
        }]);
        return;
      }
      
      const result = await fileSkill.readFile(filePath);
      
      if (!result.success || !result.content) {
        setMessages(prev => [...prev, {
          id: prev.length + 1,
          role: "system",
          content: `Failed to attach file: ${result.error || "Unknown error"}`,
          timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
        }]);
        return;
      }

      // Check file size
      const content = result.content;
      if (content.length > MAX_ATTACH_SIZE) {
        setMessages(prev => [...prev, {
          id: prev.length + 1,
          role: "system",
          content: `File too large (${(content.length / 1024).toFixed(1)}KB). Max size: ${(MAX_ATTACH_SIZE / 1024).toFixed(0)}KB`,
          timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
        }]);
        return;
      }

      // Add to attached files
      setAttachedFiles(prev => [...prev, {
        path: filePath || "unknown",
        content: content,
        size: content.length
      }]);

      setMessages(prev => [...prev, {
        id: prev.length + 1,
        role: "system",
        content: `Attached: ${filePath} (${(content.length / 1024).toFixed(1)}KB)`,
        timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
      }]);
    }
  },
  
"/unattach": {
    description: "Remove attached files (e.g., /unattach file.ts or /unattach all)",
    handler: async (args) => {
      if (args.length === 0 || args[0] === "all") {
        const count = attachedFiles().length;
        setAttachedFiles([]);
        setMessages(prev => [...prev, {
          id: prev.length + 1,
          role: "system",
          content: `Removed all ${count} attached files`,
          timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
        }]);
        return;
      }

      const filePath = args[0];
      const initialCount = attachedFiles().length;
      setAttachedFiles(prev => prev.filter(f => f.path !== filePath));
      const removedCount = initialCount - attachedFiles().length;

      if (removedCount > 0) {
        setMessages(prev => [...prev, {
          id: prev.length + 1,
          role: "system",
          content: `Removed: ${filePath}`,
          timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
        }]);
      } else {
        setMessages(prev => [...prev, {
          id: prev.length + 1,
          role: "system",
          content: `File not found in attachments: ${filePath}`,
          timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
        }]);
      }
    }
  },

  // Phase 6: Rename command
  "/rename": {
    description: "Rename current session",
    handler: () => {
      setRenameInput(sessionTitle());
      setShowRenameInput(true);
      setActiveOverlay("rename");
    }
  },

  // Phase 6: Thinking command
  "/thinking": {
    description: "Toggle extended thinking mode",
    handler: () => {
      const modelSupportsThinking = aiModels.find(m => m.id === currentModel())?.id === "kimi-k2.5" || 
                                     aiModels.find(m => m.id === currentModel())?.id === "deepseek-v3.2";
      if (modelSupportsThinking) {
        setExtendedThinking(!extendedThinking());
        setMessages(prev => [...prev, {
          id: prev.length + 1,
          role: "system",
          content: `Extended thinking ${extendedThinking() ? "enabled" : "disabled"}`,
          timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
        }]);
      } else {
        setMessages(prev => [...prev, {
          id: prev.length + 1,
          role: "system",
          content: "Current model doesn't support extended thinking. Try Kimi K2.5 or DeepSeek V3.2.",
          timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
        }]);
      }
    }
  },

  // Phase 6: CLAUDE.md command
  "/claude-md": {
    description: "Show CLAUDE.md configuration",
    handler: () => {
      const config = claudeMdConfig();
      if (!config) {
        setMessages(prev => [...prev, {
          id: prev.length + 1,
          role: "system",
          content: "No CLAUDE.md found in project root. Create one to add project-specific instructions.",
          timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
        }]);
        return;
      }

      let content = `## CLAUDE.md Configuration\n\n`;
      content += `**Project:** ${config.projectName}\n`;
      if (config.description) content += `**Description:** ${config.description}\n`;
      
      if (config.instructions.length > 0) {
        content += `\n### Instructions\n`;
        config.instructions.forEach(i => content += `- ${i}\n`);
      }
      
      if (config.rules.length > 0) {
        content += `\n### Rules\n`;
        config.rules.forEach(r => content += `- ${r}\n`);
      }
      
      if (Object.keys(config.context).length > 0) {
        content += `\n### Context\n`;
        Object.entries(config.context).forEach(([k, v]) => content += `- ${k}: ${v}\n`);
      }

      setMessages(prev => [...prev, {
        id: prev.length + 1,
        role: "system",
        content,
        timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
      }]);
    }
  },

  // Phase 6: Skills command
  "/skills": {
    description: "List custom skills",
    handler: () => {
      const skills = customSkills();
      if (skills.length === 0) {
        setMessages(prev => [...prev, {
          id: prev.length + 1,
          role: "system",
          content: "No custom skills loaded. Add skills to ~/.wzrd/skills/ as JSON files.",
          timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
        }]);
        return;
      }

      let content = "## Custom Skills\n\n";
      skills.forEach(s => {
        content += `**.${s.name}** - ${s.description}\n`;
      });
      content += "\nUse skills by typing `.skillname` in chat.";

      setMessages(prev => [...prev, {
        id: prev.length + 1,
        role: "system",
        content,
        timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
      }]);
    }
  }
};

async function handleSubmit() {
  const text = input().trim();
  if (!text || isProcessing()) return;

    // Handle commands
    if (text.startsWith("/")) {
      const parts = text.split(" ");
      const cmd = parts[0]!.toLowerCase();
      const args = parts.slice(1);
      
      console.log(`[Command] Input: "${text}", Parsed cmd: "${cmd}"`);

      if (commands[cmd]) {
        console.log(`[Command] Exact match found: ${cmd}`);
        commands[cmd].handler(args);
      } else {
        // Check for partial match - autocomplete if unique
        const matches = Object.keys(commands).filter(c => c.startsWith(cmd));
        console.log(`[Command] Partial matches for "${cmd}":`, matches);
        const matchedCmd = matches[0];
        if (matches.length === 1 && matchedCmd) {
          console.log(`[Command] Auto-completing to: ${matchedCmd}`);
          const command = commands[matchedCmd as keyof typeof commands];
          if (command) {
            // Unique match - execute it
            command.handler(args);
          }
        } else if (matches.length > 1) {
          // Multiple matches - show ambiguous message
          setMessages(prev => [...prev, {
            id: prev.length + 1,
            role: "system",
            content: `Ambiguous command: ${cmd}. Did you mean: ${matches.join(", ")}?`,
            timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
          }]);
        } else {
          // No matches
          setMessages(prev => [...prev, {
            id: prev.length + 1,
            role: "system",
            content: `Unknown command: ${cmd}. Type /help for available commands.`,
            timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
          }]);
        }
      }
      setInput("");
      return;
    }

  requestStartTime = Date.now();
  setIsProcessing(true);
  setStreamingContent("");
  setShowStreaming(true);

    // Phase 6: Check for custom skill invocation
    if (text.startsWith(".")) {
      const skillName = text.slice(1).split(" ")[0];
      if (skillName) {
        const skill = customSkills().find(s => s.name === skillName);
        if (skill) {
          const args = text.slice(1 + skillName.length).trim().split(" ");
          const result = await skill.handler(args);
          setMessages(prev => [...prev, {
            id: prev.length + 1,
            role: "system",
            content: result,
            timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
          }]);
          setInput("");
          setIsProcessing(false);
          return;
        }
      }
    }

    // Phase 6: Process @ references
    const { processedText, atFiles } = await processAtReferences(text);

    // Add user message
    setMessages(prev => [...prev, {
      id: prev.length + 1,
      role: "user",
      content: processedText,
      timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
    }]);

    // Add to input history (keep last 50)
    setInputHistory(prev => {
      const newHistory = [...prev, text];
      return newHistory.slice(-50);
    });
    setHistoryIndex(-1);

  // Clear input immediately after adding user message
  setInput("");

// DISABLED: WebSocket is broken, use direct API calls instead
    // if (wsClient?.isConnected()) { ... }

    // Use direct API calls - they actually work
    console.log("[TUI] Using direct API call with model:", currentModel());

  // Fallback: Check if NIM is configured for direct API calls
  if (!isAIConfigured()) {
    setMessages(prev => [...prev, {
      id: prev.length + 1,
      role: "assistant",
      content: "NIM API is not configured. Please set the NIM_API_KEY environment variable to use AI features.",
      agent: currentMode(),
      agentFullName: "Remi-V2",
      model: currentModel(),
      timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }),
      responseTime: "0.0s",
      status: "complete"
    }]);
    setIsProcessing(false);
    setShowStreaming(false);
    return;
  }

  // Fallback: Set current model for direct API call
  aiClient.setModel(currentModel());

// Phase 6: Get appropriate system prompt based on mode
    const baseSystemPrompt = currentMode() === "plan" 
      ? getPlanModePrompt() 
      : getSystemPrompt(currentMode() as "remi" | "plan" | "build");
    const modelName = aiModels.find(m => m.id === currentModel())?.name || currentModel();
    const providerName = aiProviders[aiClient.getCurrentProvider()]?.name || aiClient.getCurrentProvider();

    // Build attached files section (including @ references)
    const attachments = attachedFiles();
    const allAttachments = [...attachments, ...atFiles.map(f => ({ path: f.path, content: f.content, size: f.content.length }))];
    
    let attachedFilesSection = "";
    if (allAttachments.length > 0) {
      attachedFilesSection = "\n\n## Attached Files\n\n";
      for (const file of allAttachments) {
        attachedFilesSection += `### ${file.path}\n\`\`\`\n${file.content.slice(0, 5000)}${file.content.length > 5000 ? '\n... (truncated)' : ''}\n\`\`\`\n\n`;
      }
    }

    // Get relevant memories for context injection
    let memoriesSection = "";
    try {
      const { getRelevantMemories } = await import("./skills/memory");
      const relevantMemories = getRelevantMemories(processedText, 3);
      if (relevantMemories.length > 0) {
        memoriesSection = "\n\n## Relevant Context from Memory\n\n";
        for (const mem of relevantMemories) {
          memoriesSection += `[${mem.category}]: ${mem.content.slice(0, 300)}${mem.content.length > 300 ? "..." : ""}\n\n`;
        }
      }
    } catch {
      // Memory system not available, skip
    }

    // Phase 6: Add CLAUDE.md context if available
    let claudeMdSection = "";
    const claudeConfig = claudeMdConfig();
    if (claudeConfig && currentMode() !== "plan") {
      claudeMdSection = "\n\n## Project Context (from CLAUDE.md)\n\n";
      if (claudeConfig.projectName) claudeMdSection += `Project: ${claudeConfig.projectName}\n`;
      if (claudeConfig.description) claudeMdSection += `Description: ${claudeConfig.description}\n`;
      if (claudeConfig.instructions.length > 0) {
        claudeMdSection += "\nInstructions:\n";
        claudeConfig.instructions.forEach(i => claudeMdSection += `- ${i}\n`);
      }
      if (claudeConfig.rules.length > 0) {
        claudeMdSection += "\nRules:\n";
        claudeConfig.rules.forEach(r => claudeMdSection += `- ${r}\n`);
      }
    }

    // Phase 6: Add extended thinking instruction if enabled
    let thinkingSection = "";
    if (extendedThinking()) {
      thinkingSection = "\n\n## Extended Thinking Mode\n\nPlease provide detailed reasoning and analysis before giving your final answer. Break down complex problems step by step.";
    }

    const systemPrompt = `${baseSystemPrompt}\n\nYou are currently running as: ${modelName} (${providerName})${attachedFilesSection}${memoriesSection}${claudeMdSection}${thinkingSection}`;
    const history: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...messages()
      .filter(m => m.role === "user" || m.role === "assistant")
      .slice(-10)
      .map(m => ({
        role: m.role,
        content: m.content,
      }))
    ];

  // Add streaming message placeholder
  const streamingId = messages().length + 2;
  setMessages(prev => [...prev, {
    id: streamingId,
    role: "assistant",
    content: "",
    agent: currentMode(),
    agentFullName: "Remi-V2",
    model: currentModel(),
    timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }),
    status: "thinking"
  }]);

    try {
    // Call NIM API with streaming
    const messagesForAPI: ChatMessage[] = [
      ...history,
      { role: "user", content: text }
    ];

    let fullContent = "";
    let promptTokens = 0;
    let completionTokens = 0;
    let retryCount = 0;

const response = await aiClient.chat(messagesForAPI, {
      stream: true,
      temperature: extendedThinking() ? 0.3 : 0.7,
      maxTokens: extendedThinking() ? 8192 : 4096,
      onStream: (chunk: string) => {
          fullContent += chunk;
          setStreamingContent(fullContent);

          // Parse work items from current content
          const currentWorkItems = parseWorkItems(fullContent);
          
          // Only build thinking steps if there's actual work happening
          const work: WorkItem[] = [];
          
          // Only show thinking/work items when there's something meaningful
          const hasCodeBlocks = fullContent.includes('```');
          const hasFileOperations = currentWorkItems.length > 0;
          const isSubstantial = fullContent.length > 200;
          
          if (hasCodeBlocks || hasFileOperations) {
            // Build dynamic thinking steps based on progress
            const thinkingSteps: ThinkingStep[] = [];
            
            if (isSubstantial) {
              thinkingSteps.push({
                status: "complete",
                description: "Analyzed request",
                timestamp: new Date().toISOString()
              });
            }
            
            if (hasCodeBlocks) {
              thinkingSteps.push({
                status: "running",
                description: "Generating code...",
                timestamp: new Date().toISOString()
              });
            }
            
            if (thinkingSteps.length > 0) {
              work.push({ type: "thinking" as const, steps: thinkingSteps });
            }
            
            // Add actual work items
            work.push(...currentWorkItems);
          }

          // Update the streaming message in real-time with work items only when relevant
          setMessages(prev => prev.map(m =>
            m.id === streamingId
              ? { 
                  ...m, 
                  content: fullContent.replace(/\*\*/g, ''), 
                  status: "thinking" as const,
                  work: work.length > 0 ? work : undefined
                }
              : m
          ));
        },
      onRetry: (attempt: number, delayMs: number) => {
        retryCount = attempt;
        // Update message to show retry status
        setMessages(prev => prev.map(m =>
          m.id === streamingId
            ? { ...m, content: `Rate limited. Retrying in ${delayMs / 1000}s... (attempt ${attempt}/5)`, status: "thinking" as const }
            : m
        ));
      }
    });

      const endTime = Date.now();
      const responseTimeSec = ((endTime - requestStartTime) / 1000).toFixed(1);

      // Update tokens and cost
      const newTokens = contextTokens() + (response.usage?.total_tokens || fullContent.length / 4);
      setContextTokens(Math.round(newTokens));
      const newCost = cost() + aiClient.calculateCost(
        response.usage?.prompt_tokens || text.length / 4,
        response.usage?.completion_tokens || fullContent.length / 4
      );
      setCost(newCost);
      
      // Check token budget and show alerts
      const usagePercent = newTokens / totalTokens();
      if (usagePercent >= CRITICAL_THRESHOLD && !budgetCriticalShown()) {
        setBudgetCriticalShown(true);
        setMessages(prev => [...prev, {
          id: prev.length + 1,
          role: "system",
          content: `⚠️ CRITICAL: Context is ${(usagePercent * 100).toFixed(0)}% full (${Math.round(newTokens).toLocaleString()}/${totalTokens().toLocaleString()} tokens). Use /prune to free up space.`,
          timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
        }]);
      } else if (usagePercent >= WARNING_THRESHOLD && !budgetWarningShown()) {
        setBudgetWarningShown(true);
        setMessages(prev => [...prev, {
          id: prev.length + 1,
          role: "system",
          content: `⚠️ WARNING: Context is ${(usagePercent * 100).toFixed(0)}% full (${Math.round(newTokens).toLocaleString()}/${totalTokens().toLocaleString()} tokens). Consider using /prune soon.`,
          timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
        }]);
      }
      
      // Reset warnings if usage drops
      if (usagePercent < WARNING_THRESHOLD) {
        setBudgetWarningShown(false);
        setBudgetCriticalShown(false);
      }

// Parse work items from the response
      const workItems = parseWorkItems(fullContent);
      
      // Finalize the message with work items
      setMessages(prev => {
        const currentMsg = prev.find(m => m.id === streamingId);
        const finalWork: WorkItem[] = [];
        
        // Keep thinking steps if they exist
        const existingThinking = currentMsg?.work?.find((w: WorkItem) => w.type === "thinking" && w.steps);
        if (existingThinking && existingThinking.steps) {
          // Mark all thinking steps as complete
          finalWork.push({
            type: "thinking" as const,
            steps: existingThinking.steps.map((s: ThinkingStep) => ({ ...s, status: "complete" as const }))
          });
        }
        
        // Add parsed work items
        finalWork.push(...workItems);
        
        return prev.map(m =>
          m.id === streamingId
            ? {
                ...m,
                content: fullContent.replace(/\*\*/g, ''),
                responseTime: `${responseTimeSec}s`,
                status: "complete",
                work: finalWork.length > 0 ? finalWork : undefined
              }
            : m
        );
      });

  } catch (error) {
    const endTime = Date.now();
    const responseTimeSec = ((endTime - requestStartTime) / 1000).toFixed(1);

    setMessages(prev => prev.map(m =>
      m.id === streamingId
        ? {
            ...m,
            content: `Error: ${error instanceof Error ? error.message : String(error)}`,
            responseTime: `${responseTimeSec}s`,
            status: "interrupted"
          }
        : m
    ));
  }

      setIsProcessing(false);
      setShowStreaming(false);
      setStreamingContent("");
      
      // Auto-save conversation to memory
      try {
        const { saveConversationToMemory } = await import("./skills/memory");
        const currentMsgs = messages();
        await saveConversationToMemory(
          currentMsgs.map(m => ({ role: m.role, content: m.content })),
          "current-session",
          currentMode()
        );
      } catch {
        // Memory save failed, continue silently
      }
    }

  const getMessageBorderColor = (msg: Message) => {
    const colors = agentColors();
    if (msg.role === "system") return colors.system;
    if (msg.role === "user") return colors.user;
    return colors[msg.agent as keyof typeof colors] || theme().accentBlue;
  };

// Format message content with markdown-like styling
const formatContent = (content: string): string => {
  if (!content) return "";
  // Remove markdown bold markers for display
  return content.replace(/\*\*/g, "");
};

// Wrap text to fit within terminal width
const wrapText = (text: string, maxWidth: number): string[] => {
  if (!text) return [];
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + word).length > maxWidth) {
      if (currentLine) {
        lines.push(currentLine.trim());
        currentLine = word + ' ';
      } else {
        // Word is longer than maxWidth, split it
        lines.push(word.slice(0, maxWidth));
        currentLine = word.slice(maxWidth) + ' ';
      }
    } else {
      currentLine += word + ' ';
    }
  }

  if (currentLine.trim()) {
    lines.push(currentLine.trim());
  }

  return lines;
};

// Parse work items from AI response
const parseWorkItems = (content: string): WorkItem[] => {
  const workItems: WorkItem[] = [];
  const lines = content.split('\n');
  
  // Look for file operations in the content
  const filePatterns = [
    // Edit patterns
    { regex: /(?:edited|modified|updated|changed)\s+(?:file\s+)?[`"]?(src\/[^`"\s]+)[`"]?/i, type: "edit" as const },
    { regex: /[`"]?(src\/[^`"\s]+\.tsx?)[`"]?\s*(?:→|->|→)\s*[`"]?[^`"]*[`"]?/i, type: "edit" as const },
    // Create patterns
    { regex: /(?:created|added|new)\s+(?:file\s+)?[`"]?(src\/[^`"\s]+)[`"]?/i, type: "create" as const },
    // Delete patterns
    { regex: /(?:deleted|removed)\s+(?:file\s+)?[`"]?(src\/[^`"\s]+)[`"]?/i, type: "delete" as const },
    // Command patterns
    { regex: /(?:running|executed|ran)\s+[``]?(npm|bun|node|git\s+\w+)[``]?/i, type: "command" as const },
  ];
  
  // Extract file operations
  for (const line of lines) {
    for (const pattern of filePatterns) {
      const match = line.match(pattern.regex);
      if (match && match[1]) {
        const file = match[1];
        // Check if we already have this file
        if (!workItems.some(w => w.file === file && w.type === pattern.type)) {
          workItems.push({
            type: pattern.type,
            file: file,
            description: line.trim().slice(0, 100)
          });
        }
      }
    }
  }
  
  // Look for code blocks that might indicate file content
  const codeBlockRegex = /```(?:typescript|tsx|ts)?\n([\s\S]*?)```/g;
  let codeMatch: RegExpExecArray | null;
  while ((codeMatch = codeBlockRegex.exec(content)) !== null) {
    const codeContent = codeMatch[1];
    if (!codeContent) continue;
    // Try to infer what file this code belongs to
    if (codeContent.includes('export function') || codeContent.includes('export const')) {
      // This might be a file edit
      const lineCount = codeContent.split('\n').length;
      const existingEdit = workItems.find(w => w.type === "edit");
      if (existingEdit) {
        existingEdit.additions = (existingEdit.additions || 0) + lineCount;
      }
    }
  }
  
  return workItems;
};

// Get relative time string
  const getRelativeTime = (timestamp: string): string => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return "just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString();
    } catch {
      return timestamp;
    }
  };

const contextPercent = () => Math.round((contextTokens() / totalTokens()) * 100);

const sidebarWidth = 38;
  const chatWidth = createMemo(() => Math.max(dimensions().width - sidebarWidth, 50));
  const pickerTop = createMemo(() => {
    const height = dimensions().height;
    // Center vertically in the chat area (accounting for header space)
    // Header takes ~3 rows, so effective height is less
    const effectiveHeight = height - 3;
    return Math.max(2, Math.floor(effectiveHeight / 2) - 6);
  });
  const pickerLeft = createMemo(() => {
    const width = chatWidth();
    // Center horizontally in chat area
    return Math.max(2, Math.floor((width - 50) / 2));
  });

  return (
    <box flexDirection="column" flexGrow={1} backgroundColor={theme().background}>
      {/* Header with WebSocket status */}
      <box flexDirection="row" justifyContent="space-between" padding={1} height={1}>
        {/* Left: WebSocket connection status */}
        <box flexDirection="row">
          <Show when={wsConnected()}>
            <text fg={theme().accentGreen}>● Connected</text>
          </Show>
          <Show when={!wsConnected()}>
            <text fg={theme().accentRed}>● Disconnected</text>
          </Show>
          <text fg={theme().textMuted}> | Server</text>
        </box>

        {/* Right: Model info */}
        <box flexDirection="row">
          <text fg={theme().textMuted}>Model: </text>
          <text fg={aiModels.find(m => m.id === currentModel())?.color || theme().accentBlue}>
            {aiModels.find(m => m.id === currentModel())?.name || currentModel()}
          </text>
        </box>
      </box>

      {/* Main content */}
      <box flexDirection="row" flexGrow={1}>
        {/* Left: Chat area */}
        <box flexDirection="column" width={chatWidth()} flexGrow={1} backgroundColor={theme().background}>
          {/* Messages - with adjusted left/right padding */}
          <scrollbox
            flexGrow={1}
            backgroundColor={theme().background}
            paddingLeft={3}
            paddingRight={1}
            verticalScrollbarOptions={{
              paddingLeft: 1,
              visible: true,
              trackOptions: {
                backgroundColor: theme().element,
                foregroundColor: theme().border,
              },
            }}
            stickyScroll={autoScroll()}
            stickyStart="bottom"
          >
            <For each={messages()}>
              {(msg) => (
                <box flexDirection="column" marginBottom={1}>
                  {/* Message header - only show responseTime when complete */}
                  <box flexDirection="row" marginBottom={1}>
                    <Show when={msg.role === "assistant" && msg.agentFullName}>
                      <text fg={theme().accentRed}>▣ </text>
                      <text fg={theme().text}>{msg.agentFullName}</text>
                      <text fg={theme().textMuted}> · </text>
                      <text fg={theme().textMuted}>{msg.model}</text>
                      <Show when={msg.responseTime}>
                        <text fg={theme().textMuted}> · {msg.responseTime}</text>
                      </Show>
                    </Show>
                    <Show when={msg.role === "user"}>
                      <text fg={theme().accentBlue}>You</text>
                      <text fg={theme().textMuted}> · {msg.timestamp}</text>
                    </Show>
                    <Show when={msg.role === "system"}>
                      <text fg={theme().textDim}>System</text>
                      <text fg={theme().textMuted}> · {msg.timestamp}</text>
                    </Show>
                  </box>

              {/* Message content */}
              <Show when={msg.role === "user"}>
                <box flexDirection="row" marginBottom={1}>
                  <box width={1} backgroundColor={agentColors()[currentMode() as keyof ReturnType<typeof agentColors>]} flexShrink={0} />
                  <box flexDirection="column" flexGrow={1} backgroundColor={theme().element} padding={1}>
                    <text fg={theme().text} wrapMode="word">{msg.content}</text>
                  </box>
                </box>
              </Show>

            <Show when={msg.role === "assistant"}>
              <box flexDirection="column" marginLeft={1}>
                <Show when={msg.content}>
                  <box flexDirection="column" marginBottom={1}>
                    <text fg={theme().text} wrapMode="word">{msg.content}</text>
                  </box>
                </Show>

      <Show when={msg.attachments && msg.attachments.length > 0}>
        <box flexDirection="row">
          <For each={msg.attachments}>
            {(att) => (
              <box flexDirection="row" marginRight={1} backgroundColor={theme().accentOrange} paddingLeft={1} paddingRight={1}>
                <text fg={theme().text}>{att.label}</text>
              </box>
            )}
          </For>
</box>
    </Show>

{/* Thinking Block - only show in verbose mode */}
              <Show when={verboseMode() && msg.work && msg.work.some(w => w.type === "thinking" && w.steps && w.steps.length > 0)}>
                <box flexDirection="column" marginLeft={1} marginBottom={1}>
                  <box flexDirection="row" marginBottom={1}>
                    <text fg={theme().textMuted}>▼ </text>
                    <text fg={theme().textMuted}>Thinking</text>
                  </box>
                  <For each={msg.work?.filter(w => w.type === "thinking" && w.steps).flatMap(w => w.steps || [])}>
                    {(step) => (
                      <box flexDirection="row" marginLeft={2} marginBottom={0}>
                        <text fg={step.status === "complete" ? theme().accentGreen : step.status === "running" ? theme().accentOrange : theme().textMuted}>
                          {step.status === "complete" ? "✓ " : step.status === "running" ? "● " : "○ "}
                        </text>
                        <text fg={theme().textMuted}>{step.description}</text>
                      </box>
                    )}
                  </For>
                </box>
              </Show>

              {/* Work Items Block - only show in verbose mode */}
              <Show when={verboseMode() && msg.work && msg.work.some(w => w.type === "edit" || w.type === "create" || w.type === "delete" || w.type === "command")}>
                <box flexDirection="column" marginLeft={1} marginTop={1} backgroundColor={theme().element} padding={1}>
                  <text fg={theme().primary} marginBottom={1}><strong>Changes</strong></text>
                  <For each={msg.work?.filter(w => w.type === "edit" || w.type === "create" || w.type === "delete" || w.type === "command")}>
                    {(item) => (
                      <box flexDirection="column" marginBottom={1}>
                        <box flexDirection="row">
                          <text fg={item.type === "edit" ? theme().accentYellow : item.type === "create" ? theme().accentGreen : item.type === "delete" ? theme().accentRed : theme().accentBlue}>
                            {item.type === "edit" ? "✎ " : item.type === "create" ? "+ " : item.type === "delete" ? "- " : "▶ "}
                          </text>
                          <Show when={item.file}>
                            <text fg={theme().text}>{item.file}</text>
                          </Show>
                          <Show when={item.additions !== undefined && item.deletions !== undefined}>
                            <text fg={theme().accentGreen}> +{String(item.additions)}</text>
                            <text fg={theme().accentRed}> -{String(item.deletions)}</text>
                          </Show>
                        </box>
                        <Show when={item.description}>
                          <text fg={theme().textMuted} marginLeft={2}>{item.description}</text>
                        </Show>
                        <Show when={item.output}>
                          <box flexDirection="column" marginLeft={2} marginTop={1} backgroundColor={theme().background} padding={1}>
                            <For each={item.output?.split('\n').slice(0, 5)}>
                              {(line) => <text fg={theme().textDim}>{line}</text>}
                            </For>
                            <Show when={item.output && item.output.split('\n').length > 5}>
                              <text fg={theme().textMuted}>... ({String((item.output?.split('\n').length || 0) - 5)} more lines)</text>
                            </Show>
                          </box>
                        </Show>
                      </box>
                    )}
                  </For>
                </box>
              </Show>
    </box>
    </Show>

<Show when={msg.role === "system"}>
      <text fg={theme().textMuted}>{msg.content}</text>
    </Show>
    </box>
  )}
</For>
</scrollbox>

      {/* Input area - Opencode style */}
      <box flexDirection="column" backgroundColor={theme().background} flexShrink={0} paddingLeft={2} paddingRight={2}>
        {/* Command suggestions dropdown - appears above input */}
        <Show when={showCommandSuggestions()}>
          <box
            flexDirection="column"
            width={chatWidth() - 6}
            maxHeight={8}
            backgroundColor={theme().surface}
            paddingLeft={1}
            paddingRight={1}
            paddingTop={1}
            paddingBottom={1}
            marginBottom={1}
          >
            <text fg={theme().primary} marginBottom={1}><strong>Commands</strong></text>
            <For each={Object.entries(commands).filter(([cmd]) =>
              cmd.toLowerCase().startsWith("/" + commandFilter().toLowerCase())
            ).slice(0, 5)}>
              {([cmd, info], idx) => (
                <box
                  flexDirection="row"
                  marginBottom={0}
                  paddingLeft={1}
                  paddingRight={1}
                  backgroundColor={idx() === selectedCommandIndex() ? theme().element : theme().surface}
                >
                  <text fg={idx() === selectedCommandIndex() ? theme().accentYellow : theme().accentBlue}>{cmd}</text>
                  <text fg={theme().textMuted} marginLeft={2}>{info.description.slice(0, 40)}</text>
                </box>
              )}
            </For>
            <text fg={theme().textDim} marginTop={1}>↑↓ navigate · Enter select</text>
          </box>
        </Show>

{/* Grey input box with colored left border - minimal gap */}
            <box flexDirection="row">
              {/* Thin colored left border */}
              <box width={1} backgroundColor={agentColors()[currentMode() as keyof ReturnType<typeof agentColors>]} flexShrink={0} />
              {/* Grey box - no margin, flush with border */}
              <box flexDirection="column" flexGrow={1} backgroundColor={theme().element}>
                {/* Input field - completely removed when overlay is open */}
                <Show when={activeOverlay() === "none"}>
                  <WrappedInput
                    value={input()}
                    onInput={setInput}
                    onSubmit={handleSubmit}
                    placeholder={isProcessing() ? "Remi is thinking..." : "Type a message..."}
                    maxWidth={Math.max(chatWidth() - 12, 50)}
                    backgroundColor={theme().element}
                    textColor={theme().text}
                    cursorColor={theme().primary}
                  />
                </Show>
                <Show when={activeOverlay() !== "none"}>
                  <box flexDirection="column" padding={1}>
                    <text fg={theme().textDim}>
                      {activeOverlay() === "model" ? "Use picker above..." :
                       activeOverlay() === "mode" ? "Select a mode..." :
                       activeOverlay() === "session" ? "Select a session..." :
                       activeOverlay() === "file" ? "Select a file..." :
                       activeOverlay() === "apikey" ? "Enter API key..." :
                       activeOverlay() === "theme" ? "Select a theme..." :
                       "..."}
                    </text>
                  </box>
                </Show>
                {/* Agent info at bottom left */}
                <box flexDirection="row" paddingLeft={1} paddingBottom={1}>
                  <text fg={agentColors()[currentMode() as keyof ReturnType<typeof agentColors>]}>Remi-V2 </text>
                  <text fg={theme().text}>
                    {aiModels.find(m => m.id === currentModel())?.name || currentModel()}
                  </text>
                  <text fg={theme().textMuted}> {aiModels.find(m => m.id === currentModel())?.provider || 'Nvidia'}</text>
                </box>
              </box>
            </box>

        {/* Bottom bar - thinking left, shortcuts right */}
        <box flexDirection="row" justifyContent="space-between" paddingTop={1} paddingBottom={1}>
          {/* Left: Thinking indicator with animated dots */}
          <Show when={isProcessing()}>
            <box flexDirection="row">
              <text fg={theme().accentOrange}>○</text>
              <text fg={theme().textMuted} marginLeft={1}>Thinking{thinkingDots()}</text>
              <text fg={theme().textMuted} marginLeft={2}>esc</text>
              <text fg={theme().textMuted} marginLeft={1}>interrupt</text>
            </box>
          </Show>
          <Show when={!isProcessing()}>
            <box flexDirection="row">
              <text fg={theme().textMuted}>Ready</text>
            </box>
          </Show>
          
          {/* Right: Shortcuts */}
          <box flexDirection="row">
            <text fg={isProcessing() ? theme().textDim : theme().primary}>tab</text>
            <text fg={theme().textMuted}> agents </text>
            <text fg={isProcessing() ? theme().textDim : theme().primary}>ctrl+p</text>
            <text fg={theme().textMuted}> commands</text>
          </box>
        </box>
      </box>
    </box>

{/* Right: Sidebar */}
      <box flexDirection="column" width={sidebarWidth} padding={1} paddingTop={0} backgroundColor={theme().background}>
        {/* Page Tabs */}
        <box flexDirection="row" marginBottom={1}>
          <box 
            flexDirection="row" 
            paddingLeft={1} 
            paddingRight={1} 
            backgroundColor={sidebarPage() === "info" ? theme().element : theme().background}
            borderStyle={sidebarPage() === "info" ? "single" : undefined}
            borderColor={sidebarPage() === "info" ? theme().primary : undefined}
          >
            <text fg={sidebarPage() === "info" ? theme().primary : theme().textMuted}>Info</text>
          </box>
          <box 
            flexDirection="row" 
            paddingLeft={1} 
            paddingRight={1} 
            marginLeft={1}
            backgroundColor={sidebarPage() === "files" ? theme().element : theme().background}
            borderStyle={sidebarPage() === "files" ? "single" : undefined}
            borderColor={sidebarPage() === "files" ? theme().primary : undefined}
          >
            <text fg={sidebarPage() === "files" ? theme().primary : theme().textMuted}>Files</text>
          </box>
        </box>

        {/* Info Page */}
        <Show when={sidebarPage() === "info"}>
          <box flexDirection="column" flexGrow={1}>
            <box flexDirection="column" marginBottom={1}>
              <text fg={theme().text}><strong>{sessionTitle()}</strong></text>
            </box>

            <box flexDirection="column" marginBottom={1}>
              <text fg={theme().text}><strong>Context</strong></text>
              <text fg={theme().textMuted}>{contextTokens().toLocaleString()} tokens</text>
              <text fg={contextPercent() >= 95 ? theme().accentRed : contextPercent() >= 80 ? theme().accentYellow : theme().textMuted}>{contextPercent()}% used</text>
              <text fg={theme().textMuted}>${cost().toFixed(2)} spent</text>
              <Show when={contextPercent() >= 80}>
                <text fg={contextPercent() >= 95 ? theme().accentRed : theme().accentYellow}>⚠️ Use /prune or /compress</text>
              </Show>
            </box>

      <box flexDirection="column" marginBottom={1}>
        <text fg={theme().text}><strong>LSP</strong></text>
        <box flexDirection="row">
          <text fg={theme().accentGreen}>• </text>
          <text fg={theme().textMuted}>typescript Downloads/wzrd-tui</text>
        </box>
      </box>

      {/* WebSocket Connection Status */}
      <box flexDirection="column" marginBottom={1}>
        <text fg={theme().primary}><strong>WebSocket</strong></text>
        <Show when={wsConnected()}>
          <box flexDirection="row">
            <text fg={theme().accentGreen}>● </text>
            <text fg={theme().accentGreen}>Connected</text>
          </box>
          <text fg={theme().textMuted}>100.118.174.102</text>
        </Show>
        <Show when={!wsConnected()}>
          <box flexDirection="row">
            <text fg={theme().accentRed}>● </text>
            <text fg={theme().accentRed}>Disconnected</text>
          </box>
          <text fg={theme().textMuted}>{wsStatus()}</text>
        </Show>
      </box>

<box flexDirection="column" marginBottom={1}>
              <text fg={theme().primary}><strong>Agent Modes</strong></text>
              <For each={agentModes()}>
                {(mode) => (
                  <box flexDirection="row" alignItems="center" marginBottom={0}>
                    <box width={2} height={1} backgroundColor={mode.color} marginRight={1} />
                    <text fg={currentMode() === mode.id ? theme().text : theme().textMuted}>{mode.name}</text>
                  </box>
                )}
              </For>
            </box>

            <box flexDirection="column" marginBottom={1}>
              <text fg={theme().primary}><strong>Models</strong></text>
              <For each={aiModels}>
                {(model) => (
                  <box flexDirection="row" alignItems="center" marginBottom={0}>
                    <box width={2} height={1} backgroundColor={model.color} marginRight={1} />
                    <text fg={currentModel() === model.id ? theme().text : theme().textMuted}>{model.name}</text>
                    <text fg={theme().textDim} marginLeft={1}>{model.provider}</text>
                  </box>
                )}
              </For>
            </box>

            <box flexDirection="column" marginBottom={1}>
              <text fg={theme().primary}><strong>Skills</strong></text>
              <For each={skills()}>
                {(skill) => (
                  <box flexDirection="row" alignItems="center" marginBottom={0}>
                    <box width={2} height={1} backgroundColor={skill.color} marginRight={1} />
                    <text fg={theme().textMuted}>{skill.name}</text>
                  </box>
                )}
              </For>
            </box>

            <box flexDirection="column" marginBottom={1}>
              <text fg={theme().primary}><strong>Attached</strong></text>
              <Show when={attachedFiles().length > 0}>
                <For each={attachedFiles()}>
                  {(file) => (
                    <box flexDirection="row">
                      <text fg={theme().accentBlue}>• </text>
                      <text fg={theme().textMuted}>{file.path} ({(file.size / 1024).toFixed(1)}KB)</text>
                    </box>
                  )}
                </For>
              </Show>
              <Show when={attachedFiles().length === 0}>
                <text fg={theme().textDim}>Type /attach to add files</text>
              </Show>
            </box>

            <box flexDirection="column" marginBottom={1}>
              <text fg={theme().primary}><strong>NIM API</strong></text>
              <Show when={nimConnected()}>
                <text fg={theme().accentGreen}>Connected</text>
              </Show>
              <Show when={!nimConnected()}>
                <text fg={theme().textMuted}>{nimStatusMessage()}</text>
              </Show>
            </box>

            <box flexDirection="column">
              <text fg={theme().primary}><strong>Getting Started</strong></text>
              <text fg={theme().textMuted}>Type /help for commands</text>
              <text fg={theme().textMuted}>Press Tab to switch modes</text>
            </box>
          </box>
        </Show>

{/* Files Page */}
      <Show when={sidebarPage() === "files"}>
        <box flexDirection="column" flexGrow={1}>
          <box flexDirection="column" marginBottom={1}>
            <text fg={theme().text}><strong>Files</strong></text>
            <text fg={theme().textDim}>{fileBrowserPath()}</text>
          </box>
          
          <box flexDirection="column" flexGrow={1}>
            <Show when={fileBrowserLoaded()}>
              <scrollbox 
                flexGrow={1}
                stickyScroll={true}
                stickyStart="top"
              >
                <For each={fileBrowserEntries()}>
                  {(entry, idx) => (
                    <box 
                      flexDirection="row" 
                      paddingLeft={entry.depth + 1}
                      backgroundColor={idx() === browserSelectedIndex() ? theme().element : theme().background}
                    >
                      <text fg={entry.isDirectory ? theme().accentYellow : theme().textMuted}>
                        {entry.isDirectory ? (expandedDirs().has(entry.path) ? "▼ " : "▶ ") : "  "}
                      </text>
                      <text fg={idx() === browserSelectedIndex() ? theme().primary : theme().textMuted}>
                        {entry.name.length > 25 ? entry.name.slice(0, 22) + "..." : entry.name}
                      </text>
                      <Show when={entry.isDirectory}>
                        <text fg={theme().textDim}>/</text>
                      </Show>
                    </box>
                  )}
                </For>
              </scrollbox>
            </Show>
            <Show when={!fileBrowserLoaded()}>
              <text fg={theme().textDim}>Type /files to load</text>
            </Show>
          </box>
          
          <box flexDirection="column" marginTop={1}>
            <text fg={theme().textDim}>↑↓ navigate · Enter/Space</text>
          </box>
        </box>
      </Show>
      </box>
      </box>

      {/* Command palette overlay */}
      <Show when={showCommands()}>
        <box
          flexDirection="column"
          position="absolute"
          top={10}
          left={10}
          width={60}
          backgroundColor={theme().element}
          padding={2}
          borderStyle="single"
          borderColor={theme().border}
        >
          <text fg={theme().primary} marginBottom={1}><strong>Commands</strong></text>
          <For each={Object.entries(commands)}>
            {([cmd, info]) => (
              <box flexDirection="row" marginBottom={0.5}>
                <text fg={theme().accentBlue}>{cmd.padEnd(12)}</text>
                <text fg={theme().textMuted}>{info.description}</text>
              </box>
            )}
          </For>
          <text fg={theme().textDim} marginTop={1}>Press Ctrl+P to close</text>
        </box>
      </Show>

{/* Model picker overlay - centered in chat area */}
    <Show when={showModelPicker()}>
      <box
        flexDirection="column"
        position="absolute"
        top={0}
        left={0}
        width={chatWidth()}
        height={dimensions().height - 8}
        justifyContent="center"
        alignItems="center"
      >
        <box
          flexDirection="column"
          width={50}
          backgroundColor={theme().surface}
          padding={2}
          borderStyle="single"
          borderColor={theme().border}
        >
          <box flexDirection="row" justifyContent="space-between" marginBottom={1}>
            <text fg={theme().primary}><strong>Select model</strong></text>
            <text fg={theme().textDim}>esc</text>
          </box>

{/* Search - shows current filter */}
        <box flexDirection="row" marginBottom={1}>
          <text fg={theme().accentYellow}>Search: </text>
          <text fg={theme().text}>{modelPickerFilter() || "_"}</text>
        </box>

          {/* Recent section */}
          <text fg={theme().accentPurple} marginBottom={1}><strong>Recent</strong></text>
          <box flexDirection="row" marginBottom={1} backgroundColor={currentModel() === "kimi-k2.5" ? theme().element : theme().surface}>
            <text fg={currentModel() === "kimi-k2.5" ? theme().accentYellow : theme().text}>● Kimi K2.5 Nvidia</text>
          </box>

{/* All models grouped by provider - with scrolling */}
        <box flexDirection="column" maxHeight={maxVisibleModels}>
          {(() => {
            // Get all filtered models first
            const filteredModels = aiModels.filter(m =>
              m.name.toLowerCase().includes(modelPickerFilter().toLowerCase()) ||
              m.id.toLowerCase().includes(modelPickerFilter().toLowerCase())
            );
            
            // Calculate visible range based on filtered list
            const scrollOffset = modelPickerScrollOffset();
            const visibleStart = scrollOffset;
            const visibleEnd = scrollOffset + maxVisibleModels;
            const visibleModels = filteredModels.slice(visibleStart, visibleEnd);
            
return (
                      <For each={providers()}>
                        {(provider) => {
                          const providerModels = visibleModels.filter(m => m.provider === provider.id);
                          if (providerModels.length === 0) return null;

                          return (
                            <>
                              <text fg={provider.color} marginTop={1} marginBottom={1}><strong>{provider.name}</strong></text>
                              <For each={providerModels}>
                                {(model) => {
                                  const filteredIdx = filteredModels.findIndex(m => m.id === model.id);
                                  const pricing = modelPricing[model.id];
                                  const costText = pricing?.free
                                    ? "FREE"
                                    : pricing?.subscription
                                    ? "SUBSCRIPTION"
                                    : `$${pricing?.input || 0}/${pricing?.output || 0} per 1M`;
                                  const costColor = pricing?.free
                                    ? theme().accentGreen
                                    : pricing?.subscription
                                    ? theme().accentBlue
                                    : theme().textMuted;
                                  return (
                                    <box
                                      flexDirection="row"
                                      marginBottom={0}
                                      paddingLeft={1}
                                      backgroundColor={filteredIdx === selectedModelIndex() ? theme().element : theme().surface}
                                    >
                                      <text fg={filteredIdx === selectedModelIndex() ? theme().accentYellow : theme().text}>{model.name}</text>
                                      <text fg={costColor} marginLeft={1}>{costText}</text>
                                    </box>
                                  );
                                }}
                              </For>
                            </>
                          );
                        }}
                      </For>
                    );
            })()}
            </box>

            {/* Scroll indicator - shows filtered count */}
            {(() => {
              const filteredModels = aiModels.filter(m =>
                m.name.toLowerCase().includes(modelPickerFilter().toLowerCase()) ||
                m.id.toLowerCase().includes(modelPickerFilter().toLowerCase())
              );
              const totalFiltered = filteredModels.length;
              return (
                <Show when={totalFiltered > maxVisibleModels}>
                  <text fg={theme().textDim} marginTop={1}>
                    {modelPickerScrollOffset() + 1}-{Math.min(modelPickerScrollOffset() + maxVisibleModels, totalFiltered)} of {totalFiltered} (filtered)
                  </text>
                </Show>
              );
            })()}

<text fg={theme().textDim} marginTop={1}>↑↓ navigate · Enter select · ctrl+a providers</text>
        </box>
      </box>
    </Show>

    {/* Provider view overlay */}
    <Show when={showProviderView()}>
      <box
        flexDirection="column"
        position="absolute"
        top={pickerTop()}
        left={pickerLeft()}
        width={50}
        backgroundColor={theme().surface}
        padding={2}
        borderStyle="single"
        borderColor={theme().border}
      >
        <box flexDirection="row" justifyContent="space-between" marginBottom={1}>
          <text fg={theme().primary}><strong>Select provider</strong></text>
          <text fg={theme().textDim}>esc</text>
        </box>

        <For each={Object.values(aiProviders)}>
          {(provider, idx) => {
            const envKey = process.env[provider.apiKeyEnv];
            const hasKey = !!envKey || provider.id === "nvidia";
            return (
              <box
                flexDirection="row"
                marginBottom={0}
                paddingLeft={1}
                backgroundColor={idx() === selectedProviderIndex() ? theme().element : theme().surface}
              >
                <text fg={idx() === selectedProviderIndex() ? theme().accentYellow : theme().text}>{provider.name}</text>
                <text fg={hasKey ? theme().accentGreen : theme().accentRed} marginLeft={1}>{hasKey ? "✓" : "✗"}</text>
                <text fg={theme().textMuted} marginLeft={1}>{hasKey ? "Ready" : "Needs key"}</text>
              </box>
            );
          }}
        </For>

        <text fg={theme().textDim} marginTop={1}>↑↓ navigate · Enter select · esc back</text>
      </box>
    </Show>

    {/* Mode picker overlay */}
    <Show when={showModePicker()}>
      <box
        flexDirection="column"
        position="absolute"
        top={pickerTop()}
        left={pickerLeft()}
        width={40}
        backgroundColor={theme().surface}
        padding={2}
        borderStyle="single"
        borderColor={theme().border}
      >
        <box flexDirection="row" justifyContent="space-between" marginBottom={1}>
          <text fg={theme().primary}><strong>Select mode</strong></text>
          <text fg={theme().textDim}>esc</text>
        </box>

<For each={agentModes()}>
                {(mode, idx) => (
                  <box
                    flexDirection="row"
                    marginBottom={0}
                    paddingLeft={1}
                    backgroundColor={idx() === selectedModeIndex() ? theme().element : theme().surface}
                  >
                    <box width={2} height={1} backgroundColor={mode.color} marginRight={1} />
                    <text fg={idx() === selectedModeIndex() ? theme().accentYellow : theme().text}>{mode.name}</text>
                  </box>
                )}
              </For>

        <text fg={theme().textDim} marginTop={1}>↑↓ navigate · Enter select</text>
      </box>
    </Show>

    {/* Session picker overlay */}
    <Show when={showSessionPicker()}>
      <box
        flexDirection="column"
        position="absolute"
        top={pickerTop()}
        left={pickerLeft()}
        width={60}
        maxHeight={15}
        backgroundColor={theme().surface}
        padding={2}
        borderStyle="single"
        borderColor={theme().border}
      >
        <box flexDirection="row" justifyContent="space-between" marginBottom={1}>
          <text fg={theme().primary}><strong>Select session</strong></text>
          <text fg={theme().textDim}>esc</text>
        </box>

        <For each={availableSessions()}>
          {(session, idx) => (
            <box
              flexDirection="row"
              marginBottom={0}
              paddingLeft={1}
              backgroundColor={idx() === selectedSessionIndex() ? theme().element : theme().surface}
            >
              <text fg={idx() === selectedSessionIndex() ? theme().accentYellow : theme().text}>{session.title}</text>
              <text fg={theme().textMuted} marginLeft={1}>({new Date(session.updatedAt).toLocaleDateString()})</text>
            </box>
          )}
        </For>

        <text fg={theme().textDim} marginTop={1}>↑↓ navigate · Enter select</text>
      </box>
    </Show>

    {/* File picker overlay */}
    <Show when={showFilePicker()}>
      <box
        flexDirection="column"
        position="absolute"
        top={pickerTop()}
        left={pickerLeft()}
        width={60}
        maxHeight={20}
        backgroundColor={theme().surface}
        padding={2}
        borderStyle="single"
        borderColor={theme().border}
      >
        <box flexDirection="row" justifyContent="space-between" marginBottom={1}>
          <text fg={theme().primary}><strong>Select file</strong></text>
          <text fg={theme().textDim}>esc</text>
        </box>

        <For each={availableFiles()}>
          {(file, idx) => (
            <box
              flexDirection="row"
              marginBottom={0}
              paddingLeft={1}
              backgroundColor={idx() === selectedFileIndex() ? theme().element : theme().surface}
            >
              <text fg={idx() === selectedFileIndex() ? theme().accentYellow : theme().text}>{file}</text>
            </box>
          )}
        </For>

        <text fg={theme().textDim} marginTop={1}>↑↓ navigate · Enter select</text>
      </box>
    </Show>

    {/* API Key Input Overlay */}
    <Show when={showApiKeyInput()}>
      <box
        flexDirection="column"
        position="absolute"
        top={pickerTop()}
        left={pickerLeft()}
        width={60}
        backgroundColor={theme().surface}
        padding={2}
        borderStyle="single"
        borderColor={theme().border}
      >
        <box flexDirection="row" justifyContent="space-between" marginBottom={1}>
          <text fg={theme().primary}><strong>Enter API Key</strong></text>
          <text fg={theme().textDim}>esc</text>
        </box>
        
        <text fg={theme().textMuted} marginBottom={1}>
          {aiProviders[apiKeyProvider() as keyof typeof aiProviders]?.name || apiKeyProvider()} requires an API key
        </text>
        
        <box flexDirection="column" backgroundColor={theme().element} padding={1} marginBottom={1}>
          <input
            placeholder="Paste your API key here..."
            value={apiKeyInput()}
            onInput={setApiKeyInput}
            onSubmit={() => {}}
            backgroundColor={theme().element}
            flexGrow={1}
          />
        </box>
        
<text fg={theme().textDim}>Press Enter to save · Escape to cancel</text>
      </box>
    </Show>

    {/* Theme picker overlay */}
    <Show when={showThemePicker()}>
      <box
        flexDirection="column"
        position="absolute"
        top={pickerTop()}
        left={pickerLeft()}
        width={40}
        backgroundColor={theme().surface}
        padding={2}
        borderStyle="single"
        borderColor={theme().border}
      >
        <box flexDirection="row" justifyContent="space-between" marginBottom={1}>
          <text fg={theme().primary}><strong>Select theme</strong></text>
          <text fg={theme().textDim}>esc</text>
        </box>

        <box
          flexDirection="row"
          marginBottom={0}
          paddingLeft={1}
          backgroundColor={selectedThemeIndex() === 0 ? theme().element : theme().surface}
        >
          <text fg={selectedThemeIndex() === 0 ? theme().accentYellow : theme().text}>Dark</text>
          <text fg={theme().textMuted} marginLeft={1}>(default)</text>
        </box>

        <box
          flexDirection="row"
          marginBottom={0}
          paddingLeft={1}
          backgroundColor={selectedThemeIndex() === 1 ? theme().element : theme().surface}
        >
          <text fg={selectedThemeIndex() === 1 ? theme().accentYellow : theme().text}>Light</text>
        </box>

        <text fg={theme().textDim} marginTop={1}>↑↓ navigate · Enter select</text>
      </box>
    </Show>

  </box>
  );
}

render(() => <WZRDOpencodeClone />);
