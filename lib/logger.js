// Use a singleton pattern to ensure all modules share the same state
const globalState = {
  options: {
    porcelain: false,
    debug: false
  }
};

/**
 * Initialize the logger with global options
 * @param {Object} options - Global options from CLI
 */
function initLogger(options) {
  globalState.options = { ...options };
}

/**
 * Log regular messages (suppressed in porcelain mode)
 * @param {...any} args - Arguments to log
 */
function log(...args) {
  if (!globalState.options.porcelain) {
    console.log(...args);
  }
}

/**
 * Log error messages (always shown, sent to stderr in porcelain mode)
 * @param {...any} args - Arguments to log
 */
function error(...args) {
  console.error(...args);
}

/**
 * Log debug messages (only shown in debug mode, sent to stderr)
 * @param {...any} args - Arguments to log
 */
function debug(...args) {
  if (globalState.options.debug) {
    console.error('Debug -', ...args);
  }
}

/**
 * Log output (URL/result - always shown in both modes)
 * In porcelain mode, outputs without trailing newline
 * @param {...any} args - Arguments to log
 */
function output(...args) {
  if (globalState.options.porcelain) {
    process.stdout.write(args.join(' '));
  } else {
    console.log(...args);
  }
}

/**
 * Log help/info messages (to stderr in porcelain mode, stdout otherwise)
 * @param {...any} args - Arguments to log
 */
function info(...args) {
  if (globalState.options.porcelain) {
    console.error(...args);
  } else {
    console.log(...args);
  }
}

module.exports = {
  initLogger,
  log,
  error,
  debug,
  output,
  info
};