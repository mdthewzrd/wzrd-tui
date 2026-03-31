/**
 * WebSocket Client for WZRD TUI
 * Connects to wzrd-final server for real-time AI communication
 */

import { WebSocket } from "ws";
import { EventEmitter } from "events";

// Message types for TUI ↔ Server protocol
export interface ThinkingStep {
  status: "pending" | "running" | "complete";
  description: string;
  timestamp: string;
}

export interface WorkItem {
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
  steps?: ThinkingStep[];
}

export interface WZRDMessage {
  type: "message" | "chunk" | "complete" | "error" | "ping" | "pong" | "typing";
  content?: string;
  sessionId?: string;
  userId?: string;
  timestamp?: string;
  error?: string;
  tokensUsed?: number;
  latency?: number;
  work?: WorkItem[];
  model?: string;
}

export interface ConnectionConfig {
  serverUrl: string;
  autoReconnect?: boolean;
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
  pingInterval?: number;
}

export class WZRDWebSocketClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private config: ConnectionConfig;
  private reconnectAttempts = 0;
  private reconnectTimer?: NodeJS.Timeout;
  private pingTimer?: NodeJS.Timeout;
  private isIntentionallyClosed = false;
  private sessionId: string;

  constructor(config: ConnectionConfig) {
    super();
    this.config = {
      autoReconnect: true,
      reconnectDelay: 3000,
      maxReconnectAttempts: 10,
      pingInterval: 30000,
      ...config,
    };
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return `tui-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        console.log(`Connecting to ${this.config.serverUrl}...`);

        this.ws = new WebSocket(this.config.serverUrl);

        this.ws.on("open", () => {
          console.log("Connected to WZRD server");
          this.reconnectAttempts = 0;
          this.isIntentionallyClosed = false;
          this.startPingInterval();
          this.emit("connected");
          resolve();
        });

        this.ws.on("message", (data: Buffer) => {
          this.handleMessage(data.toString());
        });

        this.ws.on("close", (code: number, reason: Buffer) => {
          console.log(`Connection closed: ${code}`);
          this.stopPingInterval();
          this.emit("disconnected", code, reason.toString());

          if (!this.isIntentionallyClosed && this.config.autoReconnect) {
            this.scheduleReconnect();
          }
        });

        this.ws.on("error", (error: Error) => {
          console.error("WebSocket error:", error.message);
          this.emit("error", error);
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  private handleMessage(data: string): void {
    try {
      console.log("[WebSocket] Raw message received:", data.slice(0, 500));
      const message = JSON.parse(data);
      console.log("[WebSocket] Parsed message:", JSON.stringify(message, null, 2).slice(0, 500));

      // Handle server event format: { type: "event", event: "agent:started", data: { ... } }
      if (message.type === "event" && message.event) {
        const eventType = message.event;
        const eventData = message.data;
        console.log("[WebSocket] Emitting event:", eventType, eventData);

switch (eventType) {
          case "agent:started":
            this.emit("agent:started", eventData);
            break;
          case "skills:loading":
            this.emit("skills:loading", eventData);
            break;
          case "agent:thinking":
            // Server-sent thinking steps
            this.emit("thinking", eventData?.steps || []);
            break;
          case "agent:chunk":
            // Chunk may contain content and/or work items
            this.emit("chunk", eventData?.content || "");
            if (eventData?.work) {
              this.emit("work", eventData.work);
            }
            break;
          case "skills:loaded":
            this.emit("skills:loaded", eventData);
            break;
          case "agent:completed":
            this.emit("complete", {
              content: eventData?.content || "",
              tokensUsed: eventData?.tokensUsed,
              latency: eventData?.latency,
              work: eventData?.work,
            });
            break;
          case "typing":
            this.emit("typing", eventData?.typing || false);
            break;
          case "error":
            this.emit("error", new Error(eventData?.message || "Unknown error"));
            break;
          default:
            this.emit("message", message);
        }
        return;
      }

      // Handle direct typing events: { type: "typing", data: { typing: true } }
      if (message.type === "typing") {
        this.emit("typing", message.data?.typing || false);
        return;
      }

      // Handle legacy format
      const wsMessage: WZRDMessage = message;
      switch (wsMessage.type) {
        case "chunk":
          this.emit("chunk", wsMessage.content);
          break;
        case "complete":
          this.emit("complete", {
            content: wsMessage.content,
            tokensUsed: wsMessage.tokensUsed,
            latency: wsMessage.latency,
          });
          break;
        case "error":
          this.emit("error", new Error(wsMessage.error || "Unknown error"));
          break;
        case "typing":
          this.emit("typing", wsMessage.content === "true");
          break;
        default:
          this.emit("message", wsMessage);
      }
    } catch (error) {
      console.error("Failed to parse message:", error);
    }
  }

  sendMessage(content: string, options?: { model?: string }): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error("WebSocket not connected");
    }

    console.log("[WebSocket] sendMessage called with options:", options);
    console.log("[WebSocket] options.model:", options?.model);

    const message: WZRDMessage = {
      type: "message",
      content,
      sessionId: this.sessionId,
      userId: "tui-user",
      timestamp: new Date().toISOString(),
      model: options?.model,
    };

    console.log("[WebSocket] Final message object:", JSON.stringify(message, null, 2));
    this.ws.send(JSON.stringify(message));
    this.emit("sent", message);
  }

  private ping(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: "ping" }));
    }
  }

  private startPingInterval(): void {
    if (this.config.pingInterval) {
      this.pingTimer = setInterval(() => this.ping(), this.config.pingInterval);
    }
  }

  private stopPingInterval(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = undefined;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= (this.config.maxReconnectAttempts || 10)) {
      console.error("Max reconnection attempts reached");
      this.emit("maxReconnectAttemptsReached");
      return;
    }

    this.reconnectAttempts++;
    const delay = this.config.reconnectDelay || 3000;

    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})...`);
    this.emit("reconnecting", this.reconnectAttempts);

    this.reconnectTimer = setTimeout(() => {
      this.connect().catch((error) => {
        console.error("Reconnection failed:", error.message);
      });
    }, delay);
  }

  disconnect(): void {
    this.isIntentionallyClosed = true;
    this.stopPingInterval();

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    console.log("Disconnected from server");
    this.emit("disconnected");
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  getSessionId(): string {
    return this.sessionId;
  }

  resetSession(): void {
    this.sessionId = this.generateSessionId();
    this.emit("sessionReset", this.sessionId);
  }
}

export function createClient(config: ConnectionConfig): WZRDWebSocketClient {
  return new WZRDWebSocketClient(config);
}
