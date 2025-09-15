# drplr

A command-line interface for uploading files to Droplr using their official SDK.

[![npm version](https://badge.fury.io/js/drplr.svg)](https://badge.fury.io/js/drplr)
[![MIT licensed](https://img.shields.io/badge/license-MIT-blue.svg)](https://raw.githubusercontent.com/jtsternberg/drplr/refs/heads/master/LICENSE)
[![npm downloads](https://img.shields.io/npm/dt/drplr.svg?style=flat)](https://www.npmjs.com/package/drplr)

## Installation

```bash
npm install -g drplr
```
then use it like this:
```bash
drplr auth login your_username your_password
drplr file.png
```

_Or_ try it without installing:
```bash
npx drplr auth login your_username your_password
npx drplr file.png
```

## Authentication Setup

Choose one of these authentication methods:

### Method 1: Username/Password (Easiest)
```bash
drplr auth login your_username your_password
```

### Method 2: JWT Token (More Secure)
1. Log into [d.pr](https://d.pr) in your browser
2. Open Chrome DevTools > Application > Cookies > d.pr
3. Copy the JWT token value
4. Configure the CLI:
   ```bash
   drplr auth token eyJhbGciOiJIUzI1NiIs...
   ```

**Note:** JWT tokens may expire and may need to be refreshed periodically.

## Usage

### File Uploads
```bash
# Upload a file
drplr file.png

# Upload a private file
drplr file.png --private

# Upload with password protection
drplr file.png --private --password mypassword

# Upload with custom title
drplr document.pdf --title "Important Document"
```

### Link Shortening
```bash
# Create a short link
drplr link https://example.com/very/long/url

# Create a private link with title
drplr link https://example.com --private --title "My Link"

# Create a password-protected link
drplr link https://example.com --private --password secret123
```

### Note Creation
```bash
# Create a text note
drplr note "This is my quick note"

# Create a note from a file
drplr note --file notes.txt

# Create a private note with custom title
drplr note "Secret information" --private --title "Confidential"

# Create a code snippet
drplr note --code 'console.log("Hello, World!")' --lang javascript

# Create code snippet with title
drplr note --code 'def hello(): print("Hi!")' --lang python --title "Python Hello"
```

### Global Options
```bash
# Minimal output (just the URL)
drplr file.png --porcelain

# Debug mode with full API responses
drplr file.png --debug

# Combine global and command-specific options
drplr note "Debug this" --debug --private
```

### Help and Information
```bash
# Show comprehensive help
drplr help

# Get help for specific commands (shows in usage examples)
drplr link
drplr note
```

## Features

### Core Drop Types
- ✅ File uploads to Droplr using official SDK
- ✅ Link shortening (URL drops) with title support
- ✅ Note creation (text, file-based, and code snippets)
- ✅ Code syntax highlighting for 25+ programming languages
- ✅ Custom titles for all drop types

### Privacy & Security
- ✅ Public and private uploads/links/notes
- ✅ Password protection for all drop types
- ✅ JWT token authentication from browser
- ✅ Username/password authentication
- ✅ Encrypted credential storage with machine-specific keys

### User Experience
- ✅ Comprehensive help system with examples
- ✅ Global flags (--porcelain for minimal output, --debug for diagnostics)
- ✅ Detailed error messages with field-specific validation
- ✅ Multiple file format support with automatic MIME type detection
- ✅ Backward compatibility (config command still works as alias for auth)

### Developer Experience
- ✅ Comprehensive test suite (49 passing tests)
- ✅ Modular architecture with clean separation of concerns
- ✅ Complete documentation (README, TESTING, ROADMAP)
- ✅ Multiple test script variants for different scenarios

## Requirements

- Node.js 14.0.0 or higher
- Valid Droplr account

## Testing

This project includes a comprehensive test suite with Jest:

```bash
# Run all working tests (49 tests)
npm test

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

See [TESTING.md](TESTING.md) for detailed information about the test architecture.

## Documentation

- [Testing Guide](TESTING.md) - Comprehensive testing documentation
- [Development Roadmap](ROADMAP.md) - Current features and future plans
- [Droplr JS SDK](https://github.com/Droplr/droplr-js) - Official SDK documentation
- [Droplr API Docs](https://droplr.github.io/docs/) - API reference

## Alternative Installation Methods

### Other package managers
```bash
# Yarn
yarn global add drplr

# pnpm
pnpm install -g drplr
```

### Manual install from GitHub
```bash
# Clone and set up
git clone https://github.com/jtsternberg/drplr.git
cd drplr
npm install

# Option 1: Create an alias
echo 'alias drplr="node /path/to/drplr/drplr.js"' >> ~/.bashrc
source ~/.bashrc

# Option 2: Add to PATH
export PATH="$PATH:/path/to/drplr"
```

### Development Installation
1. Clone this repository
2. Install dependencies: `npm install`
3. Link globally: `npm link`


