import { createSignal, For } from "solid-js";

export function WZRDOpencodeDebug() {
  const [input, setInput] = createSignal("");
  const [logs, setLogs] = createSignal<string[]>(["App started"]);
  
  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
  };

  const handleSubmit = () => {
    addLog(`Submit called with: "${input()}"`);
    setInput("");
  };

  // Test ALL possible event handlers
  return (
    <box flexDirection="column" flexGrow={1} backgroundColor="#080808">
      {/* Header */}
      <box height={1} justifyContent="space-between" paddingLeft={1} paddingRight={1} backgroundColor="#141414">
        <text fg="#808080"><strong>DEBUG</strong> OpenTUI Textarea</text>
        <text fg="#808080">Testing events</text>
      </box>
      
      {/* Main */}
      <box flexGrow={1} flexDirection="row" padding={1}>
        {/* Left: Input tests */}
        <box flexGrow={50} flexDirection="column" backgroundColor="#0c0c0c" padding={1}>
          <text fg="#fab283"><strong>Test 1: onSubmit</strong></text>
          <textarea
            value={input()}
            onInput={(e: any) => {
              addLog(`onInput: "${e.target.value}"`);
              setInput(e.target.value);
            }}
            onSubmit={handleSubmit}
            placeholder="Test onSubmit..."
            rows={2}
            flexGrow={1}
            backgroundColor="#141414"
            fg="#eeeeee"
          />
          
          <box marginTop={1}>
            <text fg="#fab283"><strong>Test 2: onKeyDown</strong></text>
            <textarea
              value={input()}
              onInput={(e: any) => setInput(e.target.value)}
              onKeyDown={(e: any) => {
                addLog(`Key: ${e.key}, shift: ${e.shiftKey}`);
                if (e.key === "Enter" && !e.shiftKey) {
                  addLog("Enter without Shift - calling handleSubmit");
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder="Test onKeyDown..."
              rows={2}
              flexGrow={1}
              backgroundColor="#141414"
              fg="#eeeeee"
            />
          </box>
          
          <box marginTop={1}>
            <text fg="#fab283"><strong>Test 3: onKeyPress</strong></text>
            <textarea
              value={input()}
              onInput={(e: any) => setInput(e.target.value)}
              onKeyPress={(e: any) => {
                addLog(`KeyPress: ${e.key}`);
              }}
              placeholder="Test onKeyPress..."
              rows={2}
              flexGrow={1}
              backgroundColor="#141414"
              fg="#eeeeee"
            />
          </box>
        </box>
        
        {/* Right: Logs */}
        <box flexGrow={50} flexDirection="column" backgroundColor="#141414" padding={1}>
          <text fg="#fab283"><strong>Event Logs</strong></text>
          <scrollbox flexGrow={1} backgroundColor="#0c0c0c" padding={1}>
            <For each={logs()}>
              {(log) => <text fg="#eeeeee">{log}</text>}
            </For>
          </scrollbox>
          
          <box marginTop={1}>
            <text fg="#808080">Current input: "{input()}"</text>
          </box>
          
          <box marginTop={1}>
            <text fg="#7fd88f"><strong>Instructions:</strong></text>
            <text fg="#eeeeee">1. Type in any textarea</text>
            <text fg="#eeeeee">2. Press Enter</text>
            <text fg="#eeeeee">3. Check logs for events</text>
          </box>
        </box>
      </box>
      
      {/* Footer */}
      <box height={1} justifyContent="space-between" paddingLeft={1} paddingRight={1} backgroundColor="#1e1e1e">
        <text fg="#808080">Debugging OpenTUI events</text>
        <text fg="#eeeeee"><strong>Testing</strong></text>
      </box>
    </box>
  );
}