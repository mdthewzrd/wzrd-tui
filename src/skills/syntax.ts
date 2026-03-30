// Simple syntax highlighting for terminal display
// Uses ANSI color codes for different token types

export type TokenType = 
  | "keyword"
  | "string"
  | "comment"
  | "number"
  | "function"
  | "type"
  | "operator"
  | "plain";

export interface Token {
  type: TokenType;
  content: string;
}

// ANSI color codes
export const colors: Record<TokenType, string> = {
  keyword: "\x1b[35m",    // Magenta
  string: "\x1b[32m",     // Green
  comment: "\x1b[90m",    // Gray
  number: "\x1b[33m",     // Yellow
  function: "\x1b[36m",   // Cyan
  type: "\x1b[34m",       // Blue
  operator: "\x1b[31m",   // Red
  plain: "\x1b[0m",       // Reset
};

const reset = "\x1b[0m";

// Keywords for common languages
const keywords = new Set([
  // TypeScript/JavaScript
  "const", "let", "var", "function", "class", "interface", "type", "enum",
  "if", "else", "for", "while", "do", "switch", "case", "break", "continue",
  "return", "throw", "try", "catch", "finally", "async", "await", "import",
  "export", "from", "default", "extends", "implements", "new", "this", "super",
  "static", "public", "private", "protected", "readonly", "abstract", "override",
  "in", "of", "as", "is", "typeof", "instanceof", "void", "null", "undefined",
  "true", "false", "debugger", "with", "yield", "delete",
  // Python
  "def", "class", "if", "elif", "else", "for", "while", "try", "except",
  "finally", "with", "as", "import", "from", "return", "yield", "lambda",
  "pass", "break", "continue", "raise", "assert", "del", "global", "nonlocal",
  "True", "False", "None", "and", "or", "not", "in", "is",
  // Rust
  "fn", "let", "mut", "const", "static", "struct", "enum", "trait", "impl",
  "pub", "use", "mod", "match", "if", "else", "while", "for", "loop",
  "return", "break", "continue", "async", "await", "move", "ref", "where",
  "type", "dyn", "Self", "self", "super", "crate", "extern", "unsafe",
  // Go
  "func", "var", "const", "type", "struct", "interface", "map", "chan",
  "if", "else", "for", "range", "switch", "case", "default", "break",
  "continue", "return", "go", "defer", "select", "fallthrough", "goto",
  "package", "import", "nil", "true", "false",
  // Common
  "int", "string", "bool", "float", "double", "char", "byte", "void",
  "any", "unknown", "never", "object", "array", "map", "set", "promise",
]);

// Type names (common patterns)
const typePatterns = [
  /^[A-Z][a-zA-Z0-9_]*$/, // PascalCase
  /^(string|number|boolean|any|void|null|undefined|unknown|never|object|Array|Map|Set|Promise|Record|Partial|Required|Readonly|Pick|Omit|Exclude|Extract|Parameters|ReturnType|InstanceType|ThisParameterType|OmitThisParameter|ThisType|Uppercase|Lowercase|Capitalize|Uncapitalize)$/, // Built-in types
];

// Detect language from file extension or content
export function detectLanguage(filePath: string, content: string): string {
  const ext = filePath.split(".").pop()?.toLowerCase();
  
  const langMap: Record<string, string> = {
    "ts": "typescript",
    "tsx": "typescript",
    "js": "javascript",
    "jsx": "javascript",
    "py": "python",
    "rs": "rust",
    "go": "go",
    "java": "java",
    "kt": "kotlin",
    "swift": "swift",
    "c": "c",
    "cpp": "cpp",
    "h": "c",
    "hpp": "cpp",
    "cs": "csharp",
    "rb": "ruby",
    "php": "php",
    "sh": "bash",
    "bash": "bash",
    "zsh": "bash",
    "json": "json",
    "yaml": "yaml",
    "yml": "yaml",
    "toml": "toml",
    "md": "markdown",
    "html": "html",
    "css": "css",
    "scss": "scss",
    "sass": "scss",
    "less": "less",
    "sql": "sql",
    "graphql": "graphql",
    "gql": "graphql",
  };
  
  return langMap[ext || ""] || "plaintext";
}

// Simple tokenizer
export function tokenize(code: string, language: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  
  while (i < code.length) {
    const char = code[i] || "";
    const nextChar = code[i + 1] || "";
    
    // Skip whitespace
    if (/\s/.test(char)) {
      let j = i;
      while (j < code.length && /\s/.test(code[j] || "")) j++;
      tokens.push({ type: "plain", content: code.slice(i, j) });
      i = j;
      continue;
    }
    
    // Comments
    if (char === "/" && nextChar === "/") {
      let j = i;
      while (j < code.length && code[j] !== "\n") j++;
      tokens.push({ type: "comment", content: code.slice(i, j) });
      i = j;
      continue;
    }
    
    if (char === "/" && nextChar === "*") {
      let j = i;
      while (j < code.length - 1 && !((code[j] || "") === "*" && (code[j + 1] || "") === "/")) j++;
      j += 2;
      tokens.push({ type: "comment", content: code.slice(i, j) });
      i = j;
      continue;
    }
    
    // Strings
    if (char === '"' || char === "'" || char === "`") {
      const quote = char;
      let j = i + 1;
      while (j < code.length && code[j] !== quote) {
        if (code[j] === "\\") j++;
        j++;
      }
      if (j < code.length) j++;
      tokens.push({ type: "string", content: code.slice(i, j) });
      i = j;
      continue;
    }
    
    // Numbers
    if (/\d/.test(char)) {
      let j = i;
      while (j < code.length && /[\d.]/.test(code[j] || "")) j++;
      tokens.push({ type: "number", content: code.slice(i, j) });
      i = j;
      continue;
    }
    
    // Identifiers and keywords
    if (/[a-zA-Z_]/.test(char)) {
      let j = i;
      while (j < code.length && /[a-zA-Z0-9_]/.test(code[j] || "")) j++;
      const word = code.slice(i, j);
      
      if (keywords.has(word)) {
        tokens.push({ type: "keyword", content: word });
      } else if (typePatterns.some(p => p.test(word))) {
        tokens.push({ type: "type", content: word });
      } else if ((code[j] || "") === "(") {
        tokens.push({ type: "function", content: word });
      } else {
        tokens.push({ type: "plain", content: word });
      }
      i = j;
      continue;
    }
    
    // Operators
    if (/[+\-*/%=<>!&|^~]/.test(char)) {
      tokens.push({ type: "operator", content: char });
      i++;
      continue;
    }
    
    // Other characters
    tokens.push({ type: "plain", content: char });
    i++;
  }
  
  return tokens;
}

// Highlight code
export function highlight(code: string, language: string = "plaintext"): string {
  if (language === "json") {
    return highlightJSON(code);
  }
  
  const tokens = tokenize(code, language);
  return tokens.map(t => `${colors[t.type]}${t.content}${reset}`).join("");
}

// JSON-specific highlighting
function highlightJSON(code: string): string {
  return code
    .replace(/(".*?")/g, `${colors.string}$1${reset}`)
    .replace(/\b(true|false|null)\b/g, `${colors.keyword}$1${reset}`)
    .replace(/(\d+)/g, `${colors.number}$1${reset}`);
}

// Highlight code block in markdown
export function highlightCodeBlock(content: string): string {
  // Match code blocks with language
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  
  return content.replace(codeBlockRegex, (match, lang, code) => {
    const language = lang || "plaintext";
    const highlighted = highlight(code, language);
    return `\`\`\`${language}\n${highlighted}\n\`\`\``;
  });
}

// Strip ANSI codes (for plain text display)
export function stripAnsi(text: string): string {
  return text.replace(/\x1b\[\d+m/g, "");
}

export default {
  detectLanguage,
  tokenize,
  highlight,
  highlightCodeBlock,
  stripAnsi,
  colors,
};
