import { createSignal } from "solid-js";
import { OpencodeTheme } from "./theme";

export function TestTextarea() {
  const [input, setInput] = createSignal("");
  
  const handleSubmit = () => {
    console.log("Submit:", input());
    setInput("");
  };
  
  return (
    <box flexDirection="column" flexGrow={1} backgroundColor={OpencodeTheme.background} padding={2}>
      <text fg={OpencodeTheme.text}>
        <strong>Textarea Test</strong>
      </text>
      
      <box marginTop={2}>
        <text fg={OpencodeTheme.textMuted}>Type and press Enter:</text>
      </box>
      
      <box marginTop={1}>
        <textarea
          placeholder="Test textarea..."
          rows={3}
          backgroundColor={OpencodeTheme.backgroundPanel}
          fg={OpencodeTheme.text}
          onSubmit={handleSubmit}
          onKeyDown={(event) => {
            console.log("KeyDown event:", event);
            if (event.key === "Enter") {
              console.log("Enter pressed!");
              handleSubmit();
            }
          }}
        />
      </box>
      
      <box marginTop={1}>
        <text fg={OpencodeTheme.text}>Current input: "{input()}"</text>
      </box>
      
      <box marginTop={1}>
        <text fg={OpencodeTheme.textMuted}>Press Enter and check console</text>
      </box>
    </box>
  );
}