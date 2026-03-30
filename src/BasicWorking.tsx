import { createSignal } from "solid-js";
import { render } from "@opentui/solid";

function BasicWorking() {
  const [text, setText] = createSignal("");
  const [log, setLog] = createSignal("Type and press Enter...");

  const handleSubmit = () => {
    setLog(`Submitted: "${text()}"`);
    setText("");
  };

  return (
    <box flexDirection="column" flexGrow={1} backgroundColor="#0a0a0a" padding={1}>
      <text fg="#fab283"><strong>Basic Working Test</strong></text>
      
      <box marginTop={1}>
        <textarea
          placeholder="Type message..."
          flexGrow={1}
          backgroundColor="#141414"
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
        <text fg="#eeeeee">Status: {log()}</text>
      </box>
      
      <box marginTop={1}>
        <text fg="#808080">Press Enter to submit, Shift+Enter for newline</text>
      </box>
    </box>
  );
}

render(() => <BasicWorking />);