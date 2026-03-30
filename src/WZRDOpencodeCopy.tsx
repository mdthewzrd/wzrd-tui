import { createSignal } from "solid-js";
import { render } from "@opentui/solid";

const theme = {
  background: "#0a0a0a",      // darkStep1
  surface: "#141414",         // darkStep2
  element: "#1e1e1e",         // darkStep3 - message background
  primary: "#fab283",         // darkStep9 - gold
  muted: "#808080",           // darkStep11
  text: "#eeeeee",            // darkStep12
  border: "#27272a",          // darkStep4
};

function WZRDOpencodeCopy() {
  const [input, setInput] = createSignal("");
  const [messages, setMessages] = createSignal([
    { 
      role: "assistant", 
      content: "🚀 **WZRD.dev** - Direct Opencode Copy",
    },
    { 
      role: "assistant", 
      content: "Using <scrollbox> from Opencode source\nMessages in text blocks\nProper scrolling",
    },
    { 
      role: "user", 
      content: "Testing scroll functionality",
    },
  ]);

  const handleSubmit = () => {
    const text = input().trim();
    if (!text) return;
    
    setMessages(prev => [...prev, { 
      role: "user", 
      content: text,
    }]);
    setInput("");
    
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: `📤 **Received**: "${text}"\nScroll should work properly now with <scrollbox>`,
      }]);
    }, 300);
  };

  return (
    <box flexDirection="row" flexGrow={1} backgroundColor={theme.background}>
      {/* Main area - 65% */}
      <box flexDirection="column" flexGrow={13} width="65%" backgroundColor={theme.background} padding={1}>
        <text fg={theme.primary} marginBottom={1}><strong>WZRD.dev</strong></text>
        
        {/* DIRECT OPENCODE COPY: scrollbox */}
        <scrollbox
          viewportOptions={{
            paddingRight: 1,
          }}
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
          flexGrow={1}
          backgroundColor={theme.surface}
          padding={2}
          marginBottom={1}
        >
          {messages().map((msg, idx) => (
            <box 
              flexDirection="column"
              marginBottom={2}
              backgroundColor={theme.element}
              padding={2}
            >
              <box flexDirection="row" marginBottom={1}>
                <text 
                  fg={msg.role === "assistant" ? theme.primary : theme.text}
                  selectable={true}
                >
                  <strong>{msg.role === "assistant" ? "🤖 WZRD" : "👤 You"}</strong>
                </text>
              </box>
              
              <text fg={theme.text} selectable={true}>
                {msg.content}
              </text>
            </box>
          ))}
        </scrollbox>

        {/* Input */}
        <box flexDirection="row">
          <input
            value={input()}
            placeholder="Type message... (scroll should work now)"
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

        <box marginTop={1}>
          <text fg={theme.muted}>
            Scroll: scrollbox from Opencode • Select: ✓ • Enter: ✓
          </text>
        </box>
      </box>

      {/* Sidebar - 35% */}
      <box flexDirection="column" flexGrow={7} width="35%" backgroundColor={theme.surface} padding={2}>
        <text fg={theme.primary} marginBottom={2}><strong>📁 Opencode Source</strong></text>
        
        <box backgroundColor={theme.element} padding={2} marginBottom={2}>
          <text fg={theme.primary} marginBottom={1}><strong>/tmp/wzrdclaw-tui/</strong></text>
          <box flexDirection="column">
            <text fg={theme.text}>src/routes/session/index.tsx</text>
            <text fg={theme.muted}>Line 1038: {"<scrollbox>"}</text>
            <text fg={theme.muted}>Line 1151: {"</scrollbox>"}</text>
            <text fg={theme.text}>Props: stickyScroll, verticalScrollbarOptions</text>
          </box>
        </box>

        <box backgroundColor={theme.element} padding={2} marginBottom={2}>
          <text fg={theme.primary} marginBottom={1}><strong>🎯 Test This</strong></text>
          <box flexDirection="column">
            <text fg={theme.text}>1. Add messages until they overflow</text>
            <text fg={theme.text}>2. Try mouse wheel scroll</text>
            <text fg={theme.text}>3. Look for scrollbar on right</text>
            <text fg={theme.text}>4. Select text with mouse</text>
          </box>
        </box>

        <box backgroundColor={theme.element} padding={2}>
          <text fg={theme.primary} marginBottom={1}><strong>🚨 If Still Broken</strong></text>
          <box flexDirection="column">
            <text fg={theme.text}>Check OpenTUI has {"<scrollbox>"}</text>
            <text fg={theme.text}>Might be {"<ScrollBox>"} (capital)</text>
            <text fg={theme.text}>Or need to import from @opentui</text>
          </box>
        </box>
      </box>
    </box>
  );
}

render(() => <WZRDOpencodeCopy />);