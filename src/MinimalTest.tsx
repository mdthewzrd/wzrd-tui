import { createSignal } from "solid-js";
import { render } from "@opentui/solid";

function MinimalTest() {
  const [input, setInput] = createSignal("");
  const [log, setLog] = createSignal<string>("App started");

  const addLog = (msg: string) => {
    setLog(prev => `${prev}\n${new Date().toLocaleTimeString()}: ${msg}`);
  };

  const handleSubmit = () => {
    addLog(`SUBMIT: "${input()}"`);
    setInput("");
  };

  return (
    <box flexDirection="column" flexGrow={1} backgroundColor="#080808" padding={1}>
      <text fg="#fab283"><strong>MINIMAL TEST</strong></text>
      <text fg="#808080">Testing OpenTUI textarea events</text>
      
      <box marginTop={1}>
        <textarea
          placeholder="Type and press Enter..."
          rows={2}
          flexGrow={1}
          backgroundColor="#141414"
          fg="#eeeeee"
          // Try all combinations:
          onSubmit={handleSubmit}
          onKeyDown={(e: any) => {
            addLog(`KeyDown: ${e.key}, shift: ${e.shiftKey}`);
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          onKeyPress={(e: any) => {
            addLog(`KeyPress: ${e.key}`);
          }}
        />
      </box>
      
      <box marginTop={1}>
        <text fg="#7fd88f"><strong>Current input:</strong> "{input()}"</text>
      </box>
      
      <box marginTop={1}>
        <text fg="#fab283"><strong>Event Log:</strong></text>
        <text fg="#eeeeee">{log()}</text>
      </box>
      
      <box marginTop={1}>
        <text fg="#808080"><strong>Instructions:</strong></text>
        <text fg="#eeeeee">1. Type something</text>
        <text fg="#eeeeee">2. Press Enter</text>
        <text fg="#eeeeee">3. Check logs above</text>
      </box>
    </box>
  );
}

render(() => <MinimalTest />);