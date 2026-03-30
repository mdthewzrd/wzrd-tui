import { createSignal } from "solid-js";
import { OpencodeTheme } from "./theme";

export function SimpleTest() {
  const [count, setCount] = createSignal(0);
  
  return (
    <box 
      flexDirection="column" 
      flexGrow={1}
      backgroundColor={OpencodeTheme.background}
      padding={2}
    >
      <text fg={OpencodeTheme.text}>
        <strong>WZRD.dev OpenTUI Test</strong>
      </text>
      
      <box marginTop={2} border borderStyle="single" borderColor={OpencodeTheme.border}>
        <text fg={OpencodeTheme.text}>
          Count: {count()}
        </text>
      </box>
      
      <box 
        marginTop={2}
        backgroundColor={OpencodeTheme.backgroundElement}
        padding={1}
        onMouseDown={() => setCount(c => c + 1)}
      >
        <text fg={OpencodeTheme.primary}>
          Click me!
        </text>
      </box>
    </box>
  );
}