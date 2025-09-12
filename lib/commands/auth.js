const { setCredentials } = require('../config');
const logger = require('../logger');

/**
 * Handles authentication commands (token and login)
 * @param {string[]} args - Command arguments
 */
async function handleAuthCommand(args) {
  if (args[0] === 'token') {
    if (args.length !== 2) {
      logger.error('Usage: drplr auth token <jwt_token>');
      process.exit(1);
    }

    const token = args[1];

    if (setCredentials('jwt', token)) {
      logger.log('✓ JWT token saved successfully');
    } else {
      logger.error('✗ Failed to save JWT token');
      process.exit(1);
    }
    return;
  }

  if (args[0] === 'login') {
    if (args.length !== 3) {
      logger.error('Usage: drplr auth login <username> <password>');
      process.exit(1);
    }

    const [, username, password] = args;

    if (setCredentials('basic', username, password)) {
      logger.log('✓ Login credentials saved successfully');
    } else {
      logger.error('✗ Failed to save login credentials');
      process.exit(1);
    }
    return;
  }

  logger.error('Usage: drplr auth [token|login] ...');
  logger.error('Run "drplr help" for more information');
  process.exit(1);
}

module.exports = { handleAuthCommand };