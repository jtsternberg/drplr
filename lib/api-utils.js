const { UploadError } = require('./errors');

/**
 * Parses API errors into user-friendly messages
 * @param {Error} error - API error object
 * @param {string} operation - Operation name for context (e.g., "Upload", "Link creation")
 * @returns {UploadError} Formatted error
 */
function parseApiError(error, operation = 'Operation') {
  // Don't wrap our own UploadErrors
  if (error instanceof UploadError) {
    return error;
  }

  // Handle detailed validation errors
  if (error.response?.data?.errors) {
    const errors = error.response.data.errors;
    
    // Handle array format (like upload errors)
    if (Array.isArray(errors)) {
      const messages = errors.map(err => {
        const field = err.field;
        const messages = err.messages || ['Invalid value'];
        return messages.map(msg =>
          "\n    * " + `${field}: ${msg.replace(/^".*?"\s*/, '')}`
        );
      }).flat();
      return new UploadError(`${operation} failed:${messages.join('')}`);
    }
    
    // Handle object format (like link errors)
    if (typeof errors === 'object') {
      const errorMessages = Object.entries(errors)
        .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
        .join('\n');
      return new UploadError(`${operation} failed:\n${errorMessages}`);
    }
  }

  // Handle single message errors
  if (error.response?.data?.message) {
    return new UploadError(`${operation} failed: ${error.response.data.message}`);
  }

  // Handle HTTP status errors
  if (error.response?.status) {
    return new UploadError(`${operation} failed: ${error.response.status} ${error.response.statusText}`);
  }

  // Generic fallback
  return new UploadError(`${operation} failed: ${error.message}`);
}

/**
 * Updates a drop's privacy and password settings
 * @param {Droplr.Client} client - Authenticated client
 * @param {string} dropCode - Drop code to update
 * @param {Object} options - Update options
 * @param {string} options.privacy - 'PRIVATE' or 'PUBLIC'
 * @param {string} [options.password] - Password for protection
 * @returns {Promise<Object>} Updated drop result
 */
async function updateDropPrivacy(client, dropCode, options) {
  const updateData = {};
  
  if (options.privacy) {
    updateData.privacy = options.privacy;
  }
  
  if (options.password) {
    updateData.password = options.password;
  }

  try {
    const result = await client.drops.update(dropCode, updateData);
    return result;
  } catch (error) {
    throw parseApiError(error, 'Privacy update');
  }
}

/**
 * Safely deletes a drop, ignoring errors
 * @param {Droplr.Client} client - Authenticated client  
 * @param {string} dropCode - Drop code to delete
 */
async function safeDeleteDrop(client, dropCode) {
  try {
    await client.drops.delete(dropCode);
  } catch (deleteError) {
    // Log but don't throw - cleanup failures shouldn't stop the main operation
    console.warn('Warning: Failed to clean up drop after operation failure');
  }
}

/**
 * Handles private drop creation with cleanup on failure
 * @param {Droplr.Client} client - Authenticated client
 * @param {Object} result - Initial drop creation result
 * @param {Object} options - Privacy options
 * @returns {Promise<Object>} Updated result
 */
async function handlePrivateDropCreation(client, result, options) {
  if (options.privacy !== 'PRIVATE') {
    // Handle password-only updates for public drops
    if (options.password) {
      await updateDropPrivacy(client, result.code, { password: options.password });
    }
    return result;
  }

  try {
    await updateDropPrivacy(client, result.code, {
      privacy: 'PRIVATE',
      password: options.password
    });
    
    // Update the result to reflect the new privacy state
    result.privacy = 'PRIVATE';
    return result;
    
  } catch (privacyError) {
    // If privacy update fails, delete the drop to prevent unwanted public content
    await safeDeleteDrop(client, result.code);
    throw privacyError;
  }
}

module.exports = {
  parseApiError,
  updateDropPrivacy,
  safeDeleteDrop,
  handlePrivateDropCreation
};