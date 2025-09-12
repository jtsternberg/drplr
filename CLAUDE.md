# Claude Development Session

This file documents the development session with Claude that built the `drplr` CLI tool.

## Project Creation

Started with the idea to create a CLI tool for uploading files to Droplr, similar to how tools like `curl` work for HTTP requests.

**Key Challenge:** The Droplr API documentation was outdated - the API keys page redirected to an old blog post with no way to get credentials.

**Solution:** Droplr support provided guidance on two authentication methods:
1. Extract JWT token from browser cookies at d.pr
2. Use the official [droplr-js SDK](https://github.com/Droplr/droplr-js) with username/password

## Architecture Decisions

### Authentication Strategy
- Initially built custom HMAC-SHA1 authentication (before SDK discovery)
- Switched to official Droplr SDK for better reliability
- Supports both JWT tokens and username/password
- JWT tokens are more secure but expire and require browser dev tools
- Username/password is easier for most users

### Configuration Management
- Moved from `~/.drplr/` to `~/.config/drplr/` (XDG Base Directory spec)
- Implemented AES-256-CBC encryption for stored credentials
- Machine-specific encryption keys for security
- Automatic migration from plain text (later removed as unnecessary)

### Error Handling Evolution
- Started with basic error messages
- Added detailed API validation error parsing
- Created custom UploadError class to prevent nested error wrapping
- Eliminated redundant "Upload failed: Upload failed:" messages

### Private Upload Implementation
The most complex feature - private uploads require a two-step process:
1. Create upload (always creates public initially)
2. Update privacy settings via separate API call
3. If privacy update fails, delete the original drop to prevent unwanted public files

## Key Features Implemented

### Core Functionality
- File uploads with automatic MIME type detection
- Public and private upload support
- Password protection for uploads
- Encrypted credential storage
- Clean error messages with field-specific validation details

### CLI Design
- Simple command structure: `drplr file.png`
- Intuitive options: `--private`, `--password`
- Comprehensive help system
- Both global install and npx support

### Development Quality
- Modular architecture (config, upload, errors separated)
- No unused code or files
- Comprehensive error handling
- Professional npm package setup

## npm Publishing Process

### Package Preparation
- Added repository URL and author info
- Created .npmignore to exclude test files
- Verified package contents with `npm pack --dry-run`
- Updated README for npm users vs GitHub clone instructions

### Publishing Steps
1. `npm adduser` / `npm login` (one-time setup)
2. `npm publish` (required 2FA code)
3. Automatic README sync from GitHub to npm

### Version Management Strategy
- `npm version patch` for bug fixes
- `npm version minor` for new features  
- `npm version major` for breaking changes
- `git push --follow-tags` to sync tags with GitHub

## Technical Insights

### Droplr API Quirks
- File uploads always create public drops initially
- Privacy must be set via separate update call
- Detailed validation errors available in API responses
- JWT tokens expire and need periodic refresh

### Node.js CLI Best Practices
- Shebang: `#!/usr/bin/env node`
- Executable permissions on main file
- Global vs local installation support
- Proper bin field in package.json

### Error UX Design
- Users shouldn't see internal implementation details
- Failed private uploads should clean up automatically
- Error messages should be actionable (e.g., "password: length must be at least 4 characters")

## Files Created

```
drplr/
├── drplr.js              # Main CLI entry point
├── lib/
│   ├── config.js         # XDG-compliant encrypted config
│   ├── upload.js         # File upload and privacy logic  
│   └── errors.js         # Custom error classes
├── package.json          # npm package configuration
├── README.md             # User documentation
├── .npmignore            # Exclude dev files from package
├── Notes.md              # Development workflow guide
└── CLAUDE.md             # This session documentation
```

## Commands for Future Development

```bash
# Development
npm link                  # Link globally for testing
./drplr.js help          # Test CLI functionality

# Releases  
npm version patch        # Bump version + create tag
git push --follow-tags   # Push to GitHub
npm publish             # Publish to npm (may need --otp=123456)

# Testing
npm pack --dry-run      # Verify package contents
npx drplr file.png      # Test without global install
```

## Final Result

Successfully created and published `drplr` - a professional CLI tool that:
- ✅ Is available globally via `npm install -g drplr`  
- ✅ Handles Droplr authentication seamlessly
- ✅ Supports private uploads with proper cleanup
- ✅ Provides excellent error messages
- ✅ Follows Node.js and npm best practices
- ✅ Has comprehensive documentation

Published at: https://npmjs.com/package/drplr  
Source code: https://github.com/jtsternberg/drplr
- Never `git add .` or `gid add -A`