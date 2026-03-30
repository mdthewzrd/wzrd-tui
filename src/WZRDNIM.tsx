import { createSignal, createEffect, For, Show } from "solid-js";
import { render } from "@opentui/solid";

// Your NVIDIA NIM API key
const NVIDIA_NIM_KEY = "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";

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
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

// NVIDIA NIM API - Correct endpoint for nvapi- keys
// From: https://docs.api.nvidia.com/nim/reference/chat-completions
async function callNvidiaNIM(prompt: string): Promise<string> {
  try {
    console.log("Calling NVIDIA NIM API...");
    
    // NIM endpoint for chat completions
    const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${NVIDIA_NIM_KEY}`,
        "Content-Type": "application/json",
        // NIM-specific headers
        "Accept": "application/json",
      },
      body: JSON.stringify({
        model: "meta/llama-3.1-8b-instruct", // Common NIM model
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1024,
        stream: false
      })
    });

    console.log("NIM Response status:", response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("NIM API error response:", errorText);
      throw new Error(`NVIDIA NIM API error: ${response.status} ${response.statusText}\n${errorText.substring(0, 200)}`);
    }

    const data: any = await response.json();
    console.log("NIM API success:", data.choices?.[0]?.message?.content?.substring(0, 100));
    
    return data.choices[0]?.message?.content || "No response content";
  } catch (error: any) {
    console.error("NVIDIA NIM API call failed:", error);
    return `❌ **NVIDIA NIM API Error**: ${error.message}\n\n**Fallback**: Your message was: "${prompt}"\n\n**Debug Info**:\n• Key: nvapi-... (NIM format)\n• Endpoint: integrate.api.nvidia.com/v1/chat/completions\n• Try different model: meta/llama-3.1-8b-instruct`;
  }
}

function WZRDNIM() {
  const [input, setInput] = createSignal("");
  const [messages, setMessages] = createSignal<Message[]>([
    { 
      id: 1, 
      role: "assistant", 
      content: "🚀 **WZRD** - NVIDIA NIM Integration", 
      timestamp: new Date().toLocaleTimeString() 
    },
    { 
      id: 2, 
      role: "assistant", 
      content: "Using NVIDIA NIM API (nvapi- key)\nEndpoint: integrate.api.nvidia.com/v1/chat/completions\nModel: meta/llama-3.1-8b-instruct", 
      timestamp: new Date().toLocaleTimeString() 
    },
    { 
      id: 3, 
      role: "user", 
      content: "Test if NIM API works", 
      timestamp: new Date().toLocaleTimeString() 
    },
  ]);
  const [status, setStatus] = createSignal("Ready - Testing NVIDIA NIM API");
  const [isLoading, setIsLoading] = createSignal(false);
  const [apiInfo, setApiInfo] = createSignal("Key: nvapi-... • Endpoint: NIM");

  const handleSubmit = async () => {
    const text = input().trim();
    if (!text) return;
    
    setInput("");
    setStatus(`⏳ Calling NVIDIA NIM API: "${text.substring(0, 30)}..."`);
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
      // Call NVIDIA NIM
      const aiResponse = await callNvidiaNIM(text);
      
      // Add AI response
      setMessages(prev => [...prev, { 
        id: userMessageId + 1,
        role: "assistant", 
        content: aiResponse,
        timestamp: new Date().toLocaleTimeString()
      }]);
      
      setStatus(`✅ NIM response at ${new Date().toLocaleTimeString()}`);
      setApiInfo("NIM: Success • Check browser console");
    } catch (error: any) {
      setMessages(prev => [...prev, { 
        id: userMessageId + 1,
        role: "assistant", 
        content: `❌ **NIM Error**: ${error.message}\n\n**Your message**: "${text}"\n\n**Try**:\n1. Check https://build.nvidia.com\n2. Verify API key at https://org.nvidia.com\n3. Try different model (llama-3.1-8b)`,
        timestamp: new Date().toLocaleTimeString()
      }]);
      setStatus(`❌ NIM Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <box flexDirection="row" flexGrow={1} backgroundColor={theme.background}>
      {/* Main area */}
      <box flexDirection="column" flexGrow={13} width="65%" backgroundColor={theme.background} padding={1}>
        <text fg={theme.primary} marginBottom={1}><strong>🤖 WZRD (NVIDIA NIM)</strong></text>
        
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
                marginBottom={2}
                backgroundColor={theme.element}
                padding={2}
              >
                <box flexDirection="row" justifyContent="space-between" marginBottom={1}>
                  <text 
                    fg={msg.role === "assistant" ? theme.primary : theme.text}
                    selectable={true}
                  >
                    <strong>{msg.role === "assistant" ? "🤖 WZRD" : "👤 You"}</strong>
                  </text>
                  <text fg={theme.muted} selectable={true}>
                    {msg.timestamp}
                  </text>
                </box>
                <text fg={theme.text} selectable={true}>
                  {msg.content}
                </text>
              </box>
            )}
          </For>
          
          <Show when={isLoading()}>
            <box flexDirection="row" marginBottom={2} backgroundColor={theme.element} padding={2}>
              <text fg={theme.primary} marginRight={1}>⏳</text>
              <text fg={theme.text}>Calling NVIDIA NIM API... (check browser console)</text>
            </box>
          </Show>
        </scrollbox>

        <box flexDirection="row">
          <input
            value={input()}
            placeholder="Type message for NVIDIA NIM API..."
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
          <text fg={theme.muted}>{apiInfo()}</text>
        </box>
      </box>

      {/* Sidebar */}
      <box flexDirection="column" flexGrow={7} width="35%" backgroundColor={theme.surface} padding={2}>
        <text fg={theme.primary} marginBottom={2}><strong>🔧 NVIDIA NIM API</strong></text>
        
        <box backgroundColor={theme.element} padding={2} marginBottom={2}>
          <text fg={theme.primary} marginBottom={1}><strong>Key Format</strong></text>
          <box flexDirection="column">
            <text fg={theme.text}>nvapi-irJh3eBp_ugEhSAOzeyEKCD...</text>
            <text fg={theme.muted}>This is NVIDIA NIM API key format</text>
            <text fg={theme.muted}>Not standard OpenAI-compatible</text>
          </box>
        </box>

        <box backgroundColor={theme.element} padding={2} marginBottom={2}>
          <text fg={theme.primary} marginBottom={1}><strong>Correct Endpoint</strong></text>
          <box flexDirection="column">
            <text fg={theme.text}>URL: integrate.api.nvidia.com</text>
            <text fg={theme.text}>Path: /v1/chat/completions</text>
            <text fg={theme.text}>Model: meta/llama-3.1-8b-instruct</text>
            <text fg={theme.text}>Docs: https://build.nvidia.com</text>
          </box>
        </box>

        <box backgroundColor={theme.element} padding={2} marginBottom={2}>
          <text fg={theme.primary} marginBottom={1}><strong>🎯 Test This</strong></text>
          <box flexDirection="column">
            <text fg={theme.text}>1. Type simple message</text>
            <text fg={theme.text}>2. Press Enter</text>
            <text fg={theme.text}>3. Check browser console logs</text>
            <text fg={theme.text}>4. Look for detailed error</text>
          </box>
        </box>

        <box backgroundColor={theme.element} padding={2}>
          <text fg={theme.primary} marginBottom={1}><strong>If Still 404</strong></text>
          <box flexDirection="column">
            <text fg={theme.text}>Check: https://org.nvidia.com</text>
            <text fg={theme.text}>Verify API key active</text>
            <text fg={theme.text}>Try: meta/llama-3.1-70b-instruct</text>
            <text fg={theme.text}>Or: nvidia/llama-3.1-8b-instruct</text>
          </box>
        </box>
      </box>
    </box>
  );
}

render(() => <WZRDNIM />);