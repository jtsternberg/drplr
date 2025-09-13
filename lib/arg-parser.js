/**
 * Shared argument parsing utilities for all commands
 */

/**
 * Parse common arguments that are shared across commands
 * @param {string[]} args - Command arguments
 * @returns {Object} Parsed arguments with remaining args
 */
function parseCommonArgs(args) {
  const options = {
    privacy: 'PUBLIC',
    password: null,
    title: null
  };

  const remainingArgs = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--private' || arg === '-p') {
      options.privacy = 'PRIVATE';
    } else if (arg === '--password') {
      options.password = args[++i];
    } else if (arg === '--title') {
      options.title = args[++i];
    } else if (arg === '--help' || arg === '-h') {
      // Let each command handle help display
      options.showHelp = true;
      remainingArgs.push(arg);
    } else {
      remainingArgs.push(arg);
    }
  }

  return { options, remainingArgs };
}

/**
 * Parse file upload arguments
 * @param {string[]} args - Command arguments
 * @returns {Object} Parsed upload options and file path
 */
function parseUploadArgs(args) {
  const { options, remainingArgs } = parseCommonArgs(args);
  
  let filePath = null;
  
  for (const arg of remainingArgs) {
    if (!arg.startsWith('-') && !filePath) {
      filePath = arg;
      break;
    }
  }

  return { filePath, options };
}

/**
 * Parse link command arguments
 * @param {string[]} args - Command arguments
 * @returns {Object} Parsed link options and URL
 */
function parseLinkArgs(args) {
  const { options, remainingArgs } = parseCommonArgs(args);
  
  let url = '';
  
  for (const arg of remainingArgs) {
    if (!arg.startsWith('-') && !url) {
      url = arg;
      break;
    }
  }

  return { url, options };
}

/**
 * Parse note command arguments
 * @param {string[]} args - Command arguments
 * @returns {Object} Parsed note options, text, and file path
 */
function parseNoteArgs(args) {
  const { options, remainingArgs } = parseCommonArgs(args);
  
  let text = '';
  let filePath = '';
  
  // Add note-specific options
  options.lang = null;
  options.isCode = false;

  for (let i = 0; i < remainingArgs.length; i++) {
    const arg = remainingArgs[i];
    
    if (arg === '--file') {
      filePath = remainingArgs[++i];
    } else if (arg === '--code') {
      text = remainingArgs[++i];
      options.isCode = true;
    } else if (arg === '--lang') {
      options.lang = remainingArgs[++i];
    } else if (!arg.startsWith('-') && !text && !filePath) {
      text = arg;
    }
  }

  return { text, filePath, options };
}

module.exports = {
  parseCommonArgs,
  parseUploadArgs,
  parseLinkArgs,
  parseNoteArgs
};