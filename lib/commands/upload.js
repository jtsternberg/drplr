const fs = require('fs');
const path = require('path');
const { UploadError } = require('../errors');
const { createClient } = require('../client');
const { parseApiError, handlePrivateDropCreation } = require('../api-utils');
const { requireAuthentication } = require('../command-utils');
const { parseUploadArgs } = require('../arg-parser');
const logger = require('../logger');


async function uploadFile(filePath, credentials, options = {}) {
  if (!fs.existsSync(filePath)) {
    throw new UploadError(`✗ File not found: ${filePath}`);
  }

  const client = createClient(credentials);
  const fileName = path.basename(filePath);
  const fileStream = fs.createReadStream(filePath);

  const mimeType = getMimeType(fileName);

  const dropOptions = {
    type: 'FILE',
    variant: mimeType,
    title: options.title || fileName,
    content: fileStream
  };

  const makePrivate = options.privacy === 'PRIVATE';
  if (makePrivate) {
    dropOptions.privacy = 'PRIVATE';
  }

  if (options.password) {
    dropOptions.password = options.password;
  }

  try {
    const result = await client.drops.create(dropOptions);
    logger.debug('Initial upload API response:', JSON.stringify(result, null, 2));

    // Handle privacy and password settings
    return await handlePrivateDropCreation(client, result, options);

  } catch (error) {
    logger.debug('Initial upload API error:', JSON.stringify(error.response?.data || error.message, null, 2));
    throw parseApiError(error, 'Upload');
  }
}

function getMimeType(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.pdf': 'application/pdf',
    '.txt': 'text/plain',
    '.md': 'text/markdown',
    '.json': 'application/json',
    '.mp4': 'video/mp4',
    '.mov': 'video/quicktime',
    '.avi': 'video/avi',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav'
  };

  return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * Handles the upload command with argument parsing and execution
 * @param {string[]} args - Command arguments  
 * @param {Object} globalOptions - Global options (porcelain, debug)
 * @returns {Function} Function to be executed by executeCommand
 */
function handleUploadCommand(args, globalOptions) {
  const { filePath, options } = parseUploadArgs(args);

  if (!filePath) {
    logger.error('Error: Please specify a file to upload');
    logger.error('Use "drplr help" for usage information');
    process.exit(1);
  }

  // Return the function that executeCommand will call
  return async () => {
    
    const credentials = requireAuthentication();

    logger.log(`Uploading ${path.basename(filePath)}...`);

    const result = await uploadFile(filePath, credentials, options);

    if (globalOptions.porcelain) {
      logger.output(result.shortlink || result.link || result.url);
    } else {
      logger.log('✓ Upload successful!');

      if (options.title) {
        logger.log(`Title: ${options.title}`);
      }

      if (result.privacy === 'PRIVATE') {
        logger.log('Privacy: Private');
      } else if (options.privacy === 'PRIVATE') {
        logger.log('Privacy: Public (private upload not supported or failed)');
      }

      if (options.password) {
        logger.log('Password protected: Yes');
      }

      logger.log(`URL: ${result.shortlink || result.link || result.url}`);
    }
  };
}

module.exports = { 
  uploadFile,
  handleUploadCommand
};