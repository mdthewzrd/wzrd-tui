import { createSignal } from "solid-js";
import { render } from "@opentui/solid";

function FixedKeyTest() {
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
      <text fg="#fab283"><strong>FIXED KEY TEST</strong></text>
      <text fg="#808080">Listening for name="return" not "enter"</text>
      
      <box marginTop={1}>
        <textarea
          placeholder="Type and press Enter (should be return)..."
          flexGrow={1}
          backgroundColor="#141414"
          onSubmit={handleSubmit}
          onKeyDown={(e: any) => {
            // OpenTUI uses e.name, not e.key!
            // USER SAYS: name = "return" not "enter"!
            addLog(`KeyDown: name="${e.name}", ctrl=${e.ctrl}, shift=${e.shift}`);
            if (e.name === "return" && !e.shift) {
              addLog("RETURN detected (no shift) - SUBMITTING!");
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
        <text fg="#808080"><strong>OpenTUI KeyEvent properties:</strong></text>
        <text fg="#eeeeee">• name (not key)</text>
        <text fg="#eeeeee">• ctrl, shift, meta</text>
        <text fg="#eeeeee">• name="return" not "enter" or "Enter"</text>
      </box>
    </box>
  );
}

render(() => <FixedKeyTest />);