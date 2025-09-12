# drplr

A command-line interface for uploading files to Droplr using their official SDK.

## Installation

1. Clone or download this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Make the script executable (if needed):
   ```bash
   chmod +x drplr.js
   ```
4. Optionally, link it globally:
   ```bash
   npm link
   ```

## Authentication Setup

Choose one of these authentication methods:

### Method 1: JWT Token (Easiest)
1. Log into [d.pr](https://d.pr) in your browser
2. Open Chrome DevTools > Application > Cookies > d.pr
3. Copy the JWT token value
4. Configure the CLI:
   ```bash
   ./drplr.js config token eyJhbGciOiJIUzI1NiIs...
   ```

### Method 2: Username/Password
```bash
./drplr.js config login your_username your_password
```

## Usage

### Upload a file
```bash
./drplr.js file.png
```

### Upload a private file
```bash
./drplr.js file.png --private
```

### Upload with password protection
```bash
./drplr.js file.png --private --password mypassword
```

### Show help
```bash
./drplr.js help
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


