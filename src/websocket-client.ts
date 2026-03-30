/**
 * WebSocket Client for WZRD TUI
 * Connects to wzrd-final server for real-time AI communication
 */

import { WebSocket } from "ws";
import { EventEmitter } from "events";

// Message types for TUI ↔ Server protocol
export interface WZRDMessage {
  type: "message" | "chunk" | "complete" | "error" | "ping" | "pong" | "typing";
  content?: string;
  sessionId?: string;
  userId?: string;
  timestamp?: string;
  error?: string;
  tokensUsed?: number;
  latency?: number;
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
      const message: WZRDMessage = JSON.parse(data);

      switch (message.type) {
        case "chunk":
          this.emit("chunk", message.content);
          break;
        case "complete":
          this.emit("complete", {
            content: message.content,
            tokensUsed: message.tokensUsed,
            latency: message.latency,
          });
          break;
        case "error":
          this.emit("error", new Error(message.error || "Unknown error"));
          break;
        case "typing":
          this.emit("typing", message.content === "true");
          break;
        default:
          this.emit("message", message);
      }
    } catch (error) {
      console.error("Failed to parse message:", error);
    }
  }

  sendMessage(content: string, options?: { model?: string }): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error("WebSocket not connected");
    }

    const message: WZRDMessage = {
      type: "message",
      content,
      sessionId: this.sessionId,
      userId: "tui-user",
      timestamp: new Date().toISOString(),
    };

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
