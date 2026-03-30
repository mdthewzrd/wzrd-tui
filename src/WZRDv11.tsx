// WZRD TUI v1.1 - Phase 6 Enhancements
// Features: Plan Mode, Extended Thinking, Session Names, @ References, Skills System, Image Support, CLAUDE.md

import { render, useKeyboard, useTerminalDimensions } from "@opentui/solid";
import { createSignal, createEffect, createMemo, For, Show } from "solid-js";
import { VisionSkill } from "./skills/vision";
import { fileSkill } from "./skills/files";
import { shellSkill } from "./skills/shell";
import { searchSkill } from "./skills/search";
import { gitSkill } from "./skills/git";
import { saveSession, loadSession, listSessions, autoSave, getStorageStats, getMostRecentSession, deleteSession } from "./storage";
import { aiClient, isAIConfigured, checkAIStatus, providers as aiProviders, modelIds, type ChatMessage } from "./api/providers";
import { getApiKey, setApiKey, loadApiKeysToEnv } from "./config";
import { getSystemPrompt, getPlanModePrompt } from "./agents/prompts";

// Theme colors
const theme = {
  background: "#0a0a0a",
  surface: "#141414",
  element: "#1e1e1e",
  text: "#eeeeee",
  textMuted: "#808080",
  textDim: "#666666",
  primary: "#fab283",
  accentBlue: "#6ba4ff",
  accentPurple: "#d06efa",
  accentGreen: "#4cd964",
  accentOrange: "#ff9500",
  accentRed: "#ff6b6b",
  accentYellow: "#f4d03f",
  accentGold: "#ffd700",
  accentCyan: "#00d4aa",
  border: "#2a2a2a",
  diffOld: "#2d1f1f",
  diffNew: "#1f2d1f",
};

const agentColors: Record<string, string> = {
  remi: theme.accentRed,
  plan: theme.accentGreen,
  build: theme.accentOrange,
  system: theme.textDim,
  user: theme.accentBlue,
};

const agentModes = [
  { id: "remi", name: "Remi", description: "General purpose assistant", color: theme.accentRed },
  { id: "plan", name: "Plan", description: "Read-only analysis mode", color: theme.accentGreen },
  { id: "build", name: "Build", description: "Code generation mode", color: theme.accentOrange },
];

const skills = [
  { id: "vision", name: "Vision", description: "Screenshot analysis", color: theme.accentPurple },
  { id: "git", name: "Git", description: "Version control", color: theme.accentOrange },
  { id: "memory", name: "Memory", description: "7-layer memory", color: theme.accentBlue },
  { id: "custom", name: "Custom", description: "User skills", color: theme.accentCyan },
];

const providers = [
  { id: "nvidia", name: "Nvidia NIM", color: theme.accentGreen },
  { id: "zai", name: "Z AI", color: theme.accentBlue },
  { id: "openrouter", name: "OpenRouter", color: theme.accentPurple },
];

const modelPricing: Record<string, { input: number; output: number; free?: boolean; subscription?: boolean }> = {
  "kimi-k2.5": { input: 0, output: 0, free: true },
  "kimi-k2-instruct": { input: 0, output: 0, free: true },
  "deepseek-v3.2": { input: 0, output: 0, free: true },
  "nemotron-3-super": { input: 0, output: 0, free: true },
  "qwen-3.5-122b": { input: 0, output: 0, free: true },
  "glm-4.7": { input: 0, output: 0, subscription: true },
  "glm-5": { input: 0, output: 0, subscription: true },
  "grok-4.1": { input: 0.20, output: 0.50 },
  "minimax-m2.5": { input: 0, output: 0, free: true },
  "qwen-coder-3-480b": { input: 0, output: 0, free: true },
  "gemini-2.5-flash": { input: 0.30, output: 2.50 },
};

const aiModels = [
  { id: "kimi-k2.5", name: "Kimi K2.5", provider: "nvidia", color: theme.accentBlue, supportsThinking: true },
  { id: "deepseek-v3.2", name: "DeepSeek V3.2", provider: "nvidia", color: theme.accentPurple, supportsThinking: true },
  { id: "qwen-3.5-122b", name: "Qwen 3.5 122B", provider: "nvidia", color: theme.accentGreen, supportsThinking: true },
  { id: "glm-4.7", name: "GLM 4.7", provider: "zai", color: theme.accentGreen, supportsThinking: true },
  { id: "glm-5", name: "GLM 5", provider: "zai", color: theme.accentGreen, supportsThinking: true },
  { id: "grok-4.1", name: "Grok 4.1", provider: "openrouter", color: theme.accentOrange, supportsThinking: true },
  { id: "minimax-m2.5", name: "Minimax M2.5", provider: "openrouter", color: theme.accentPurple, supportsThinking: false },
  { id: "qwen-coder-3-480b", name: "Qwen Coder 3 480B", provider: "openrouter", color: theme.accentGreen, supportsThinking: true },
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", provider: "openrouter", color: theme.accentYellow, supportsThinking: true },
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
  lines?: number;
  additions?: number;
  deletions?: number;
  output?: string;
  exitCode?: number;
  steps?: ThinkingStep[];
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

interface CustomSkill {
  name: string;
  description: string;
  pattern: RegExp;
  handler: (args: string[]) => Promise<string>;
}

interface ClaudeMdConfig {
  projectName: string;
  description: string;
  instructions: string[];
  rules: string[];
  context: Record<string, string>;
}

interface SessionData {
  id: string;
  title: string;
  updatedAt: string;
}

function WZRDv11() {
  // Core state
  const [currentMode, setCurrentMode] = createSignal("remi");
  const [currentModel, setCurrentModel] = createSignal("kimi-k2.5");
  const [input, setInput] = createSignal("");
  const [nimConnected, setNimConnected] = createSignal(false);
  const [nimStatusMessage, setNimStatusMessage] = createSignal("Checking...");
  const [sessionTitle, setSessionTitle] = createSignal("New Session");
  const [vision] = createSignal(new VisionSkill());
  const [contextTokens, setContextTokens] = createSignal(0);
  const [totalTokens, setTotalTokens] = createSignal(128000);
  const [cost, setCost] = createSignal(0);
  const [budgetWarningShown, setBudgetWarningShown] = createSignal(false);
  const [budgetCriticalShown, setBudgetCriticalShown] = createSignal(false);
  const WARNING_THRESHOLD = 0.8;
  const CRITICAL_THRESHOLD = 0.95;
  const [isProcessing, setIsProcessing] = createSignal(false);
  const [thinkingDots, setThinkingDots] = createSignal("");
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
  const [showModePicker, setShowModePicker] = createSignal(false);
  const [selectedModeIndex, setSelectedModeIndex] = createSignal(0);
  const [showSessionPicker, setShowSessionPicker] = createSignal(false);
  const [selectedSessionIndex, setSelectedSessionIndex] = createSignal(0);
  const [availableSessions, setAvailableSessions] = createSignal<SessionData[]>([]);
  const [showFilePicker, setShowFilePicker] = createSignal(false);
  const [selectedFileIndex, setSelectedFileIndex] = createSignal(0);
  const [availableFiles, setAvailableFiles] = createSignal<string[]>([]);
  const [filePickerMode, setFilePickerMode] = createSignal<"read" | "edit" | "attach">("read");
  const [activeOverlay, setActiveOverlay] = createSignal<"none" | "model" | "mode" | "session" | "file" | "apikey" | "rename">("none");
  const [showApiKeyInput, setShowApiKeyInput] = createSignal(false);
  const [apiKeyProvider, setApiKeyProvider] = createSignal<string>("");
  const [attachedFiles, setAttachedFiles] = createSignal<{path: string; content: string; size: number}[]>([]);
  const [apiKeyInput, setApiKeyInput] = createSignal("");
  const [showProviderView, setShowProviderView] = createSignal(false);
  const [selectedProviderIndex, setSelectedProviderIndex] = createSignal(0);
  const [modelPickerScrollOffset, setModelPickerScrollOffset] = createSignal(0);
  const maxVisibleModels = 15;
  const dimensions = useTerminalDimensions();

  // Phase 6: Extended Thinking toggle
  const [extendedThinking, setExtendedThinking] = createSignal(false);

  // Phase 6: Session rename state
  const [renameInput, setRenameInput] = createSignal("");
  const [showRenameInput, setShowRenameInput] = createSignal(false);

  // Phase 6: Custom skills registry
  const [customSkills, setCustomSkills] = createSignal<CustomSkill[]>([]);
  const [skillsLoaded, setSkillsLoaded] = createSignal(false);

  // Phase 6: CLAUDE.md config
  const [claudeMdConfig, setClaudeMdConfig] = createSignal<ClaudeMdConfig | null>(null);

  // Effects
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

  createEffect(() => {
    checkAIStatus().then(status => {
      setNimConnected(status.connected);
      setNimStatusMessage(status.message);
    });
  });

  createEffect(() => {
    const recentSession = getMostRecentSession();
    if (recentSession && recentSession.messages.length > 0) {
      setMessages(recentSession.messages as Message[]);
      setSessionTitle(recentSession.title);
      setContextTokens(recentSession.contextTokens);
      setCost(recentSession.cost);
      if (recentSession.model) setCurrentModel(recentSession.model);
      if (recentSession.mode) setCurrentMode(recentSession.mode);
    }
  });

  createEffect(() => {
    const interval = setInterval(() => {
      autoSave(messages(), sessionTitle(), contextTokens(), totalTokens(), cost(), currentModel(), currentMode(), undefined, 3000);
    }, 3000);
    return () => clearInterval(interval);
  });

  createEffect(() => {
    loadClaudeMd();
  });

  createEffect(() => {
    if (!skillsLoaded()) {
      loadCustomSkills();
      setSkillsLoaded(true);
    }
  });

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

  // Phase 6: Load CLAUDE.md
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
          if (match) {
            config.context[match[1]!] = match[2]!;
          }
        }
      }
    }

    return config;
  }

  // Phase 6: Load custom skills
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

  // Phase 6: Process @ references
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

  // Phase 6: Check if model supports extended thinking
  const currentModelSupportsThinking = createMemo(() => {
    const model = aiModels.find(m => m.id === currentModel());
    return model?.supportsThinking ?? false;
  });

  return (
    <box flexDirection="column" flexGrow={1} backgroundColor={theme.background}>
      <text fg={theme.text}>WZRD TUI v1.1 Loaded</text>
      <text fg={theme.textMuted}>Session: {sessionTitle()}</text>
      <text fg={theme.textMuted}>Mode: {currentMode()}</text>
      <text fg={theme.textMuted}>Model: {currentModel()}</text>
      <text fg={theme.textMuted}>Extended Thinking: {extendedThinking() ? "ON" : "OFF"}</text>
      <text fg={theme.textMuted}>CLAUDE.md: {claudeMdConfig() ? "Loaded" : "Not found"}</text>
      <text fg={theme.textMuted}>Custom Skills: {customSkills().length}</text>
    </box>
  );
}

render(() => <WZRDv11 />);
