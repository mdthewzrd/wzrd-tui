import { render } from "@opentui/solid";
import { OpencodeTheme } from "./theme";

function TestFix() {
  return (
    <box 
      flexDirection="column" 
      flexGrow={1}
      backgroundColor={OpencodeTheme.background}
      padding={2}
    >
      <text fg={OpencodeTheme.text}>
        <strong>Text Props Test</strong>
      </text>
      
      <box marginTop={2}>
        <text fg={OpencodeTheme.primary}>
          Primary: {OpencodeTheme.primary}
        </text>
      </box>
      
      <box marginTop={1}>
        <text fg={OpencodeTheme.textMuted}>
          Muted: {OpencodeTheme.textMuted}
        </text>
      </box>
      
      <box marginTop={1} border borderStyle="single" borderColor={OpencodeTheme.border}>
        <text fg={OpencodeTheme.success}>
          Success border test
        </text>
      </box>
    </box>
  );
}

render(() => <TestFix />);