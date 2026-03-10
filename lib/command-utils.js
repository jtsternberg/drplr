const { getCredentials } = require('./config');
const { UploadError } = require('./errors');
const logger = require('./logger');

/**
 * Checks authentication and returns credentials, exiting if not configured
 * @returns {Object} Valid credentials object
 */
function requireAuthentication() {
  const credentials = getCredentials();

  if (credentials.type === 'anonymous') {
    logger.error('Error: No authentication configured');
    logger.error('');
    logger.error('Choose one of these methods:');
    logger.error('1. Use 1Password CLI: drplr auth 1password <item>');
    logger.error('2. Extract JWT from browser: drplr auth token <jwt_token>');
    logger.error('3. Use username/password: drplr auth login <username> <password>');
    logger.error('');
    logger.error('See "drplr help" for detailed instructions');
    process.exit(1);
  }

  return credentials;
}

/**
 * Handles common error patterns for commands
 * @param {Error} error - The error to handle
 * @param {string} operation - Operation name for context
 */
function handleCommandError(error, operation = 'Operation') {
  const authRelated = error.message.includes('401') ||
    error.message.includes('Unauthorized') ||
    error.message.includes('No such user');

  if (error instanceof UploadError) {
    logger.error(error.message);
    if (authRelated) {
      logger.error('');
      logger.error('Try refreshing your authentication:');
      logger.error('- For 1Password: drplr auth 1password <item>');
      logger.error('- For JWT: Get a fresh token from your browser cookies at d.pr');
      logger.error('- For login: drplr auth login <username> <password>');
    }
    process.exit(1);
  }

  logger.error(`✗ ${operation} failed:`, error.message);
  if (authRelated) {
    logger.error('');
    logger.error('Try refreshing your authentication:');
    logger.error('- For JWT: Get a fresh token from your browser cookies at d.pr');
    logger.error('- For login: drplr auth login <username> <password>');
  }
  process.exit(1);
}

/**
 * Wrapper for executing commands with consistent error handling
 * @param {Function} commandFn - The command function to execute
 * @param {string} operation - Operation name for error context
 */
async function executeCommand(commandFn, operation = 'Operation') {
  try {
    await commandFn();
  } catch (error) {
    handleCommandError(error, operation);
  }
}

module.exports = {
  requireAuthentication,
  handleCommandError,
  executeCommand
};