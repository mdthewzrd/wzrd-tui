import { createSignal } from "solid-js";
import { render } from "@opentui/solid";

function ReturnKeyTest() {
  const [input, setInput] = createSignal("");
  const [log, setLog] = createSignal<string>("App started - Press Enter and see if name='return'");

  const addLog = (msg: string) => {
    setLog(prev => `${prev}\n${new Date().toLocaleTimeString()}: ${msg}`);
  };

  const handleSubmit = () => {
    addLog(`✅ SUBMITTED: "${input()}"`);
    setInput("");
  };

  return (
    <box flexDirection="column" flexGrow={1} backgroundColor="#080808" padding={1}>
      <text fg="#fab283"><strong>RETURN KEY TEST</strong></text>
      <text fg="#808080">Testing if OpenTUI sends name="return"</text>
      
      <box marginTop={1}>
        <textarea
          placeholder="Type here and press Enter..."
          flexGrow={1}
          backgroundColor="#141414"
          onSubmit={handleSubmit}
          onKeyDown={(e: any) => {
            addLog(`KeyDown: name="${e.name}", ctrl=${e.ctrl}, shift=${e.shift}`);
            if (e.name === "return" && !e.shift) {
              addLog("🎯 RETURN detected (no shift) - SUBMITTING!");
              e.preventDefault();
              handleSubmit();
            }
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
        <text fg="#808080"><strong>Expected behavior:</strong></text>
        <text fg="#eeeeee">• Press Enter → should show name="return"</text>
        <text fg="#eeeeee">• Shift+Enter → should NOT submit (for newline)</text>
        <text fg="#eeeeee">• onSubmit should be called after Enter</text>
      </box>
    </box>
  );
}

render(() => <ReturnKeyTest />);