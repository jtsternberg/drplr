const { UploadError } = require('../errors');
const { createClient } = require('../client');
const { parseApiError, handlePrivateDropCreation } = require('../api-utils');
const { requireAuthentication } = require('../command-utils');
const { parseLinkArgs } = require('../arg-parser');
const logger = require('../logger');

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
    logger.debug('Initial link creation API response:', JSON.stringify(result, null, 2));

    if (result.title !== dropOptions.title) {
      logger.log('NOTE: Setting a title on a link drop is not supported yet.');
    }

    // Handle privacy and password settings
    return await handlePrivateDropCreation(client, result, options);

  } catch (error) {
    logger.debug('Initial link creation API error:', JSON.stringify(error.response?.data || error.message, null, 2));
    throw parseApiError(error, 'Link creation');
  }
}

/**
 * Handles the link command with argument parsing and execution
 * @param {string[]} args - Command arguments
 * @param {Object} globalOptions - Global options (porcelain, debug)
 * @returns {Function} Function to be executed by executeCommand
 */
function handleLinkCommand(args, globalOptions) {
  if (args.length === 0) {
    logger.error('Error: Please specify a URL to shorten');
    logger.error('Usage: drplr link <url> [options]');
    logger.error('Use "drplr help" for more information');
    process.exit(1);
  }

  const { url, options } = parseLinkArgs(args);

  if (!url) {
    logger.error('Error: Please specify a URL to shorten');
    logger.error('Use "drplr help" for usage information');
    process.exit(1);
  }

  // Return the function that executeCommand will call
  return async () => {
    
    const credentials = requireAuthentication();

    logger.log(`Creating short link for ${url}...`);

    const result = await createLink(url, credentials, options);

    if (globalOptions.porcelain) {
      logger.output(result.shortlink || result.link || result.url);
    } else {
      logger.log('✓ Link created successfully!');

      if (options.title) {
        logger.log(`Title: ${options.title}`);
      }

      if (result.privacy === 'PRIVATE') {
        logger.log('Privacy: Private');
      } else if (options.privacy === 'PRIVATE') {
        logger.log('Privacy: Public (private link not supported or failed)');
      }

      if (options.password) {
        logger.log('Password protected: Yes');
      }

      logger.log(`Short URL: ${result.shortlink || result.link || result.url}`);
      logger.log(`Original URL: ${url}`);
    }
  };
}

module.exports = { 
  createLink,
  handleLinkCommand
};