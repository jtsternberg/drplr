# drplr

A command-line interface for uploading files to Droplr using their official SDK.

## Installation

```bash
npm install -g drplr
```
then use it like this:
```bash
drplr config login your_username your_password
drplr file.png
```

_Or_ try it without installing:
```bash
npx drplr config login your_username your_password
npx drplr file.png
```

## Authentication Setup

Choose one of these authentication methods:

### Method 1: Username/Password (Easiest)
```bash
drplr config login your_username your_password
```

### Method 2: JWT Token (More Secure)
1. Log into [d.pr](https://d.pr) in your browser
2. Open Chrome DevTools > Application > Cookies > d.pr
3. Copy the JWT token value
4. Configure the CLI:
   ```bash
   drplr config token eyJhbGciOiJIUzI1NiIs...
   ```

**Note:** JWT tokens may expire and may need to be refreshed periodically.

## Usage

### Upload a file
```bash
drplr file.png
```

### Upload a private file
```bash
drplr file.png --private
```

### Upload with password protection
```bash
drplr file.png --private --password mypassword
```

### Show help
```bash
drplr help
```

## Features

- ✅ File uploads to Droplr using official SDK
- ✅ JWT token authentication from browser
- ✅ Username/password authentication
- ✅ Public and private uploads
- ✅ Password protection
- ✅ Multiple file format support
- ✅ Error handling and user feedback
- ✅ Configuration management

## Requirements

- Node.js 14.0.0 or higher
- Valid Droplr account

## Documentation

- [Droplr JS SDK](https://github.com/Droplr/droplr-js)
- [Droplr API Docs](https://droplr.github.io/docs/)

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


