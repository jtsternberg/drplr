#!/usr/bin/env node

const path = require('path');
const { setCredentials } = require('./lib/config');
const { uploadFile } = require('./lib/upload');
const { createLink } = require('./lib/link');
const { requireAuthentication, executeCommand } = require('./lib/command-utils');

function showHelp() {
  console.log(`
drplr - Droplr CLI tool for uploading files and creating links

Usage:
  drplr <file>                           Upload a file
  drplr link <url>                       Create a short link
  drplr config token <jwt_token>         Set JWT token from browser
  drplr config login <username> <password>  Set username/password
  drplr help                             Show this help

Options:
  --private, -p                          Make upload/link private (default: public)
  --password <password>                  Set password protection
  --title <title>                        Set custom title (links only)
  --help, -h                             Show help

Examples:
  # File uploads
  drplr image.png
  drplr document.pdf --private
  drplr secret.txt --private --password mypass123
  
  # Link shortening
  drplr link https://example.com/very/long/url
  drplr link https://example.com --title "Custom Title"
  drplr link https://example.com --private --password secret

Authentication:
  # Method 1: Extract JWT from browser (easiest)
  # 1. Log into https://d.pr in your browser
  # 2. Open Chrome DevTools > Application > Cookies > d.pr
  # 3. Copy the JWT token value
  drplr config token eyJhbGciOiJIUzI1NiIs...

  # Method 2: Use username/password
  drplr config login your_username your_password

Get help at: https://github.com/Droplr/droplr-js
`);
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

async function handleLinkCommand(args) {
  if (args.length === 0) {
    console.error('Error: Please specify a URL to shorten');
    console.error('Usage: drplr link <url> [options]');
    console.error('Use "drplr help" for more information');
    process.exit(1);
  }

  const { filePath: url, options } = parseArgs(args);

  if (!url) {
    console.error('Error: Please specify a URL to shorten');
    console.error('Use "drplr help" for usage information');
    process.exit(1);
  }

  await executeCommand(async () => {
    const credentials = requireAuthentication();
    
    console.log(`Creating short link for ${url}...`);

    const result = await createLink(url, credentials, options);

    console.log('✓ Link created successfully!');

    if (options.title) {
      console.log(`Title: ${options.title}`);
    }

    if (result.privacy === 'PRIVATE') {
      console.log('Privacy: Private');
    } else if (options.privacy === 'PRIVATE') {
      console.log('Privacy: Public (private link not supported or failed)');
    }

    if (options.password) {
      console.log('Password protected: Yes');
    }

    console.log(`Short URL: ${result.shortlink || result.link || result.url}`);
    console.log(`Original URL: ${url}`);
  }, 'Link creation');
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === 'help') {
    showHelp();
    return;
  }

  if (args[0] === 'link') {
    await handleLinkCommand(args.slice(1));
    return;
  }

  if (args[0] === 'config') {
    if (args[1] === 'token') {
      if (args.length !== 3) {
        console.error('Usage: drplr config token <jwt_token>');
        process.exit(1);
      }

      const token = args[2];

      if (setCredentials('jwt', token)) {
        console.log('✓ JWT token saved successfully');
      } else {
        console.error('✗ Failed to save JWT token');
        process.exit(1);
      }
      return;
    }

    if (args[1] === 'login') {
      if (args.length !== 4) {
        console.error('Usage: drplr config login <username> <password>');
        process.exit(1);
      }

      const [, , username, password] = args;

      if (setCredentials('basic', username, password)) {
        console.log('✓ Login credentials saved successfully');
      } else {
        console.error('✗ Failed to save login credentials');
        process.exit(1);
      }
      return;
    }

    console.error('Usage: drplr config [token|login] ...');
    console.error('Run "drplr help" for more information');
    process.exit(1);
  }

  const { filePath, options } = parseArgs(args);

  if (!filePath) {
    console.error('Error: Please specify a file to upload');
    console.error('Use "drplr help" for usage information');
    process.exit(1);
  }

  await executeCommand(async () => {
    const credentials = requireAuthentication();
    
    console.log(`Uploading ${path.basename(filePath)}...`);

    const result = await uploadFile(filePath, credentials, options);

    console.log('✓ Upload successful!');

    if (result.privacy === 'PRIVATE') {
      console.log('Privacy: Private');
    } else if (options.privacy === 'PRIVATE') {
      console.log('Privacy: Public (private upload not supported or failed)');
    }

    if (options.password) {
      console.log('Password protected: Yes');
    }

    console.log(`URL: ${result.shortlink || result.link || result.url}`);
  }, 'Upload');
}

if (require.main === module) {
  main().catch(error => {
    console.error('Unexpected error:', error.message);
    process.exit(1);
  });
}