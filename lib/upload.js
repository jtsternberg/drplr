const fs = require('fs');
const path = require('path');
const Droplr = require('droplr-api');

function hasValidationErrors(error) {
  return error.response?.data?.errors;
}

function parseApiError(error) {
  if (error.response?.data?.errors) {
    // Parse detailed validation errors
    const errors = error.response.data.errors;
    const messages = errors.map(err => {
      const field = err.field;
      const messages = err.messages || ['Invalid value'];
      return messages.map(msg =>
        "\n    * " + `${field}: ${msg.replace(/^".*?"\s*/, '')}`
      );
    }).flat();
    return messages.join('\n');
  }

  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  if (error.response?.statusText) {
    return error.response.statusText;
  }

  return error.message || 'Unknown error';
}

function createClient(credentials) {
  if (credentials.type === 'basic') {
    return new Droplr.Client({
      auth: new Droplr.BasicAuth(credentials.username, credentials.password)
    });
  } else if (credentials.type === 'jwt') {
    return new Droplr.Client({
      auth: new Droplr.JwtAuth(credentials.token)
    });
  }

  return new Droplr.Client();
}

async function uploadFile(filePath, credentials, options = {}) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const client = createClient(credentials);
  const fileName = path.basename(filePath);
  const fileStream = fs.createReadStream(filePath);

  const mimeType = getMimeType(fileName);

  const dropOptions = {
    type: 'FILE',
    variant: mimeType,
    title: fileName,
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

    // If privacy was requested but didn't work with create, try to update the drop with privacy settings
    if (result?.privacy !== 'PRIVATE' && makePrivate) {
      try {
        const updateData = {
          privacy: 'PRIVATE',
          password: options.password,
        };

        const updatedResult = await client.drops.update(result.code, updateData);
        return updatedResult;

      } catch (updateError) {
        // Validation errors are handled by parseApiError
        if (!hasValidationErrors(updateError)) {
          console.log('response data:', JSON.stringify(updateError?.response?.data || {}, null, 2));
        }
        const errorMessage = parseApiError(updateError);
        console.warn('Warning: Failed to set privacy after upload:', errorMessage);
        return result;
      }
    }

    return result;
  } catch (error) {
    console.log('response data:', JSON.stringify(error?.response?.data || {}, null, 2));

    const errorMessage = parseApiError(error);

    if (error.response) {
      throw new Error(`Upload failed (${error.response.status}): ${errorMessage}`);
    } else if (error.request) {
      throw new Error('Upload failed: No response from server');
    } else {
      throw new Error(`Upload failed: ${errorMessage}`);
    }
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

module.exports = {
  uploadFile
};