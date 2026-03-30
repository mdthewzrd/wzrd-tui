import { createSignal } from "solid-js";
import { render } from "@opentui/solid";

function DebugEnter() {
  const [input, setInput] = createSignal("");
  const [log, setLog] = createSignal("DEBUG: Press Enter in textarea");

  return (
    <box flexDirection="column" flexGrow={1} backgroundColor="#0a0a0a" padding={1}>
      <text fg="#fab283"><strong>DEBUG ENTER KEY</strong></text>
      <text fg="#808080">Testing OpenTUI textarea event handling</text>
      
      <box marginTop={1}>
        <textarea
          placeholder="Type and press Enter..."
          flexGrow={1}
          backgroundColor="#141414"
          onSubmit={() => {
            setLog(prev => `${prev}\n✅ onSubmit called!`);
          }}
          onKeyDown={(e: any) => {
            setLog(prev => `${prev}\n🔑 KeyDown: name="${e.name}", ctrl=${e.ctrl}, shift=${e.shift}`);
            
            // Try BOTH approaches
            if (e.name === "return" && !e.shift) {
              setLog(prev => `${prev}\n🎯 RETURN detected - calling preventDefault`);
              e.preventDefault();
              // Manually trigger submit
              setLog(prev => `${prev}\n🚀 Manual submit triggered`);
            }
          }}
          onKeyPress={(e: any) => {
            setLog(prev => `${prev}\n🔠 KeyPress: name="${e.name}"`);
          }}
        />
      </box>
      
      <box marginTop={1}>
        <text fg="#eeeeee">Event Log:</text>
        <text fg="#7fd88f">{log()}</text>
      </box>
      
      <box marginTop={1}>
        <text fg="#808080"><strong>Testing steps:</strong></text>
        <text fg="#eeeeee">1. Type something in textarea</text>
        <text fg="#eeeeee">2. Press Enter key</text>
        <text fg="#eeeeee">3. Check if onSubmit is called</text>
        <text fg="#eeeeee">4. Check if onKeyDown sees name="return"</text>
      </box>
    </box>
  );
}

render(() => <DebugEnter />);