// Wrapped Input Component for OpenTUI
// Simple version - cursor always at end, no cursor positioning

import { createSignal, Show } from "solid-js";
import { useKeyboard } from "@opentui/solid";

interface WrappedInputProps {
  value: string;
  onInput: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  maxWidth?: number;
  backgroundColor?: string;
  textColor?: string;
  cursorColor?: string;
}

export function WrappedInput(props: WrappedInputProps) {
  const maxWidth = props.maxWidth || 60;
  const [showCursor, setShowCursor] = createSignal(true);

  // Blink cursor
  setInterval(() => {
    setShowCursor(prev => !prev);
  }, 500);

  // Handle keyboard input
  useKeyboard((key) => {
    // Submit on Enter (no shift)
    if (key.name === 'return' && !key.shift) {
      props.onSubmit();
      return;
    }

    // Insert newline on Shift+Enter
    if (key.name === 'return' && key.shift) {
      props.onInput(props.value + '\n');
      return;
    }

    // Backspace
    if (key.name === 'backspace') {
      if (props.value.length > 0) {
        props.onInput(props.value.slice(0, -1));
      }
      return;
    }

    // Regular character input
    if (key.sequence && key.sequence.length === 1 && !key.ctrl && !key.meta) {
      props.onInput(props.value + key.sequence);
    }
  });

  // Simple wrap - just chunk text
  const wrapText = (text: string): string[] => {
    if (!text) return [];
    const lines: string[] = [];
    for (let i = 0; i < text.length; i += maxWidth) {
      lines.push(text.slice(i, i + maxWidth));
    }
    return lines.length ? lines : [''];
  };

  const lines = () => wrapText(props.value);

  return (
    <box
      flexDirection="column"
      backgroundColor={props.backgroundColor || "#1e1e1e"}
      padding={1}
    >
      <Show when={props.value} fallback={
        <text fg={props.textColor ? `${props.textColor} dim` : "#808080"}>
          {props.placeholder || "Type a message..."}
        </text>
      }>
        {() => {
          const wrapped = lines();
          return wrapped.map((line, idx) => {
            const isLastLine = idx === wrapped.length - 1;
            if (isLastLine && showCursor()) {
              // Show cursor on last line
              return (
                <box flexDirection="row">
                  <text fg={props.textColor || "#eeeeee"}>{line}</text>
                  <text fg={props.cursorColor || "#fab283"}>▏</text>
                </box>
              );
            }
            return <text fg={props.textColor || "#eeeeee"}>{line}</text>;
          });
        }}
      </Show>
    </box>
  );
}
