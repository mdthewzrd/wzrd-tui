import { createSignal, createEffect, For, Show } from "solid-js";
import { render } from "@opentui/solid";

// Your NVIDIA API key
const NVIDIA_API_KEY = "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";

const theme = {
  background: "#0a0a0a",
  surface: "#141414",
  element: "#1e1e1e",
  primary: "#fab283",
  muted: "#808080",
  text: "#eeeeee",
  border: "#27272a",
};

interface Message {
  id: number;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
}

interface APITest {
  name: string;
  url: string;
  model: string;
  status: "pending" | "testing" | "success" | "error";
  response?: string;
}

async function testNvidiaEndpoint(url: string, model: string): Promise<string> {
  try {
    console.log(`Testing: ${url} with model ${model}`);
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${NVIDIA_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: "user",
            content: "Hello, are you working?"
          }
        ],
        temperature: 0.7,
        max_tokens: 100,
        stream: false
      })
    });

    const status = response.status;
    const statusText = response.statusText;
    
    if (!response.ok) {
      return `HTTP ${status}: ${statusText}`;
    }

    const data: any = await response.json();
    return `✓ Success: ${data.choices?.[0]?.message?.content?.substring(0, 50) || "No content"}`;
  } catch (error: any) {
    return `❌ Error: ${error.message}`;
  }
}

function WZRDAPITest() {
  const [input, setInput] = createSignal("");
  const [messages, setMessages] = createSignal<Message[]>([
    { id: 1, role: "system", content: "🔧 **NVIDIA API Test**", timestamp: new Date().toLocaleTimeString() },
    { id: 2, role: "system", content: "Testing different NVIDIA API endpoints to fix 404 error", timestamp: new Date().toLocaleTimeString() },
  ]);
  const [tests, setTests] = createSignal<APITest[]>([
    { name: "Chat Completions", url: "https://integrate.api.nvidia.com/v1/chat/completions", model: "meta/llama-3.1-8b-instruct", status: "pending" },
    { name: "NIM Endpoint", url: "https://integrate.api.nvidia.com/v1/chat/completions", model: "nvidia/llama-3.1-8b-instruct", status: "pending" },
    { name: "Playground", url: "https://api.nvidia.com/v1/chat/completions", model: "llama-3.1-8b", status: "pending" },
    { name: "AI Foundation", url: "https://ai.api.nvidia.com/v1/chat/completions", model: "llama3.1", status: "pending" },
  ]);
  const [status, setStatus] = createSignal("Click 'Test All Endpoints' to find working API");

  const runAllTests = async () => {
    setStatus("Running API endpoint tests...");
    const testList = tests();
    
    for (let i = 0; i < testList.length; i++) {
      const test = testList[i];
      setTests(prev => prev.map((t, idx) => 
        idx === i ? { ...t, status: "testing" } : t
      ));
      
      const result = await testNvidiaEndpoint(test.url, test.model);
      
      setTests(prev => prev.map((t, idx) => 
        idx === i ? { 
          ...t, 
          status: result.includes("✓") ? "success" : "error",
          response: result
        } : t
      ));
      
      // Add to messages
      setMessages(prev => [...prev, {
        id: prev.length + 1,
        role: "system",
        content: `${test.name}: ${result}`,
        timestamp: new Date().toLocaleTimeString()
      }]);
    }
    
    setStatus("Tests complete. Check results above.");
  };

  const handleSubmit = async () => {
    const text = input().trim();
    if (!text) return;
    
    setInput("");
    setStatus(`Manual test: "${text}"`);
    
    // Add user message
    setMessages(prev => [...prev, {
      id: prev.length + 1,
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString()
    }]);
    
    // Try first working endpoint
    const workingTest = tests().find(t => t.status === "success");
    if (!workingTest) {
      setMessages(prev => [...prev, {
        id: prev.length + 1,
        role: "assistant",
        content: "❌ No working API endpoint found yet. Run tests first.",
        timestamp: new Date().toLocaleTimeString()
      }]);
      return;
    }
    
    try {
      const response = await fetch(workingTest.url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${NVIDIA_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: workingTest.model,
          messages: [{ role: "user", content: text }],
          temperature: 0.7,
          max_tokens: 500,
          stream: false
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data: any = await response.json();
      const aiResponse = data.choices?.[0]?.message?.content || "No content";
      
      setMessages(prev => [...prev, {
        id: prev.length + 1,
        role: "assistant",
        content: aiResponse,
        timestamp: new Date().toLocaleTimeString()
      }]);
      
      setStatus(`✅ Response from ${workingTest.name}`);
    } catch (error: any) {
      setMessages(prev => [...prev, {
        id: prev.length + 1,
        role: "assistant",
        content: `❌ API Error: ${error.message}\nEndpoint: ${workingTest.url}`,
        timestamp: new Date().toLocaleTimeString()
      }]);
      setStatus(`❌ Error: ${error.message}`);
    }
  };

  return (
    <box flexDirection="row" flexGrow={1} backgroundColor={theme.background}>
      {/* Main area */}
      <box flexDirection="column" flexGrow={13} width="65%" backgroundColor={theme.background} padding={1}>
        <text fg={theme.primary} marginBottom={1}><strong>🔧 NVIDIA API Test</strong></text>
        
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
        >
          <For each={messages()}>
            {(msg) => (
              <box 
                flexDirection="column"
                marginBottom={1}
                backgroundColor={theme.element}
                padding={2}
              >
                <box flexDirection="row" marginBottom={1}>
                  <text 
                    fg={
                      msg.role === "system" ? "#fab283" : 
                      msg.role === "assistant" ? theme.primary : 
                      theme.text
                    }
                    selectable={true}
                  >
                    <strong>
                      {msg.role === "system" ? "🔧" : 
                       msg.role === "assistant" ? "🤖" : 
                       "👤"} {msg.role.toUpperCase()}
                    </strong>
                  </text>
                  <text fg={theme.muted} marginLeft="auto" selectable={true}>
                    {msg.timestamp}
                  </text>
                </box>
                <text fg={theme.text} selectable={true}>
                  {msg.content}
                </text>
              </box>
            )}
          </For>
        </scrollbox>

        {/* Input */}
        <box flexDirection="row">
          <input
            value={input()}
            placeholder="Type message to test working API..."
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
          <text fg={theme.muted}>Key: nvapi-... • Tests: {tests().filter(t => t.status === "success").length}/{tests().length}</text>
        </box>
      </box>

      {/* Sidebar */}
      <box flexDirection="column" flexGrow={7} width="35%" backgroundColor={theme.surface} padding={2}>
        <text fg={theme.primary} marginBottom={2}><strong>🔬 API Endpoints</strong></text>
        
        <box marginBottom={2}>
          <For each={tests()}>
            {(test) => (
              <box 
                backgroundColor={theme.element}
                padding={2}
                marginBottom={1}
                border={test.status === "success" ? [1, 1, 1, 1] : undefined}
                borderColor={test.status === "success" ? "#7fd88f" : undefined}
              >
                <box flexDirection="row" justifyContent="space-between" marginBottom={1}>
                  <text fg={theme.text}><strong>{test.name}</strong></text>
                  <text fg={
                    test.status === "success" ? "#7fd88f" :
                    test.status === "error" ? "#ef4444" :
                    test.status === "testing" ? "#fab283" :
                    theme.muted
                  }>
                    {test.status === "success" ? "✓" :
                     test.status === "error" ? "✗" :
                     test.status === "testing" ? "⏳" :
                     "○"}
                  </text>
                </box>
                <text fg={theme.muted} fontSize="small">{test.url}</text>
                <text fg={theme.muted} fontSize="small">Model: {test.model}</text>
                {test.response && (
                  <text fg={theme.text} fontSize="small" marginTop={1}>
                    {test.response.substring(0, 60)}...
                  </text>
                )}
              </box>
            )}
          </For>
        </box>

        <box backgroundColor={theme.element} padding={2} marginBottom={2}>
          <text fg={theme.primary} marginBottom={1}><strong>🔍 Debug Steps</strong></text>
          <box flexDirection="column">
            <text fg={theme.text}>1. Click "Test All Endpoints"</text>
            <text fg={theme.text}>2. Wait for ✓ success markers</text>
            <text fg={theme.text}>3. Type message → uses working endpoint</text>
            <text fg={theme.text}>4. Check browser console for logs</text>
          </box>
        </box>

        <box 
          backgroundColor={theme.primary}
          padding={2}
          onClick={runAllTests}
        >
          <text fg="#000000" align="center"><strong>▶️ TEST ALL ENDPOINTS</strong></text>
        </box>
      </box>
    </box>
  );
}

render(() => <WZRDAPITest />);