import { createSignal, For, Show, createEffect, onError } from "solid-js";
import { render } from "@opentui/solid";
import { writeFileSync } from "fs";

// Global error handler that logs to file
onError((error) => {
  const errorText = `SolidJS Error: ${error}\n${error.stack || ''}`;
  console.error(errorText);
  
  try {
    writeFileSync("/tmp/wzrd-errors.log", errorText + "\n\n", { flag: 'a' });
  } catch (e) {
    console.error("Failed to write error log:", e);
  }
});

// Log console errors too
const originalConsoleError = console.error;
console.error = (...args) => {
  originalConsoleError.apply(console, args);
  
  try {
    const errorText = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ');
    
    writeFileSync("/tmp/wzrd-console-errors.log", 
      `[${new Date().toISOString()}] ${errorText}\n\n`, 
      { flag: 'a' }
    );
  } catch (e) {
    originalConsoleError("Failed to log console error:", e);
  }
};

// Exact Opencode colors from Opencode's opencode.jsonc
const theme = {
  background: "#0a0a0a",      // darkStep1 - main background
  surface: "#141414",         // darkStep2 - chat background
  element: "#1e1e1e",         // darkStep3 - element background
  primary: "#fab283",         // darkStep9 - primary color (remi/orange)
  muted: "#808080",           // darkStep11 - muted text
  text: "#eeeeee",            // darkStep12 - text color
  accent1: "#6ba4ff",         // blue accent
  accent2: "#d06efa",         // purple accent
  accent3: "#4cd964",         // green accent
  accent4: "#ff9500",         // orange accent
  accent5: "#ff6b6b",         // red accent
};

// SIMPLIFIED VERSION - No complex logic
function RobustWZRD() {
  const [currentMode, setCurrentMode] = createSignal("remi");
  const [currentModel, setCurrentModel] = createSignal("kimi-k2.5");
  const [input, setInput] = createSignal("");
  
  const modes = [
    { id: "remi", name: "remi", color: theme.primary },
    { id: "plan", name: "plan", color: theme.accent3 },
    { id: "build", name: "build", color: theme.accent4 },
  ];
  
  const models = [
    { id: "kimi-k2.5", name: "kimi-k2.5", color: theme.accent1 },
    { id: "deepseek-v3.2", name: "deepseek-v3.2", color: theme.accent2 },
  ];
  
  function handleTab() {
    const current = modes.findIndex(m => m.id === currentMode());
    const next = (current + 1) % modes.length;
    setCurrentMode(modes[next]!.id);
  }
  
  function handleKey(key: any) {
    if (key.name === "tab") {
      handleTab();
    }
  }
  
  // Try to catch render errors
  try {
    return (
      <box flexDirection="column" flexGrow={1} backgroundColor={theme.background}>
        {/* Header */}
        <box flexDirection="row" justifyContent="space-between" padding={1}>
          <text fg={theme.primary}><strong>wzrd.dev</strong></text>
          <box flexDirection="row">
            <text fg={theme.muted}>mode: </text>
            <text fg={modes.find(m => m.id === currentMode())?.color || theme.primary}>
              <strong>{currentMode()}</strong>
            </text>
            <text fg={theme.muted}> • model: </text>
            <text fg={models.find(m => m.id === currentModel())?.color || theme.accent1}>
              <strong>{currentModel()}</strong>
            </text>
          </box>
        </box>

        {/* Main layout */}
        <box flexDirection="row" flexGrow={1}>
          {/* Chat panel */}
          <box flexDirection="column" flexGrow={1} flexBasis={7} padding={1} backgroundColor={theme.surface}>
            <box flexDirection="column" flexGrow={1}>
              <text fg={theme.text}>Simplified working version</text>
              <text fg={theme.muted}>Tab should switch: remi → plan → build</text>
            </box>
            
            <box marginTop={1}>
              <input
                placeholder={`Message ${currentMode()}...`}
                value={input()}
                onInput={setInput}
                onSubmit={() => setInput("")}
                backgroundColor={theme.element}
                padding={1}
              />
            </box>
          </box>

          {/* Sidebar */}
          <box flexDirection="column" flexBasis={3} padding={1} backgroundColor={theme.background}>
            <text fg={theme.primary}><strong>Modes (Tab)</strong></text>
            <For each={modes}>
              {(mode) => (
                <box flexDirection="row" alignItems="center" padding={1}>
                  <box width={2} height={1} backgroundColor={mode.color} marginRight={1} />
                  <text fg={currentMode() === mode.id ? theme.text : theme.muted}>
                    {mode.name}
                  </text>
                </box>
              )}
            </For>
            
            <text fg={theme.primary} marginTop={2}><strong>Models (/model)</strong></text>
            <For each={models}>
              {(model) => (
                <box flexDirection="row" alignItems="center" padding={1}>
                  <box width={2} height={1} backgroundColor={model.color} marginRight={1} />
                  <text fg={currentModel() === model.id ? theme.text : theme.muted}>
                    {model.name}
                  </text>
                </box>
              )}
            </For>
          </box>
        </box>

        {/* Status */}
        <box flexDirection="row" justifyContent="space-between" padding={1}>
          <text fg={theme.muted}>Mode: {currentMode()} • Model: {currentModel()}</text>
          <text fg={theme.muted}>Tab to switch modes</text>
        </box>
      </box>
    );
  } catch (error) {
    console.error("Render error:", error);
    return (
      <box flexDirection="column" padding={2}>
        <text fg={theme.accent5}><strong>Render Error</strong></text>
        <text fg={theme.text}>{String(error)}</text>
      </box>
    );
  }
}

// Safe render
try {
  render(() => <RobustWZRD />);
} catch (error) {
  console.error("Fatal render error:", error);
}