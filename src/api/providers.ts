// Multi-provider API support for WZRD TUI
// Supports Nvidia NIM and OpenRouter

import { getApiKey, setApiKey, loadApiKeysToEnv } from "../config";

// Load saved API keys on module init
loadApiKeysToEnv();

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatResponse {
  id: string;
  content: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface StreamChunk {
  content: string;
  done: boolean;
}

export interface ProviderConfig {
  id: string;
  name: string;
  baseUrl: string;
  apiKeyEnv: string;
  defaultModel: string;
}

// Provider configurations
export const providers: Record<string, ProviderConfig> = {
  nvidia: {
    id: "nvidia",
    name: "Nvidia NIM",
    baseUrl: "https://integrate.api.nvidia.com/v1",
    apiKeyEnv: "NIM_API_KEY",
    defaultModel: "moonshotai/kimi-k2.5",
  },
  openrouter: {
    id: "openrouter",
    name: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1",
    apiKeyEnv: "OPENROUTER_API_KEY",
    defaultModel: "moonshotai/kimi-k2.5",
  },
  zai: {
    id: "zai",
    name: "Z AI Coding",
    baseUrl: "https://open.bigmodel.cn/api/coding/paas/v4",
    apiKeyEnv: "ZAI_API_KEY",
    defaultModel: "glm-4.7",
  },
};

// Model to provider mapping
export const modelProviders: Record<string, string> = {
  // Nvidia NIM (FREE)
  "kimi-k2.5": "nvidia",
  "kimi-k2-instruct": "nvidia",
  "kimi-k2-instruct-0905": "nvidia",
  "deepseek-v3.2": "nvidia",
  "nemotron-3-super": "nvidia",
  "nemotron-safety": "nvidia",
  "qwen-3.5-122b": "nvidia",
  "qwen-3.5-397b": "nvidia",

  // Z AI - Coding Subscription (GLM models)
  "glm-4.7": "zai",
  "glm-4.7-flash": "zai",
  "glm-4.6": "zai",
  "glm-4.5-air": "zai",
  "glm-4.5-airx": "zai",
  "glm-5": "zai",

  // OpenRouter (Paid/Free)
  "grok-4.1": "openrouter",
  "minimax-m2.5": "openrouter",
  "llama-3.1-8b": "openrouter",
  "qwen-coder-3-480b": "openrouter",
  "gemini-2.5-flash": "openrouter",
  "qwen-3.5": "openrouter",
};

// Full model IDs for each provider
export const modelIds: Record<string, string> = {
  // Nvidia NIM
  "kimi-k2.5": "moonshotai/kimi-k2.5",
  "kimi-k2-instruct": "moonshotai/kimi-k2-instruct",
  "kimi-k2-instruct-0905": "moonshotai/kimi-k2-instruct-0905",
  "deepseek-v3.2": "deepseek-ai/deepseek-v3.2",
  "nemotron-3-super": "nvidia/llama-3.1-nemotron-70b-instruct",
  "nemotron-safety": "nvidia/llama-3.1-nemotron-safety-guard",
  "qwen-3.5-122b": "qwen/qwen-3.5-122b",
  "qwen-3.5-397b": "qwen/qwen-3.5-397b",

  // Z AI - Coding Subscription (GLM models via Zhipu API)
  "glm-4.7": "glm-4.7",
  "glm-4.5-air": "glm-4.5-air",
  "glm-5": "glm-5",
  "glm-4.7-flash": "glm-4.7-flash",
  "glm-4.6": "glm-4.6",
  "glm-4.5-airx": "glm-4.5-airx",

  // OpenRouter - Using :free variants where available
  "grok-4.1": "x-ai/grok-4.1-fast",
  "minimax-m2.5": "minimax/minimax-m2.5:free",   // FREE variant
  "llama-3.1-8b": "meta-llama/llama-3.1-8b-instruct",
  "qwen-coder-3-480b": "qwen/qwen3-coder:free",  // FREE variant
  "gemini-2.5-flash": "google/gemini-2.5-flash",
  "qwen-3.5": "qwen/qwen3.5-122b-a10b",
};

// Model pricing per 1M tokens (input/output)
// Nvidia models are FREE with API key
// Z AI models are UNLIMITED with coding subscription
// OpenRouter pricing from https://openrouter.ai/api/v1/models
export const modelPricing: Record<string, { input: number; output: number; free?: boolean; subscription?: boolean }> = {
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

export class AIClient {
  private currentProvider: string = "nvidia";
  private currentModel: string = "kimi-k2.5";
  private totalTokensUsed: number = 0;
  private totalCost: number = 0;

  setProvider(providerId: string) {
    if (providers[providerId]) {
      this.currentProvider = providerId;
    }
  }

  setModel(modelId: string) {
    const provider = modelProviders[modelId];
    if (provider) {
      this.currentModel = modelId;
      this.currentProvider = provider;
    }
  }

  getCurrentProvider(): string {
    return this.currentProvider;
  }

  getCurrentModel(): string {
    return this.currentModel;
  }

  getProviderConfig(): ProviderConfig {
    const config = providers[this.currentProvider];
    if (config) return config;
    // Fallback to nvidia config (guaranteed to exist)
    return { id: "nvidia", name: "Nvidia", baseUrl: "https://integrate.api.nvidia.com/v1", apiKeyEnv: "NIM_API_KEY", defaultModel: "moonshotai/kimi-k2.5" };
  }

  private getApiKey(): string {
    const config = providers[this.currentProvider];
    if (!config) return "";
    const envKey = process.env[config.apiKeyEnv];
    if (envKey) return envKey;

    // Fallback to hardcoded key for Nvidia (existing behavior)
    if (this.currentProvider === "nvidia") {
      return "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";
    }

    return "";
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async chat(
    messages: ChatMessage[],
    options: {
      temperature?: number;
      maxTokens?: number;
      stream?: boolean;
      onStream?: (chunk: string) => void;
      onRetry?: (attempt: number, delayMs: number) => void;
    } = {}
  ): Promise<ChatResponse> {
    const { temperature = 0.7, maxTokens = 4096, stream = false, onStream, onRetry } = options;
    const config = providers[this.currentProvider];
    if (!config) {
      throw new Error(`Unknown provider: ${this.currentProvider}`);
    }
    const apiKey = this.getApiKey();
    const fullModelId = modelIds[this.currentModel];

    if (!apiKey) {
      throw new Error(`${config.apiKeyEnv} not set. Please set the environment variable.`);
    }

    const maxRetries = 5;
    const baseDelay = 15000;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(`${config.baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // Z AI uses a different auth format (API key directly)
            ...(this.currentProvider === "zai"
              ? { "Authorization": apiKey }
              : { "Authorization": `Bearer ${apiKey}` }
            ),
            // OpenRouter specific headers
            ...(this.currentProvider === "openrouter" && {
              "HTTP-Referer": "https://wzrd.dev",
              "X-Title": "WZRD TUI",
            }),
          },
          body: JSON.stringify({
            model: fullModelId,
            messages,
            temperature,
            max_tokens: maxTokens,
            stream,
          }),
        });

        if (response.status === 429) {
          if (attempt < maxRetries) {
            const delayMs = baseDelay;
            if (onRetry) {
              onRetry(attempt + 1, delayMs);
            }
            await this.sleep(delayMs);
            continue;
          }
          const error = await response.text();
          throw new Error(`API error: ${response.status} - Rate limit exceeded after ${maxRetries} retries - ${error}`);
        }

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`API error: ${response.status} - ${error}`);
        }

        if (stream && onStream) {
          const reader = response.body?.getReader();
          if (!reader) {
            throw new Error("No response body for streaming");
          }

          const decoder = new TextDecoder();
          let fullContent = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split("\n").filter(line => line.trim());

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6);
                if (data === "[DONE]") continue;

                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content ||
                    parsed.choices?.[0]?.message?.content || "";
                  if (content) {
                    fullContent += content;
                    onStream(content);
                  }
                } catch (e) {
                  // Ignore parse errors
                }
              }
            }
          }

          return {
            id: "streamed",
            content: fullContent,
            usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
          };
        }

        const data = await response.json() as { id: string; choices?: Array<{ message?: { content?: string } }>; usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number } };
        return {
          id: data.id,
          content: data.choices?.[0]?.message?.content || "",
          usage: data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
        };
      } catch (error) {
        if (attempt >= maxRetries) {
          throw error;
        }
        const delayMs = baseDelay;
        if (onRetry) {
          onRetry(attempt + 1, delayMs);
        }
        await this.sleep(delayMs);
      }
    }

    throw new Error("Max retries exceeded");
  }

  calculateCost(promptTokens: number, completionTokens: number): number {
    const rates = modelPricing[this.currentModel] || { input: 0.003, output: 0.015 };
    return (promptTokens / 1000) * rates.input + (completionTokens / 1000) * rates.output;
  }
}

// Create singleton instance
export const aiClient = new AIClient();

// Check if API is configured for current provider
export function isAIConfigured(): boolean {
  const provider = aiClient.getCurrentProvider();
  const config = providers[provider];
  if (!config) return false;
  const envKey = process.env[config.apiKeyEnv];

  // Nvidia has hardcoded fallback
  if (provider === "nvidia") return true;

  // Z AI requires API key from subscription
  if (provider === "zai") return !!envKey;

  // OpenRouter requires API key
  return !!envKey;
}

// Get API status
export async function checkAIStatus(): Promise<{ connected: boolean; message: string }> {
  const provider = aiClient.getCurrentProvider();
  const config = providers[provider];

  if (!config) {
    return { connected: false, message: "Unknown provider" };
  }

  if (!isAIConfigured()) {
    return { connected: false, message: `${config.apiKeyEnv} not set` };
  }

  try {
    const response = await fetch(`${config.baseUrl}/models`, {
      headers: {
        "Authorization": `Bearer ${(aiClient as any).getApiKey()}`,
      },
    });

    if (response.ok) {
      return { connected: true, message: `Connected to ${config.name}` };
    } else {
      return { connected: false, message: `API error: ${response.status}` };
    }
  } catch (error) {
    return { connected: false, message: `Connection failed: ${error}` };
  }
}
