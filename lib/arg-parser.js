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
  let codeText = '';

  // Add note-specific options
  options.lang = null;
  options.isCode = false;

  // First pass: collect all flags and their values
  for (let i = 0; i < remainingArgs.length; i++) {
    const arg = remainingArgs[i];

    if (arg === '--file') {
      filePath = remainingArgs[++i];
    } else if (arg === '--code') {
      options.isCode = true;
      // Check if next arg is a value (not a flag)
      const nextArg = remainingArgs[i + 1];
      if (nextArg && !nextArg.startsWith('-')) {
        codeText = remainingArgs[++i];
      }
    } else if (arg === '--lang') {
      options.lang = remainingArgs[++i];
    } else if (!arg.startsWith('-') && !text) {
      text = arg;
    }
  }

  // Determine final text value based on what was provided
  if (codeText) {
    // --code with inline text takes precedence
    text = codeText;
  } else if (options.isCode && filePath) {
    // --code --file combination (order doesn't matter)
    // text will be read from file by createNoteFromFile
  } else if (filePath && !text) {
    // Just --file, no text needed (will be read from file)
  }

  return { text, filePath, options };
}

module.exports = {
  parseCommonArgs,
  parseUploadArgs,
  parseLinkArgs,
  parseNoteArgs
};