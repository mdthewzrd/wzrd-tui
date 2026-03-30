// WZRD TUI v1.1 - Phase 6 Enhancements
// Features: Plan Mode, Extended Thinking, Session Names, @ References, Skills System, Image Support, CLAUDE.md

// Cleanup terminal on exit
function cleanupTerminal() {
  // Clear screen, reset cursor, show cursor, reset colors
  process.stdout.write('\x1b[2J\x1b[0f\x1b[?25h\x1b[0m\r\n');
}

process.on('exit', cleanupTerminal);
process.on('beforeExit', cleanupTerminal);

process.on('SIGINT', () => {
  cleanupTerminal();
  process.exit(0);
});

process.on('SIGTERM', () => {
  cleanupTerminal();
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  cleanupTerminal();
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

import "./WZRDOpencodeClone";
