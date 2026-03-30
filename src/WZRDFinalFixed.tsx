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

// Enhanced NIM API call with better prompt
async function callNvidiaNIM(prompt: string): Promise<string> {
  try {
    console.log("Calling NVIDIA NIM API...");
    
    const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${NVIDIA_NIM_KEY}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        model: "meta/llama-3.1-8b-instruct",
        messages: [
          {
            role: "system",
            content: "You are WZRD, an AI assistant. Identify yourself simply as 'WZRD' at the start of responses. Keep responses concise and helpful."
          },
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

    console.log("NIM Response status:", response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("NIM API error:", errorText);
      throw new Error(`NVIDIA NIM: ${response.status} ${response.statusText}`);
    }

    const data: any = await response.json();
    const content = data.choices[0]?.message?.content || "No response";
    console.log("NIM Response:", content.substring(0, 100));
    
    return content;
  } catch (error: any) {
    console.error("NIM API failed:", error);
    return `WZRD: API Error - ${error.message}\n\nYour message: "${prompt}"`;
  }
}

function WZRDFinalFixed() {
  const [input, setInput] = createSignal("");
  const [messages, setMessages] = createSignal<Message[]>([
    { 
      id: 1, 
      role: "assistant", 
      content: "WZRD: NVIDIA NIM API is working! Messages should be copyable and auto-scroll to bottom.", 
      timestamp: new Date().toLocaleTimeString() 
    },
    { 
      id: 2, 
      role: "assistant", 
      content: "Try: Type message → Press Enter → Should see 'WZRD: ...' response", 
      timestamp: new Date().toLocaleTimeString() 
    },
  ]);
  const [status, setStatus] = createSignal("Ready - Type message (should copy and auto-scroll)");
  const [isLoading, setIsLoading] = createSignal(false);
  const [scrollToBottom, setScrollToBottom] = createSignal(true);

  // Auto-scroll to bottom when messages change
  createEffect(() => {
    if (scrollToBottom() && messages().length > 0) {
      // Simulate scroll to bottom (OpenTUI might auto-handle with stickyScroll)
      console.log("Should scroll to latest message");
    }
  });

  const handleSubmit = async () => {
    const text = input().trim();
    if (!text) return;
    
    setInput("");
    setStatus(`Calling NVIDIA NIM: "${text.substring(0, 30)}..."`);
    setIsLoading(true);
    setScrollToBottom(true);
    
    // Add user message
    const userMessageId = messages().length + 1;
    setMessages(prev => [...prev, { 
      id: userMessageId, 
      role: "user", 
      content: text,
      timestamp: new Date().toLocaleTimeString()
    }]);
    
    try {
      const aiResponse = await callNvidiaNIM(text);
      
      setMessages(prev => [...prev, { 
        id: userMessageId + 1,
        role: "assistant", 
        content: aiResponse,
        timestamp: new Date().toLocaleTimeString()
      }]);
      
      setStatus(`✅ Response at ${new Date().toLocaleTimeString()}`);
    } catch (error: any) {
      setMessages(prev => [...prev, { 
        id: userMessageId + 1,
        role: "assistant", 
        content: `WZRD: Error - ${error.message}\n\nYour message: "${text}"`,
        timestamp: new Date().toLocaleTimeString()
      }]);
      setStatus(`❌ Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to copy last message (for debugging)
  const copyLastMessage = () => {
    const lastMsg = messages()[messages().length - 1];
    if (lastMsg) {
      const text = `${lastMsg.role}: ${lastMsg.content}`;
      console.log("Copy to clipboard:", text.substring(0, 100));
      // In real TUI, selection happens via mouse
    }
  };

  return (
    <box flexDirection="row" flexGrow={1} backgroundColor={theme.background}>
      {/* Main area */}
      <box flexDirection="column" flexGrow={13} width="65%" backgroundColor={theme.background} padding={1}>
        <text fg={theme.primary} marginBottom={1}><strong>🤖 WZRD (Fixed)</strong></text>
        
        {/* Messages with stickyScroll to auto-stick to bottom */}
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
          stickyScroll={true}
          stickyStart="bottom"
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
                  >
                    <strong>{msg.role === "assistant" ? "🤖 WZRD" : "👤 You"}</strong>
                  </text>
                  <text fg={theme.muted}>
                    {msg.timestamp}
                  </text>
                </box>
                <text fg={theme.text}>
                  {msg.content}
                </text>
                
                {/* Copy hint */}
                <box marginTop={1}>
                  <text fg={theme.muted} >
                    ↓ Click and drag to select text (should work in terminal)
                  </text>
                </box>
              </box>
            )}
          </For>
          
          <Show when={isLoading()}>
            <box flexDirection="row" marginBottom={2} backgroundColor={theme.element} padding={2}>
              <text fg={theme.primary} marginRight={1}>⏳</text>
              <text fg={theme.text}>Calling NVIDIA NIM...</text>
            </box>
          </Show>
        </scrollbox>

        <box flexDirection="row">
          <input
            value={input()}
            placeholder="Type message... (should auto-scroll, messages copyable)"
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
          <text fg={theme.muted}>
            Msgs: {messages().length} • Scroll: {scrollToBottom() ? "Bottom✓" : "Manual"} • NIM: ✓
          </text>
        </box>
      </box>

      {/* Sidebar */}
      <box flexDirection="column" flexGrow={7} width="35%" backgroundColor={theme.surface} padding={2}>
        <text fg={theme.primary} marginBottom={2}><strong>🔧 Fixed Issues</strong></text>
        
        <box backgroundColor={theme.element} padding={2} marginBottom={2}>
          <text fg={theme.primary} marginBottom={1}><strong>✅ Auto-Scroll</strong></text>
          <box flexDirection="column">
            <text fg={theme.text}>stickyScroll={true}</text>
            <text fg={theme.text}>stickyStart="bottom"</text>
            <text fg={theme.text}>New messages auto-scroll into view</text>
            <text fg={theme.text}>Always shows most recent</text>
          </box>
        </box>

        <box backgroundColor={theme.element} padding={2} marginBottom={2}>
          <text fg={theme.primary} marginBottom={1}><strong>📋 Copy Messages</strong></text>
          <box flexDirection="column">
            <text fg={theme.text}>Terminal should allow text selection</text>
            <text fg={theme.text}>Click + drag to highlight</text>
            <text fg={theme.text}>Ctrl+C or right-click to copy</text>
            <text fg={theme.text}>Depends on terminal emulator</text>
          </box>
        </box>

        <box backgroundColor={theme.element} padding={2} marginBottom={2}>
          <text fg={theme.primary} marginBottom={1}><strong>🤖 AI Identity</strong></text>
          <box flexDirection="column">
            <text fg={theme.text}>System prompt: "You are WZRD"</text>
            <text fg={theme.text}>Should respond: "WZRD: ..."</text>
            <text fg={theme.text}>Simple identification</text>
            <text fg={theme.text}>Not weird model names</text>
          </box>
        </box>

        <box backgroundColor={theme.element} padding={2}>
          <text fg={theme.primary} marginBottom={1}><strong>🎯 Test Now</strong></text>
          <box flexDirection="column">
            <text fg={theme.text}>1. Type "What's your name?"</text>
            <text fg={theme.text}>2. Should see "WZRD: I'm WZRD..."</text>
            <text fg={theme.text}>3. Try to select text with mouse</text>
            <text fg={theme.text}>4. Should auto-scroll to response</text>
          </box>
        </box>
      </box>
    </box>
  );
}

render(() => <WZRDFinalFixed />);