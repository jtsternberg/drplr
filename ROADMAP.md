# Droplr CLI Roadmap

This roadmap outlines potential features and enhancements for the `drplr` CLI tool based on the full capabilities of the [Droplr JavaScript SDK](https://github.com/Droplr/droplr-js).

## Current CLI Features ✅

- File uploads (public/private)
- Password protection
- JWT token authentication
- Username/password authentication
- Encrypted credential storage
- Basic error handling with validation details

## Planned Features

### 1. Non-File Drop Types 📝

#### Link Drops (URL Shortening)
- `drplr link <url>` - Create shortened links
- `drplr link <url> --title "Custom Title"` - Link with custom title
- `drplr link <url> --private --password secret` - Private/protected links

#### Note Drops (Text Snippets)
- `drplr note "Quick text note"` - Create text-based drops
- `drplr note --file notes.txt` - Create note from file content
- `drplr note --private "Secret note"` - Private text notes
- `drplr note --code "console.log('hello')" --lang javascript` - Code snippets with syntax highlighting

### 2. Drop Management 📁

#### List and Browse Drops
- `drplr list` - List recent drops with pagination
- `drplr list --private` - Show only private drops
- `drplr list --type image` - Filter by drop type (file/link/note)
- `drplr list --limit 50` - Control number of results
- `drplr search <query>` - Search drops by title/content

#### Drop Information and Updates
- `drplr info <drop_code>` - Get detailed drop information
- `drplr update <drop_code> --title "New Title"` - Update drop metadata
- `drplr update <drop_code> --private` - Change privacy settings
- `droplr delete <drop_code>` - Delete specific drops
- `drplr delete --older-than 30d` - Bulk delete old drops

#### Drop Statistics and Analytics
- `drplr stats <drop_code>` - View drop statistics (views, downloads)
- `drplr stats --summary` - Overview of all drops
- `drplr referrers <drop_code>` - Show where traffic comes from
- `drplr hits <drop_code>` - Detailed access logs

### 3. Boards Management 📋

#### Board Operations
- `drplr boards` - List available boards
- `drplr board create "Project Assets"` - Create new board
- `drplr board <board_id>` - Show board contents
- `drplr upload image.png --board "Project Assets"` - Upload to specific board
- `drplr board update <board_id> --title "New Name"` - Update board
- `drplr board delete <board_id>` - Delete board
- `drplr board watch <board_id>` - Subscribe to board notifications

### 4. Team Management 👥

#### Team Operations
- `drplr teams` - List available teams
- `drplr team <team_id>` - Show team details
- `drplr team create "New Team"` - Create team (admin)
- `drplr team update <team_id> --name "Updated Name"` - Update team
- `drplr team delete <team_id>` - Delete team

### 5. User Management 👤

#### Account Information
- `drplr whoami` - Show current user info
- `drplr user <user_id>` - Get user details (if accessible)
- `drplr users` - List users (team/admin feature)
- `drplr tags` - Show user's tags

### 6. Enhanced Upload Features 🚀

#### Advanced Upload Options
- `drplr upload *.png` - Batch upload with glob patterns
- `drplr upload folder/` - Upload entire directories
- `drplr upload --tag "project,assets"` - Tag uploads
- `drplr upload --expire 7d` - Set expiration dates
- `drplr upload --notify` - Send notification on upload

#### Upload Progress and Resumption
- Progress bars for large file uploads
- Resume interrupted uploads
- Parallel uploads for multiple files

### 7. Configuration and Profiles ⚙️

#### Multiple Profiles
- `drplr profile create work` - Create named profiles
- `drplr profile use work` - Switch between profiles
- `drplr --profile work upload file.png` - Use specific profile for command

#### Advanced Configuration
- `drplr config show` - Display current configuration
- `drplr config set default-privacy private` - Set defaults
- `drplr config set upload-directory ~/uploads` - Default upload paths

### 8. Output and Integration 🔗

#### Output Formats
- `drplr list --json` - JSON output for scripting
- `drplr list --csv` - CSV export
- `drplr upload image.png --copy` - Auto-copy URL to clipboard
- `drplr upload --qr` - Generate QR code for URL

#### Shell Integration
- Bash/Zsh completion for commands and options
- Shell aliases and shortcuts
- Integration with file managers (drag & drop handlers)

### 9. Monitoring and Maintenance 📊

#### Health and Diagnostics
- `drplr doctor` - Check configuration and connectivity
- `drplr quota` - Show storage usage and limits
- `drplr cleanup` - Remove orphaned/expired drops

#### Logging and Debugging
- `drplr --verbose` - Detailed operation logging
- `drplr --debug` - Debug mode with full API responses
- Local operation history/audit log

### 10. Security and Privacy 🔒

#### Enhanced Security
- Two-factor authentication support
- API key rotation helpers
- Secure credential sharing between devices

#### Privacy Controls
- Bulk privacy updates: `drplr privacy --all --private`
- Automatic expiration for sensitive uploads
- Audit trail for access and modifications

## Implementation Priority

### Phase 1 (Core Enhancements)
1. Drop listing and management (`list`, `info`, `delete`)
2. Link and note creation
3. Basic board support
4. Enhanced upload options (tagging, batch uploads)

### Phase 2 (Team Features)
1. Board management
2. Team operations
3. User management features
4. Statistics and analytics

### Phase 3 (Advanced Features)
1. Multiple profiles and advanced config
2. Shell integration and completion
3. Output formats and integrations
4. Monitoring and maintenance tools

### Phase 4 (Polish)
1. Enhanced security features
2. Performance optimizations
3. Comprehensive testing
4. Documentation and tutorials

## Technical Considerations

### Architecture
- Maintain modular structure with separate modules for each feature area
- Extend existing authentication system for all new features
- Consistent error handling and user experience patterns

### Dependencies
- Leverage existing `droplr-api` SDK for all operations
- Minimize additional dependencies
- Maintain Node.js compatibility

### User Experience
- Consistent command structure and naming conventions
- Helpful error messages and suggestions
- Progressive disclosure (basic → advanced features)
- Backward compatibility with existing commands

## Community and Contribution

### Open Source Considerations
- Well-documented API for contributors
- Clear contribution guidelines
- Comprehensive test suite
- Semantic versioning for releases

This roadmap represents the full potential of the Droplr CLI tool. Features will be implemented based on user demand, community feedback, and development resources.