const { UploadError } = require('./errors');
const { createClient } = require('./client');
const { parseApiError, handlePrivateDropCreation } = require('./api-utils');

/**
 * Creates a link drop (URL shortener)
 * @param {string} url - The URL to shorten
 * @param {Object} credentials - Authentication credentials
 * @param {Object} options - Link options (privacy, password, title)
 * @returns {Promise<Object>} The created drop result
 */
async function createLink(url, credentials, options = {}) {
  const client = createClient(credentials);

  // Validate URL format
  try {
    new URL(url);
  } catch (error) {
    throw new UploadError(`Invalid URL format: ${url}`);
  }

  try {
    // Create the link drop
    const dropOptions = {
      type: 'LINK',
      content: url
    };

    // Add title if provided
    // TODO: This doesn't seem to work right now.
    if (options.title) {
      dropOptions.title = options.title;
    }

    const result = await client.drops.create(dropOptions);

    if (result.title !== dropOptions.title) {
      console.log('NOTE: Setting a title on a link drop is not supported yet.');
    }

    // Handle privacy and password settings
    return await handlePrivateDropCreation(client, result, options);

  } catch (error) {
    throw parseApiError(error, 'Link creation');
  }
}

module.exports = { createLink };