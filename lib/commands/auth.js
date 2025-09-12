const { setCredentials } = require('../config');

/**
 * Handles authentication commands (token and login)
 * @param {string[]} args - Command arguments
 */
async function handleAuthCommand(args) {
  if (args[0] === 'token') {
    if (args.length !== 2) {
      console.error('Usage: drplr auth token <jwt_token>');
      process.exit(1);
    }

    const token = args[1];

    if (setCredentials('jwt', token)) {
      console.log('✓ JWT token saved successfully');
    } else {
      console.error('✗ Failed to save JWT token');
      process.exit(1);
    }
    return;
  }

  if (args[0] === 'login') {
    if (args.length !== 3) {
      console.error('Usage: drplr auth login <username> <password>');
      process.exit(1);
    }

    const [, username, password] = args;

    if (setCredentials('basic', username, password)) {
      console.log('✓ Login credentials saved successfully');
    } else {
      console.error('✗ Failed to save login credentials');
      process.exit(1);
    }
    return;
  }

  console.error('Usage: drplr auth [token|login] ...');
  console.error('Run "drplr help" for more information');
  process.exit(1);
}

module.exports = { handleAuthCommand };