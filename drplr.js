#!/usr/bin/env node

const { handleUploadCommand } = require('./lib/commands/upload');
const { handleLinkCommand } = require('./lib/commands/link');
const { handleNoteCommand } = require('./lib/commands/note');
const { handleAuthCommand } = require('./lib/commands/auth');
const { handleBoardCommand } = require('./lib/commands/board');
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
  drplr auth token <jwt_token>           Set JWT token from browser
  drplr auth login <username> <password> Set username/password
  drplr boards                           List available boards
  drplr board create "Project Assets"    Create new board
  drplr board <board_id>                 Show board contents
  drplr board update <board_id> --title "New Name"  Update board
  drplr board delete <board_id>          Delete board
  drplr board watch <board_id>           Subscribe to board notifications
  drplr help                             Show this help

Options:
  --private, -p                          Make upload/link private (default: public)
  --password <password>                  Set password protection
  --title <title>                        Set custom title (links only)
  --board <board_name>                   Upload to specific board
  --help, -h                             Show help

Global Flags:
  --porcelain                            Minimal output, only the URL (errors to stderr)
  --debug                                Debug mode with full API responses

Examples:
  # File uploads
  drplr image.png
  drplr document.pdf --private
  drplr secret.txt --private --password mypass123
  drplr image.png --board "Project Assets"

  # Link shortening
  drplr link https://example.com/very/long/url
  drplr link https://example.com --title "Custom Title"
  drplr link https://example.com --private --password secret

  # Note/text drops
  drplr note "Quick text note"
  drplr note --file notes.txt --private
  drplr note --code "console.log('hello')" --lang javascript --title "Code Snippet"

  # Board management
  drplr boards                             # List all boards
  drplr board create "Website Assets"      # Create new board
  drplr board 12345                        # Show board contents
  drplr board update 12345 --title "UI Assets"  # Update board title

  # Using global flags
  drplr image.png --porcelain              # Only output the URL
  drplr image.png --debug                  # Show API response details
  drplr link https://example.com --porcelain --debug  # Minimal output + debug info

Authentication:
  # Method 1: Extract JWT from browser (easiest)
  # 1. Log into https://d.pr in your browser
  # 2. Open Chrome DevTools > Application > Cookies > d.pr
  # 3. Copy the JWT token value
  drplr auth token eyJhbGciOiJIUzI1NiIs...

  # Method 2: Use username/password
  drplr auth login your_username your_password

Get help at: https://github.com/Droplr/droplr-js
`;

  logger.info(helpOutput);
}

function parseGlobalArgs(args) {
  const globalOptions = {
    porcelain: false,
    debug: false
  };

  const filteredArgs = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--porcelain') {
      globalOptions.porcelain = true;
    } else if (arg === '--debug') {
      globalOptions.debug = true;
    } else {
      filteredArgs.push(arg);
    }
  }

  return { globalOptions, filteredArgs };
}

async function main() {
  const args = process.argv.slice(2);
  const { globalOptions, filteredArgs } = parseGlobalArgs(args);

  // Initialize logger with global options
  logger.initLogger(globalOptions);

  if (filteredArgs.length === 0 || filteredArgs[0] === 'help') {
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

  if (filteredArgs[0] === 'auth') {
    await handleAuthCommand(filteredArgs.slice(1));
    return;
  }

  // Keep 'config' as alias for backwards compatibility
  if (filteredArgs[0] === 'config') {
    await handleAuthCommand(filteredArgs.slice(1));
    return;
  }

  if (filteredArgs[0] === 'boards' || filteredArgs[0] === 'board') {
    const boardArgs = filteredArgs[0] === 'boards' ? [] : filteredArgs.slice(1);
    const boardCommand = handleBoardCommand(boardArgs, globalOptions);
    await executeCommand(boardCommand, 'Board operation');
    return;
  }

  // Default case: file upload
  const uploadCommand = handleUploadCommand(filteredArgs, globalOptions);
  await executeCommand(uploadCommand, 'Upload');
}

if (require.main === module) {
  main().catch(error => {
    logger.error('Unexpected error:', error.message);
    process.exit(1);
  });
}