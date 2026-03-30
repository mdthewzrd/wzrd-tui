import { createSignal } from "solid-js";
import { render } from "@opentui/solid";

function SimpleTest() {
  const [count, setCount] = createSignal(0);
  
  return (
    <box flexDirection="column" padding={2}>
      <text>Simple Test: {count()}</text>
      <button onClick={() => setCount(count() + 1)}>Increment</button>
    </box>
  );
}

render(() => <SimpleTest />);