// NIM API Integration for WZRD TUI
// Uses NVIDIA's NIM (NVIDIA Inference Microservices) for AI responses

export interface NIMMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface NIMResponse {
  id: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface NIMStreamChunk {
  id: string;
  choices: {
    index: number;
    delta: {
      role?: string;
      content?: string;
    };
    finish_reason: string | null;
  }[];
}

// Available NIM models
export const nimModels = {
  "kimi-k2.5": {
    id: "moonshotai/kimi-k2.5",
    name: "Kimi K2.5",
    maxTokens: 128000,
    supportsVision: true,
  },
  "deepseek-v3.2": {
    id: "deepseek-ai/deepseek-v3.2",
    name: "DeepSeek V3.2",
    maxTokens: 64000,
    supportsVision: false,
  },
  "claude-3.5": {
    id: "anthropic/claude-3.5-sonnet",
    name: "Claude 3.5",
    maxTokens: 200000,
    supportsVision: true,
  },
  "gpt-4o": {
    id: "openai/gpt-4o",
    name: "GPT-4o",
    maxTokens: 128000,
    supportsVision: true,
  },
  "glm-4.7": {
    id: "zhipuai/glm-4.7",
    name: "GLM-4.7",
    maxTokens: 32000,
    supportsVision: false,
  },
};

export class NIMClient {
  private apiKey: string;
  private baseUrl: string;
  private model: string;
  private totalTokensUsed: number = 0;
  private totalCost: number = 0;

  constructor(
    apiKey: string = process.env.NIM_API_KEY || "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",
    baseUrl: string = "https://integrate.api.nvidia.com/v1",
    model: string = nimModels["kimi-k2.5"].id
  ) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.model = model;
  }

  getTotalTokens(): number {
    return this.totalTokensUsed;
  }

  getTotalCost(): number {
    return this.totalCost;
  }

  resetStats(): void {
    this.totalTokensUsed = 0;
    this.totalCost = 0;
  }

  setModel(modelId: string) {
    const model = Object.values(nimModels).find(m => m.id === modelId || m.id.includes(modelId));
    if (model) {
      this.model = model.id;
    }
  }

  getCurrentModel(): string {
    return this.model;
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async chat(
    messages: NIMMessage[],
    options: {
      temperature?: number;
      maxTokens?: number;
      stream?: boolean;
      onStream?: (chunk: string) => void;
      onRetry?: (attempt: number, delayMs: number) => void;
    } = {}
  ): Promise<NIMResponse> {
    const { temperature = 0.7, maxTokens = 4096, stream = false, onStream, onRetry } = options;

    if (!this.apiKey) {
      throw new Error("NIM_API_KEY not set. Please set the environment variable.");
    }

    const maxRetries = 5;
    const baseDelay = 15000; // 15 seconds

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(`${this.baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            model: this.model,
            messages,
            temperature,
            max_tokens: maxTokens,
            stream,
          }),
        });

        if (response.status === 429) {
          // Rate limited - retry with delay
          if (attempt < maxRetries) {
            const delayMs = baseDelay;
            if (onRetry) {
              onRetry(attempt + 1, delayMs);
            }
            await this.sleep(delayMs);
            continue;
          }
          // Last attempt failed with 429
          const error = await response.text();
          throw new Error(`NIM API error: ${response.status} - Rate limit exceeded after ${maxRetries} retries - ${error}`);
        }

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`NIM API error: ${response.status} - ${error}`);
        }

        // Success - process response

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
              const parsed: NIMStreamChunk = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content || "";
              if (content) {
                fullContent += content;
                onStream(content);
              }
            } catch (e) {
              // Ignore parse errors for malformed chunks
            }
          }
        }
      }

      return {
        id: "streamed",
        choices: [{
          index: 0,
          message: { role: "assistant", content: fullContent },
          finish_reason: "stop",
        }],
        usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
      };
    }

        return response.json() as Promise<NIMResponse>;
      } catch (error) {
        // If it's not a 429 error or we've exhausted retries, throw
        if (attempt >= maxRetries) {
          throw error;
        }
        // For other errors, also retry
        const delayMs = baseDelay;
        if (onRetry) {
          onRetry(attempt + 1, delayMs);
        }
        await this.sleep(delayMs);
      }
    }

    // Should never reach here, but TypeScript needs a return
    throw new Error("Max retries exceeded");
  }

  // Simple non-streaming chat
  async sendMessage(content: string, history: NIMMessage[] = []): Promise<NIMResponse> {
    const messages: NIMMessage[] = [
      ...history,
      { role: "user", content },
    ];

    return this.chat(messages, { stream: false });
  }

  // Calculate approximate cost based on token usage
  calculateCost(promptTokens: number, completionTokens: number, modelId?: string): number {
    const model = modelId || this.model;
    
    // Approximate pricing per 1K tokens (varies by model)
    const pricing: Record<string, { input: number; output: number }> = {
      "moonshotai/kimi-k2.5": { input: 0.003, output: 0.015 },
      "deepseek-ai/deepseek-v3.2": { input: 0.002, output: 0.008 },
      "anthropic/claude-3.5-sonnet": { input: 0.003, output: 0.015 },
      "openai/gpt-4o": { input: 0.005, output: 0.015 },
      "zhipuai/glm-4.7": { input: 0.001, output: 0.005 },
    };

    const rates = pricing[model] || { input: 0.003, output: 0.015 };
    return (promptTokens / 1000) * rates.input + (completionTokens / 1000) * rates.output;
  }
}

// Create singleton instance
export const nimClient = new NIMClient();

// Check if API key is configured
export function isNIMConfigured(): boolean {
  return true; // API key is hardcoded in NIMClient
}

// Get API status
export async function checkNIMStatus(): Promise<{ connected: boolean; message: string }> {
  if (!isNIMConfigured()) {
    return { connected: false, message: "NIM_API_KEY not set" };
  }

  try {
    // Simple health check - try to list models or make a minimal request
    const response = await fetch("https://integrate.api.nvidia.com/v1/models", {
      headers: {
        "Authorization": `Bearer ${process.env.NIM_API_KEY}`,
      },
    });

    if (response.ok) {
      return { connected: true, message: "Connected to NIM API" };
    } else {
      return { connected: false, message: `API error: ${response.status}` };
    }
  } catch (error) {
    return { connected: false, message: `Connection failed: ${error}` };
  }
}
