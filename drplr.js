#!/usr/bin/env node

const { handleUploadCommand } = require('./lib/commands/upload');
const { handleLinkCommand } = require('./lib/commands/link');
const { handleNoteCommand } = require('./lib/commands/note');
const { handleAuthCommand } = require('./lib/commands/auth');
const { handleCompletionsCommand } = require('./lib/commands/completions');
const { executeCommand } = require('./lib/command-utils');
const logger = require('./lib/logger');

function showHelp() {
  // Help should go to stderr in porcelain mode since it's not the main output
  const helpOutput = `
drplr - Droplr CLI tool for uploading files and creating links

Usage:
  drplr <file>                           Upload a file
  drplr link <url>                       Create a short link
  drplr note <text>                      Create a text note
  drplr note --file <file>               Create note from file
  drplr note --code <code> --lang <lang> Create code snippet
  drplr note --code --file <file>        Create code snippet from file
  drplr auth token <jwt_token>           Set JWT token from browser
  drplr auth login <username> <password> Set username/password
  drplr auth 1password <item>            Use 1Password CLI for credentials
  drplr completions [shell]              Generate shell completions
  drplr help                             Show this help

Options:
  --private, -p                          Make upload/link private (default: public)
  --password <password>                  Set password protection
  --title <title>                        Set custom title (links only)
  --help, -h                             Show help

Global Flags:
  --porcelain                            Minimal output, only the URL (errors to stderr)
  --debug                                Debug mode with full API responses

Examples:
  # File uploads
  drplr image.png
  drplr document.pdf --private
  drplr secret.txt --private --password mypass123

  # Link shortening
  drplr link https://example.com/very/long/url
  drplr link https://example.com --title "Custom Title"
  drplr link https://example.com --private --password secret

  # Note/text drops
  drplr note "Quick text note"
  drplr note --file notes.txt --private
  drplr note --code "console.log('hello')" --lang javascript --title "Code Snippet"
  drplr note --code --file script.js --private

  # Using global flags
  drplr image.png --porcelain              # Only output the URL
  drplr image.png --debug                  # Show API response details
  drplr link https://example.com --porcelain --debug  # Minimal output + debug info

Authentication:
  # Method 1: 1Password CLI (recommended)
  # Requires 1Password CLI: https://developer.1password.com/docs/cli
  drplr auth 1password "Droplr"          # Use item name or ID

  # Method 2: Extract JWT from browser
  # 1. Log into https://d.pr in your browser
  # 2. Open Chrome DevTools > Application > Cookies > d.pr
  # 3. Copy the JWT token value
  drplr auth token eyJhbGciOiJIUzI1NiIs...

  # Method 3: Use username/password
  drplr auth login your_username your_password

Shell Completions:
  drplr completions --install            # Auto-install for your shell
  eval "$(drplr completions zsh)"        # Or manually load for zsh
  eval "$(drplr completions bash)"       # Or manually load for bash
  drplr completions fish | source        # Or manually load for fish

Get help at: https://github.com/Droplr/droplr-js
`;

  logger.info(helpOutput);
}

// Global-only flags (not in common options from arg-parser)
const globalFlagsMeta = [
  { long: '--porcelain', description: 'Minimal output, only the URL' },
  { long: '--debug', description: 'Debug mode with full API responses' }
];

function parseGlobalArgs(args) {
  const globalOptions = {
    porcelain: false,
    debug: false
  };

  const filteredArgs = [];
  let showHelp = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--porcelain') {
      globalOptions.porcelain = true;
    } else if (arg === '--debug') {
      globalOptions.debug = true;
    } else if (arg === '--help' || arg === '-h') {
      showHelp = true;
    } else {
      filteredArgs.push(arg);
    }
  }

  return { globalOptions, filteredArgs, showHelp };
}

async function main() {
  const args = process.argv.slice(2);
  const { globalOptions, filteredArgs, showHelp: wantHelp } = parseGlobalArgs(args);

  // Initialize logger with global options
  logger.initLogger(globalOptions);

  if (wantHelp || filteredArgs.length === 0 || filteredArgs[0] === 'help') {
    showHelp();
    return;
  }

  if (filteredArgs[0] === 'link') {
    const linkCommand = handleLinkCommand(filteredArgs.slice(1), globalOptions);
    await executeCommand(linkCommand, 'Link creation');
    return;
  }

  if (filteredArgs[0] === 'note') {
    const noteCommand = handleNoteCommand(filteredArgs.slice(1), globalOptions);
    await executeCommand(noteCommand, 'Note creation');
    return;
  }

  if (filteredArgs[0] === 'completions') {
    handleCompletionsCommand(filteredArgs.slice(1));
    return;
  }

  if (filteredArgs[0] === 'auth') {
    await handleAuthCommand(filteredArgs.slice(1));
    return;
  }

  // Keep 'config' as alias for backwards compatibility
  if (filteredArgs[0] === 'config') {
    await handleAuthCommand(filteredArgs.slice(1));
    return;
  }

  // Default case: file upload
  const uploadCommand = handleUploadCommand(filteredArgs, globalOptions);
  await executeCommand(uploadCommand, 'Upload');
}

module.exports = { globalFlagsMeta };

if (require.main === module) {
  main().catch(error => {
    logger.error('Unexpected error:', error.message);
    process.exit(1);
  });
}