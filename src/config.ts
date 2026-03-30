// Configuration management for WZRD TUI
// Stores API keys and settings persistently

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { homedir } from "os";

const CONFIG_DIR = join(homedir(), ".wzrd");
const CONFIG_FILE = join(CONFIG_DIR, "config.json");

interface Config {
  apiKeys: Record<string, string>;
  defaultModel: string;
  defaultProvider: string;
  theme: string;
}

const defaultConfig: Config = {
  apiKeys: {},
  defaultModel: "kimi-k2.5",
  defaultProvider: "nvidia",
  theme: "dark",
};

function ensureConfigDir(): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

export function loadConfig(): Config {
  ensureConfigDir();
  
  if (!existsSync(CONFIG_FILE)) {
    return { ...defaultConfig };
  }
  
  try {
    const data = readFileSync(CONFIG_FILE, "utf-8");
    const parsed = JSON.parse(data);
    return { ...defaultConfig, ...parsed };
  } catch {
    return { ...defaultConfig };
  }
}

export function saveConfig(config: Config): void {
  ensureConfigDir();
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

export function getApiKey(provider: string): string | undefined {
  const config = loadConfig();
  return config.apiKeys[provider];
}

export function setApiKey(provider: string, key: string): void {
  const config = loadConfig();
  config.apiKeys[provider] = key;
  saveConfig(config);
  
  // Also set in process.env for current session
  const envVar = provider === "nvidia" ? "NIM_API_KEY" : `${provider.toUpperCase()}_API_KEY`;
  process.env[envVar] = key;
}

export function loadApiKeysToEnv(): void {
  const config = loadConfig();
  
  // Load all API keys into environment
  for (const [provider, key] of Object.entries(config.apiKeys)) {
    const envVar = provider === "nvidia" ? "NIM_API_KEY" : `${provider.toUpperCase()}_API_KEY`;
    process.env[envVar] = key;
  }
}

export function getDefaultModel(): string {
  const config = loadConfig();
  return config.defaultModel;
}

export function setDefaultModel(model: string): void {
  const config = loadConfig();
  config.defaultModel = model;
  saveConfig(config);
}
