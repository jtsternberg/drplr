/**
 * Board command implementation
 */

const { createClient } = require('../client');
const { requireAuthentication } = require('../command-utils');
const { parseApiError } = require('../api-utils');
const logger = require('../logger');
const { UploadError } = require('../errors');

/**
 * Handle board command
 * @param {string[]} args - Command arguments
 * @param {Object} globalOptions - Global CLI options
 * @returns {Function} Command function
 */
function handleBoardCommand(args, globalOptions) {
  if (args.length === 0) {
    // Default to listing boards
    return handleBoardsList();
  }

  const command = args[0];

  switch (command) {
    case 'create':
      if (args.length < 2) {
        logger.error('Error: Please specify a board name');
        process.exit(1);
      }
      return handleBoardCreate(args[1]);

    case 'update':
      if (args.length < 2) {
        logger.error('Error: Please specify a board ID');
        process.exit(1);
      }
      return handleBoardUpdate(args[1], args.slice(2));

    case 'delete':
      if (args.length < 2) {
        logger.error('Error: Please specify a board ID');
        process.exit(1);
      }
      return handleBoardDelete(args[1]);

    case 'watch':
      if (args.length < 2) {
        logger.error('Error: Please specify a board ID');
        process.exit(1);
      }
      return handleBoardWatch(args[1]);

    default:
      // Assume it's a board ID to show contents
      return handleBoardShow(command);
  }
}

/**
 * List all boards
 * @returns {Function} Command function
 */
function handleBoardsList() {
  return async () => {
    const credentials = requireAuthentication();
    const client = createClient(credentials);

    try {
      const boards = await client.boards.list();
      
      if (boards.length === 0) {
        logger.log('No boards found.');
        return;
      }

      logger.log('Available boards:');
      boards.forEach(board => {
        logger.log(`  ${board.id}: ${board.title} (${board.drops_count} drops)`);
      });
    } catch (error) {
      const message = parseApiError(error);
      throw new UploadError(message);
    }
  };
}

/**
 * Show board contents
 * @param {string} boardId - Board ID
 * @returns {Function} Command function
 */
function handleBoardShow(boardId) {
  return async () => {
    const credentials = requireAuthentication();
    const client = createClient(credentials);

    try {
      const board = await client.boards.get(boardId);
      const drops = await client.boards.drops(boardId);

      logger.log(`Board: ${board.title}`);
      logger.log(`Created: ${new Date(board.created_at).toLocaleString()}`);
      logger.log(`Drops: ${board.drops_count}`);
      logger.log('');

      if (drops.length === 0) {
        logger.log('No drops in this board.');
        return;
      }

      logger.log('Contents:');
      drops.forEach(drop => {
        logger.log(`  ${drop.code}: ${drop.name || 'Untitled'} (${drop.type})`);
        logger.log(`    ${drop.shortlink}`);
      });
    } catch (error) {
      const message = parseApiError(error);
      throw new UploadError(message);
    }
  };
}

/**
 * Create a new board
 * @param {string} title - Board title
 * @returns {Function} Command function
 */
function handleBoardCreate(title) {
  return async () => {
    const credentials = requireAuthentication();
    const client = createClient(credentials);

    try {
      const board = await client.boards.create({ title });
      logger.log(`Board created: ${board.title}`);
      logger.log(`ID: ${board.id}`);
    } catch (error) {
      const message = parseApiError(error);
      throw new UploadError(message);
    }
  };
}

/**
 * Update a board
 * @param {string} boardId - Board ID
 * @param {string[]} args - Update arguments
 * @returns {Function} Command function
 */
function handleBoardUpdate(boardId, args) {
  return async () => {
    const credentials = requireAuthentication();
    const client = createClient(credentials);

    const updates = {};

    // Parse update arguments
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (arg === '--title') {
        updates.title = args[++i];
      }
    }

    if (Object.keys(updates).length === 0) {
      logger.error('Error: Please specify what to update (--title "New Title")');
      process.exit(1);
    }

    try {
      const board = await client.boards.update(boardId, updates);
      logger.log(`Board updated: ${board.title}`);
    } catch (error) {
      const message = parseApiError(error);
      throw new UploadError(message);
    }
  };
}

/**
 * Delete a board
 * @param {string} boardId - Board ID
 * @returns {Function} Command function
 */
function handleBoardDelete(boardId) {
  return async () => {
    const credentials = requireAuthentication();
    const client = createClient(credentials);

    try {
      await client.boards.delete(boardId);
      logger.log(`Board deleted: ${boardId}`);
    } catch (error) {
      const message = parseApiError(error);
      throw new UploadError(message);
    }
  };
}

/**
 * Watch/subscribe to board notifications
 * @param {string} boardId - Board ID
 * @returns {Function} Command function
 */
function handleBoardWatch(boardId) {
  return async () => {
    const credentials = requireAuthentication();
    const client = createClient(credentials);

    try {
      await client.boards.watch(boardId);
      logger.log(`Now watching board: ${boardId}`);
      logger.log('You will receive notifications for new drops in this board.');
    } catch (error) {
      const message = parseApiError(error);
      throw new UploadError(message);
    }
  };
}

module.exports = {
  handleBoardCommand,
  handleBoardsList,
  handleBoardShow,
  handleBoardCreate,
  handleBoardUpdate,
  handleBoardDelete,
  handleBoardWatch
};