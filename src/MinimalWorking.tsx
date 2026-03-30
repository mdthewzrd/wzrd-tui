import { createSignal } from "solid-js";
import { render } from "@opentui/solid";

function MinimalWorking() {
  const [input, setInput] = createSignal("");
  const [log, setLog] = createSignal("Minimal test - type something");

  const handleSubmit = () => {
    setLog(`Submitted: "${input()}"`);
    setInput("");
  };

  return (
    <box flexDirection="column" flexGrow={1} backgroundColor="#080808" padding={1}>
      <text><strong>Minimal Working Test</strong></text>
      <text>No complex props, just basics</text>
      
      <box marginTop={1}>
        <textarea
          placeholder="Type here..."
          flexGrow={1}
          onSubmit={handleSubmit}
          onKeyDown={(e: any) => {
            if (e.name === "return" && !e.shift) {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />
      </box>
      
      <box marginTop={1}>
        <text>Log: {log()}</text>
      </box>
    </box>
  );
}

render(() => <MinimalWorking />);