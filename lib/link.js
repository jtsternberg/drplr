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

  try {
    // Validate URL format
    try {
      new URL(url);
    } catch (error) {
      throw new UploadError(`Invalid URL format: ${url}`);
    }

    // Create the link drop
    const dropData = {
      type: 'LINK',
      content: url
    };

    // Add title if provided
    if (options.title) {
      dropData.title = options.title;
    }

    const result = await client.drops.create(dropData);

    // Handle privacy and password settings
    return await handlePrivateDropCreation(client, result, options);

  } catch (error) {
    throw parseApiError(error, 'Link creation');
  }
}

module.exports = { createLink };