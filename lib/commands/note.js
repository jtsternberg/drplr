const fs = require('fs');
const { UploadError } = require('../errors');
const { createClient } = require('../client');
const { parseApiError, handlePrivateDropCreation } = require('../api-utils');
const logger = require('../logger');

/**
 * Creates a note drop (text snippet)
 * @param {string} text - The text content for the note
 * @param {Object} credentials - Authentication credentials
 * @param {Object} options - Note options (privacy, password, title, lang)
 * @returns {Promise<Object>} The created drop result
 */
async function createNote(text, credentials, options = {}) {
  if (!text || text.trim().length === 0) {
    throw new UploadError('Note content cannot be empty');
  }

  const client = createClient(credentials);

  try {
    // Create the note drop
    const dropOptions = {
      type: 'NOTE',
      content: text.trim(),
      variant: getVariant(options)
    };

    // Add title if provided
    if (options.title) {
      dropOptions.title = options.title;
    }

    const result = await client.drops.create(dropOptions);
    logger.debug('Initial note creation API response:', JSON.stringify(result, null, 2));

    // Handle privacy, password, and title updates
    return await handlePrivateDropCreation(client, result, options);

  } catch (error) {
    logger.debug('Initial note creation API error:', JSON.stringify(error.response?.data || error.message, null, 2));
    throw parseApiError(error, 'Note creation');
  }
}

/**
 * Creates a note from file contents
 * @param {string} filePath - Path to the file to read
 * @param {Object} credentials - Authentication credentials
 * @param {Object} options - Note options (privacy, password, title, lang)
 * @returns {Promise<Object>} The created drop result
 */
async function createNoteFromFile(filePath, credentials, options = {}) {
  if (!fs.existsSync(filePath)) {
    throw new UploadError(`File not found: ${filePath}`);
  }

  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');

    // Use filename as default title if not provided
    if (!options.title) {
      const path = require('path');
      options.title = path.basename(filePath);
    }

    // Auto-detect language from file extension if not provided
    if (!options.lang) {
      options.lang = detectLanguageFromFile(filePath);
    }

    return await createNote(fileContent, credentials, options);
  } catch (error) {
    if (error instanceof UploadError) {
      throw error;
    }
    throw new UploadError(`Failed to read file: ${error.message}`);
  }
}

/**
 * Get the appropriate variant for note drop creation
 * @param {Object} options - Note options
 * @returns {string} Variant string for API
 */
function getVariant(options) {
  // If it's marked as code or has a language specified, use text/code
  if (options.isCode || options.lang) {
    return 'text/code';
  }

  // Default to plain text
  return 'text/plain';
}

/**
 * Detect programming language from file extension
 * @param {string} filePath - Path to the file
 * @returns {string|undefined} Language identifier or undefined
 */
function detectLanguageFromFile(filePath) {
  const path = require('path');
  const ext = path.extname(filePath).toLowerCase();

  const langMap = {
    '.js': 'javascript',
    '.ts': 'typescript',
    '.py': 'python',
    '.rb': 'ruby',
    '.php': 'php',
    '.java': 'java',
    '.c': 'c',
    '.cpp': 'cpp',
    '.cc': 'cpp',
    '.cxx': 'cpp',
    '.h': 'c',
    '.hpp': 'cpp',
    '.cs': 'csharp',
    '.go': 'go',
    '.rs': 'rust',
    '.swift': 'swift',
    '.kt': 'kotlin',
    '.scala': 'scala',
    '.sh': 'bash',
    '.bash': 'bash',
    '.zsh': 'zsh',
    '.fish': 'fish',
    '.ps1': 'powershell',
    '.sql': 'sql',
    '.html': 'html',
    '.htm': 'html',
    '.css': 'css',
    '.scss': 'scss',
    '.sass': 'sass',
    '.less': 'less',
    '.xml': 'xml',
    '.json': 'json',
    '.yaml': 'yaml',
    '.yml': 'yaml',
    '.toml': 'toml',
    '.ini': 'ini',
    '.conf': 'ini',
    '.md': 'markdown',
    '.markdown': 'markdown',
    '.tex': 'latex',
    '.r': 'r',
    '.R': 'r',
    '.m': 'matlab',
    '.pl': 'perl',
    '.lua': 'lua',
    '.vim': 'vim',
    '.dockerfile': 'dockerfile',
    '.makefile': 'makefile'
  };

  return langMap[ext];
}

module.exports = {
  createNote,
  createNoteFromFile
};