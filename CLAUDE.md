# drplr

## Rules
- Never `git add .` or `git add -A` — always stage specific files by name

## Droplr API Gotchas
- File uploads ALWAYS create public drops initially — privacy must be set via a separate update API call
- If the privacy update fails after upload, delete the original drop to prevent unwanted public files
- Detailed validation errors are available in API responses (parse them for field-specific messages)

## 1Password Integration Gotcha
- When fetching credentials via `op item get`, there may be TWO password fields: a legacy one (`type: "STRING"`) and the current one (`purpose: "PASSWORD"`)
- Always use `--format json` and find the field with `purpose === 'PASSWORD'` — do NOT use `--fields password` which may return the wrong one

## Command Registry Pattern
- Each command in `lib/commands/*.js` exports a `meta` object (name, description, args, options)
- `lib/command-registry.js` auto-discovers these — never hardcode command metadata elsewhere
- `completions.js` uses lazy-loading (`getRegistry()`) to avoid circular dependency with the registry