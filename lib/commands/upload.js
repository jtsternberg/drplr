const fs = require('fs');
const path = require('path');
const { UploadError } = require('../errors');
const { createClient } = require('../client');
const { parseApiError, handlePrivateDropCreation } = require('../api-utils');


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

    // Handle privacy and password settings
    return await handlePrivateDropCreation(client, result, options);

  } catch (error) {
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

module.exports = { uploadFile };