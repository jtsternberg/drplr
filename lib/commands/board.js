const { UploadError } = require('../errors');
const { createClient } = require('../client');
const { parseApiError } = require('../api-utils');
const { requireAuthentication } = require('../command-utils');
const logger = require('../logger');

/**
 * Lists all available boards
 * @param {Object} credentials - Authentication credentials
 * @param {Object} options - List options
 * @returns {Promise<Array>} Array of boards
 */
async function listBoards(credentials, options = {}) {
  const client = createClient(credentials);

  try {
    const result = await client.boards.list();
    logger.debug('List boards API response:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    logger.debug('List boards API error:', JSON.stringify(error.response?.data || error.message, null, 2));
    throw parseApiError(error, 'List boards');
  }
}

/**
 * Creates a new board
 * @param {string} title - Board title
 * @param {Object} credentials - Authentication credentials
 * @param {Object} options - Creation options
 * @returns {Promise<Object>} Created board
 */
async function createBoard(title, credentials, options = {}) {
  if (!title || title.trim().length === 0) {
    throw new UploadError('Board title is required');
  }

  const client = createClient(credentials);

  const boardOptions = {
    title: title.trim()
  };

  try {
    const result = await client.boards.create(boardOptions);
    logger.debug('Create board API response:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    logger.debug('Create board API error:', JSON.stringify(error.response?.data || error.message, null, 2));
    throw parseApiError(error, 'Board creation');
  }
}

/**
 * Gets board information and contents
 * @param {string} boardId - Board ID
 * @param {Object} credentials - Authentication credentials
 * @param {Object} options - Get options
 * @returns {Promise<Object>} Board information
 */
async function getBoard(boardId, credentials, options = {}) {
  if (!boardId) {
    throw new UploadError('Board ID is required');
  }

  const client = createClient(credentials);

  try {
    const result = await client.boards.get(boardId);
    logger.debug('Get board API response:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    logger.debug('Get board API error:', JSON.stringify(error.response?.data || error.message, null, 2));
    throw parseApiError(error, 'Get board');
  }
}

/**
 * Updates a board
 * @param {string} boardId - Board ID
 * @param {Object} credentials - Authentication credentials  
 * @param {Object} options - Update options
 * @returns {Promise<Object>} Updated board
 */
async function updateBoard(boardId, credentials, options = {}) {
  if (!boardId) {
    throw new UploadError('Board ID is required');
  }

  if (!options.title || options.title.trim().length === 0) {
    throw new UploadError('New board title is required');
  }

  const client = createClient(credentials);

  const updateData = {
    title: options.title.trim()
  };

  try {
    const result = await client.boards.update(boardId, updateData);
    logger.debug('Update board API response:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    logger.debug('Update board API error:', JSON.stringify(error.response?.data || error.message, null, 2));
    throw parseApiError(error, 'Board update');
  }
}

/**
 * Deletes a board
 * @param {string} boardId - Board ID
 * @param {Object} credentials - Authentication credentials
 * @returns {Promise<Object>} Delete result
 */
async function deleteBoard(boardId, credentials) {
  if (!boardId) {
    throw new UploadError('Board ID is required');
  }

  const client = createClient(credentials);

  try {
    const result = await client.boards.delete(boardId);
    logger.debug('Delete board API response:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    logger.debug('Delete board API error:', JSON.stringify(error.response?.data || error.message, null, 2));
    throw parseApiError(error, 'Board deletion');
  }
}

/**
 * Subscribes to board notifications (watch)
 * @param {string} boardId - Board ID
 * @param {Object} credentials - Authentication credentials
 * @returns {Promise<Object>} Watch result
 */
async function watchBoard(boardId, credentials) {
  if (!boardId) {
    throw new UploadError('Board ID is required');
  }

  const client = createClient(credentials);

  try {
    const result = await client.boards.watch(boardId);
    logger.debug('Watch board API response:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    logger.debug('Watch board API error:', JSON.stringify(error.response?.data || error.message, null, 2));
    throw parseApiError(error, 'Board watch');
  }
}

/**
 * Parses board command arguments
 * @param {string[]} args - Command arguments
 * @returns {Object} Parsed arguments
 */
function parseBoardArgs(args) {
  if (args.length === 0) {
    return { command: 'list' };
  }

  const command = args[0];
  
  switch (command) {
    case 'create':
      if (args.length < 2) {
        throw new UploadError('Board title is required for create command');
      }
      return {
        command: 'create',
        title: args[1]
      };

    case 'update':
      if (args.length < 2) {
        throw new UploadError('Board ID is required for update command');
      }
      
      const updateOptions = {};
      for (let i = 2; i < args.length; i++) {
        if (args[i] === '--title' && i + 1 < args.length) {
          updateOptions.title = args[i + 1];
          i++; // Skip next arg
        }
      }
      
      return {
        command: 'update',
        boardId: args[1],
        options: updateOptions
      };

    case 'delete':
      if (args.length < 2) {
        throw new UploadError('Board ID is required for delete command');
      }
      return {
        command: 'delete',
        boardId: args[1]
      };

    case 'watch':
      if (args.length < 2) {
        throw new UploadError('Board ID is required for watch command');
      }
      return {
        command: 'watch',
        boardId: args[1]
      };

    default:
      // If it's not a recognized command, assume it's a board ID to show
      return {
        command: 'get',
        boardId: args[0]
      };
  }
}

/**
 * Handles the board command with argument parsing and execution
 * @param {string[]} args - Command arguments
 * @param {Object} globalOptions - Global options (porcelain, debug)
 * @returns {Function} Function to be executed by executeCommand
 */
function handleBoardCommand(args, globalOptions) {
  const parsedArgs = parseBoardArgs(args);

  // Return the function that executeCommand will call
  return async () => {
    const credentials = requireAuthentication();

    switch (parsedArgs.command) {
      case 'list':
        logger.log('Fetching boards...');
        const boards = await listBoards(credentials);
        
        if (globalOptions.porcelain) {
          boards.forEach(board => {
            logger.output(board.id);
          });
        } else {
          if (boards.length === 0) {
            logger.log('No boards found');
          } else {
            logger.log('✓ Available boards:');
            boards.forEach(board => {
              logger.log(`  ${board.id} - ${board.title || 'Untitled'}`);
            });
          }
        }
        break;

      case 'create':
        logger.log(`Creating board "${parsedArgs.title}"...`);
        const newBoard = await createBoard(parsedArgs.title, credentials);
        
        if (globalOptions.porcelain) {
          logger.output(newBoard.id);
        } else {
          logger.log('✓ Board created successfully!');
          logger.log(`Board ID: ${newBoard.id}`);
          logger.log(`Title: ${newBoard.title}`);
        }
        break;

      case 'get':
        logger.log(`Fetching board ${parsedArgs.boardId}...`);
        const board = await getBoard(parsedArgs.boardId, credentials);
        
        if (globalOptions.porcelain) {
          logger.output(JSON.stringify(board));
        } else {
          logger.log('✓ Board information:');
          logger.log(`ID: ${board.id}`);
          logger.log(`Title: ${board.title || 'Untitled'}`);
          if (board.drops && board.drops.length > 0) {
            logger.log(`Drops: ${board.drops.length} items`);
            board.drops.forEach((drop, index) => {
              logger.log(`  ${index + 1}. ${drop.title || drop.code} (${drop.type})`);
            });
          } else {
            logger.log('Drops: No items');
          }
        }
        break;

      case 'update':
        logger.log(`Updating board ${parsedArgs.boardId}...`);
        const updatedBoard = await updateBoard(parsedArgs.boardId, credentials, parsedArgs.options);
        
        if (globalOptions.porcelain) {
          logger.output(updatedBoard.id);
        } else {
          logger.log('✓ Board updated successfully!');
          logger.log(`Board ID: ${updatedBoard.id}`);
          logger.log(`New Title: ${updatedBoard.title}`);
        }
        break;

      case 'delete':
        logger.log(`Deleting board ${parsedArgs.boardId}...`);
        await deleteBoard(parsedArgs.boardId, credentials);
        
        if (globalOptions.porcelain) {
          logger.output('deleted');
        } else {
          logger.log('✓ Board deleted successfully!');
        }
        break;

      case 'watch':
        logger.log(`Setting up watch for board ${parsedArgs.boardId}...`);
        await watchBoard(parsedArgs.boardId, credentials);
        
        if (globalOptions.porcelain) {
          logger.output('watching');
        } else {
          logger.log('✓ Board watch subscription created successfully!');
          logger.log(`You will receive notifications for board ${parsedArgs.boardId}`);
        }
        break;

      default:
        throw new UploadError(`Unknown board command: ${parsedArgs.command}`);
    }
  };
}

/**
 * Handles the boards command (alias for board list)
 * @param {string[]} args - Command arguments
 * @param {Object} globalOptions - Global options (porcelain, debug)
 * @returns {Function} Function to be executed by executeCommand
 */
function handleBoardsCommand(args, globalOptions) {
  return handleBoardCommand(['list', ...args], globalOptions);
}

module.exports = {
  listBoards,
  createBoard,
  getBoard,
  updateBoard,
  deleteBoard,
  watchBoard,
  handleBoardCommand,
  handleBoardsCommand
};