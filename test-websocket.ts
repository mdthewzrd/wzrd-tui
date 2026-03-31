// Test WebSocket connection and message flow
import { WZRDWebSocketClient } from "./src/websocket-client";

console.log("=== WebSocket Integration Test ===\n");

const client = new WZRDWebSocketClient({
  serverUrl: "ws://100.118.174.102:5666",
  autoReconnect: true,
  reconnectDelay: 3000,
  maxReconnectAttempts: 3,
  pingInterval: 30000,
});

let testsPassed = 0;
let testsFailed = 0;

// Test 1: Connection
console.log("Test 1: Connecting to server...");
client.on("connected", () => {
  console.log("✅ Connected to server");
  testsPassed++;

  // Test 2: Send message
  console.log("\nTest 2: Sending message...");
  try {
    client.sendMessage("Hello from test", { model: "kimi-k2.5" });
    console.log("✅ Message sent");
    testsPassed++;
  } catch (error) {
    console.log("❌ Failed to send:", error);
    testsFailed++;
  }
});

// Test 3: Receive events
console.log("\nTest 3: Listening for events...");
const events: string[] = [];

client.on("agent:started", () => {
  console.log("✅ Received: agent:started");
  events.push("agent:started");
});

client.on("skills:loading", () => {
  console.log("✅ Received: skills:loading");
  events.push("skills:loading");
});

client.on("chunk", (content: string) => {
  console.log("✅ Received: chunk (", content.length, "chars)");
  events.push("chunk");
});

client.on("skills:loaded", () => {
  console.log("✅ Received: skills:loaded");
  events.push("skills:loaded");
});

client.on("complete", (data: { content: string; tokensUsed?: number; latency?: number }) => {
  console.log("✅ Received: complete");
  console.log("   Content length:", data.content?.length || 0);
  console.log("   Tokens used:", data.tokensUsed || "N/A");
  console.log("   Latency:", data.latency || "N/A");
  events.push("complete");
  testsPassed++;

  // Summary
  console.log("\n=== Test Summary ===");
  console.log("Events received:", events.join(", "));
  console.log("Tests passed:", testsPassed);
  console.log("Tests failed:", testsFailed);

  // Disconnect after 2 seconds
  setTimeout(() => {
    console.log("\nDisconnecting...");
    client.disconnect();
    process.exit(0);
  }, 2000);
});

client.on("typing", (isTyping: boolean) => {
  console.log("✅ Received: typing =", isTyping);
  events.push("typing");
});

client.on("error", (error: Error) => {
  console.log("❌ Error:", error.message);
  testsFailed++;
});

client.on("disconnected", () => {
  console.log("Disconnected from server");
});

// Connect
console.log("Connecting to ws://100.118.174.102:5666...\n");
client.connect().catch((error) => {
  console.log("❌ Connection failed:", error.message);
  testsFailed++;
  process.exit(1);
});

// Timeout after 30 seconds
setTimeout(() => {
  console.log("\n❌ Timeout: No response within 30 seconds");
  console.log("Events received so far:", events.join(", ") || "None");
  client.disconnect();
  process.exit(1);
}, 30000);
