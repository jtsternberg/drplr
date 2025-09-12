const Droplr = require('droplr-api');
const { UploadError } = require('./errors');

/**
 * Creates a Droplr client with appropriate authentication
 * @param {Object} credentials - Authentication credentials
 * @returns {Droplr.Client} Authenticated client instance
 */
function createClient(credentials) {
  if (credentials.type === 'basic') {
    return new Droplr.Client({
      auth: new Droplr.BasicAuth(credentials.username, credentials.password)
    });
  } else if (credentials.type === 'jwt') {
    return new Droplr.Client({
      auth: new Droplr.JwtAuth(credentials.token)
    });
  } else if (credentials.type === 'anonymous') {
    throw new UploadError('No authentication configured. Use "drplr config" to set up credentials.');
  }

  throw new UploadError('Invalid authentication credentials');
}

module.exports = { createClient };