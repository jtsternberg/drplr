# Droplr CLI Roadmap

This roadmap outlines potential features and enhancements for the `drplr` CLI tool based on the full capabilities of the [Droplr JavaScript SDK](https://github.com/Droplr/droplr-js).

## Current CLI Features ✅

### Core Upload & Drop Features
- File uploads (public/private with password protection)
- Link drops (URL shortening with title support)
- Note drops (text notes, file-based notes, code snippets with syntax highlighting)
- Custom titles for all drop types
- Privacy controls (public/private) with password protection
- Language detection for code snippets (25+ supported languages)

### Authentication & Configuration
- JWT token authentication (extracted from browser)
- Username/password authentication
- Encrypted credential storage with machine-specific keys
- Auth command with config alias for backwards compatibility

### Command Interface & UX
- Comprehensive help system with examples
- Global command flags (--porcelain, --debug)
- Advanced argument parsing with flag validation
- Detailed error handling with field-specific validation messages
- Modular command architecture (upload, link, note, auth)

### Developer Experience
- Comprehensive test suite with Jest (49 passing tests)
- Argument parser tests, command tests, and integration tests
- Multiple test script variants (unit, integration, coverage)
- Complete documentation (TESTING.md, README.md, ROADMAP.md)
- DRY code architecture with centralized utilities

## Planned Features

### Drop Management 📁

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

### Boards Management 📋

#### Board Operations
- `drplr boards` - List available boards
- `drplr board create "Project Assets"` - Create new board
- `drplr board <board_id>` - Show board contents
- `drplr upload image.png --board "Project Assets"` - Upload to specific board
- `drplr board update <board_id> --title "New Name"` - Update board
- `drplr board delete <board_id>` - Delete board
- `drplr board watch <board_id>` - Subscribe to board notifications

### Enhanced Upload Features 🚀

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

### Configuration and Profiles ⚙️

#### Multiple Profiles
- `drplr profile create work` - Create named profiles
- `drplr profile use work` - Switch between profiles
- `drplr --profile work upload file.png` - Use specific profile for command

#### Advanced Configuration
- `drplr config show` - Display current configuration
- `drplr config set default-privacy private` - Set defaults
- `drplr config set upload-directory ~/uploads` - Default upload paths

### Output and Integration 🔗

#### Output Formats
- `drplr list --json` - JSON output for scripting
- `drplr list --csv` - CSV export
- `drplr upload image.png --copy` - Auto-copy URL to clipboard
- `drplr upload --qr` - Generate QR code for URL

#### Shell Integration
- Bash/Zsh completion for commands and options
- Shell aliases and shortcuts
- Integration with file managers (drag & drop handlers)

### Monitoring and Maintenance 📊

#### Health and Diagnostics
- `drplr doctor` - Check configuration and connectivity
- `drplr quota` - Show storage usage and limits
- `drplr cleanup` - Remove orphaned/expired drops

## Technical Considerations

### Architecture ✅ 
- ✅ Modular structure with separate modules for each feature area (commands/, lib/)
- ✅ Extended authentication system works across all new features  
- ✅ Consistent error handling and user experience patterns
- ✅ DRY principles implemented with centralized argument parsing and utilities

### Dependencies ✅
- ✅ Leveraging existing `droplr-api` SDK for all operations
- ✅ Minimal additional dependencies (only Jest for testing)
- ✅ Node.js 14+ compatibility maintained

### User Experience ✅
- ✅ Consistent command structure and naming conventions
- ✅ Helpful error messages with field-specific validation details
- ✅ Progressive disclosure (basic → advanced features)
- ✅ Full backward compatibility with existing commands

## Community and Contribution

### Open Source Considerations ✅
- ✅ Well-documented API for contributors (TESTING.md, inline docs)
- Clear contribution guidelines (established patterns)
- ✅ Comprehensive test suite (49 passing tests with Jest)
- ✅ Semantic versioning for releases

This roadmap represents the full potential of the Droplr CLI tool. Features will be implemented based on user demand, community feedback, and development resources.