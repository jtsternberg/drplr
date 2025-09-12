#!/usr/bin/env node

const path = require('path');
const { uploadFile } = require('./lib/commands/upload');
const { createLink } = require('./lib/commands/link');
const { handleAuthCommand } = require('./lib/commands/auth');
const { requireAuthentication, executeCommand } = require('./lib/command-utils');
const logger = require('./lib/logger');

function showHelp() {
  // Help should go to stderr in porcelain mode since it's not the main output
  const helpOutput = `
drplr - Droplr CLI tool for uploading files and creating links

Usage:
  drplr <file>                           Upload a file
  drplr link <url>                       Create a short link
  drplr auth token <jwt_token>           Set JWT token from browser
  drplr auth login <username> <password> Set username/password
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

function parseArgs(args) {
  const options = {
    privacy: 'PUBLIC',
    password: null,
    title: null
  };

  let filePath = null;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--private' || arg === '-p') {
      options.privacy = 'PRIVATE';
    } else if (arg === '--password') {
      options.password = args[++i];
    } else if (arg === '--title') {
      options.title = args[++i];
    } else if (arg === '--help' || arg === '-h') {
      showHelp();
      process.exit(0);
    } else if (!arg.startsWith('-') && !filePath) {
      filePath = arg;
    }
  }

  return { filePath, options };
}

async function handleLinkCommand(args, globalOptions) {
  if (args.length === 0) {
    logger.error('Error: Please specify a URL to shorten');
    logger.error('Usage: drplr link <url> [options]');
    logger.error('Use "drplr help" for more information');
    process.exit(1);
  }

  const { filePath: url, options } = parseArgs(args);

  if (!url) {
    logger.error('Error: Please specify a URL to shorten');
    logger.error('Use "drplr help" for usage information');
    process.exit(1);
  }

  await executeCommand(async () => {
    const credentials = requireAuthentication();
    
    logger.log(`Creating short link for ${url}...`);

    const result = await createLink(url, credentials, options);

    if (globalOptions.porcelain) {
      logger.output(result.shortlink || result.link || result.url);
    } else {
      logger.log('✓ Link created successfully!');

      if (options.title) {
        logger.log(`Title: ${options.title}`);
      }

      if (result.privacy === 'PRIVATE') {
        logger.log('Privacy: Private');
      } else if (options.privacy === 'PRIVATE') {
        logger.log('Privacy: Public (private link not supported or failed)');
      }

      if (options.password) {
        logger.log('Password protected: Yes');
      }

      logger.log(`Short URL: ${result.shortlink || result.link || result.url}`);
      logger.log(`Original URL: ${url}`);
    }
  }, 'Link creation');
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
    await handleLinkCommand(filteredArgs.slice(1), globalOptions);
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

  const { filePath, options } = parseArgs(filteredArgs);

  if (!filePath) {
    logger.error('Error: Please specify a file to upload');
    logger.error('Use "drplr help" for usage information');
    process.exit(1);
  }

  await executeCommand(async () => {
    const credentials = requireAuthentication();
    
    logger.log(`Uploading ${path.basename(filePath)}...`);

    const result = await uploadFile(filePath, credentials, options);

    if (globalOptions.porcelain) {
      logger.output(result.shortlink || result.link || result.url);
    } else {
      logger.log('✓ Upload successful!');

      if (options.title) {
        logger.log(`Title: ${options.title}`);
      }

      if (result.privacy === 'PRIVATE') {
        logger.log('Privacy: Private');
      } else if (options.privacy === 'PRIVATE') {
        log('Privacy: Public (private upload not supported or failed)');
      }

      if (options.password) {
        logger.log('Password protected: Yes');
      }

      logger.log(`URL: ${result.shortlink || result.link || result.url}`);
    }
  }, 'Upload');
}

if (require.main === module) {
  main().catch(error => {
    logger.error('Unexpected error:', error.message);
    process.exit(1);
  });
}