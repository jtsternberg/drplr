/**
 * Command registry — auto-discovers commands from lib/commands/*.js
 * and assembles global options from their source locations.
 */

const fs = require('fs');
const path = require('path');

const commandsDir = path.join(__dirname, 'commands');

function discoverCommands() {
  const commands = [];

  for (const file of fs.readdirSync(commandsDir)) {
    if (!file.endsWith('.js')) continue;

    const mod = require(path.join(commandsDir, file));
    if (mod.meta) {
      commands.push(mod.meta);
    }
  }

  // Add built-in 'help' command (no file)
  commands.push({ name: 'help', description: 'Show help' });

  // Sort: _default first, then alphabetically
  commands.sort((a, b) => {
    if (a.name === '_default') return -1;
    if (b.name === '_default') return 1;
    return a.name.localeCompare(b.name);
  });

  return commands;
}

function discoverGlobalOptions() {
  // Common options from arg-parser (--private, --password, --title, --help)
  const { commonOptionsMeta } = require('./arg-parser');

  // Global-only flags from drplr.js (--porcelain, --debug)
  const { globalFlagsMeta } = require('../drplr');

  return [...commonOptionsMeta, ...globalFlagsMeta];
}

const commands = discoverCommands();
const globalOptions = discoverGlobalOptions();

module.exports = { commands, globalOptions };
