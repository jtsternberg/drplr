const { UploadError } = require('../errors');
const { createClient } = require('../client');
const { parseApiError } = require('../api-utils');
const { requireAuthentication } = require('../command-utils');
const logger = require('../logger');

/**
 * Lists all available boards
 * @param {Object} credentials - Authentication credentials
 * @returns {Promise<Array>} List of boards
 */
async function listBoards(credentials) {
  const client = createClient(credentials);

  try {
    const result = await client.boards.list();
    logger.debug('Boards list API response:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    logger.debug('Boards list API error:', JSON.stringify(error.response?.data || error.message, null, 2));
    throw parseApiError(error, 'Board listing');
  }
}

/**
 * Creates a new board
 * @param {string} title - Board title
 * @param {Object} credentials - Authentication credentials
 * @returns {Promise<Object>} Created board
 */
async function createBoard(title, credentials) {
  const client = createClient(credentials);

  try {
    const result = await client.boards.create({ title });
    logger.debug('Board create API response:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    logger.debug('Board create API error:', JSON.stringify(error.response?.data || error.message, null, 2));
    throw parseApiError(error, 'Board creation');
  }
}

/**
 * Gets board details and contents
 * @param {string} boardId - Board ID or name
 * @param {Object} credentials - Authentication credentials
 * @returns {Promise<Object>} Board details
 */
async function getBoard(boardId, credentials) {
  const client = createClient(credentials);

  try {
    // Try to find board by ID first, then by name
    let board;
    if (isValidBoardId(boardId)) {
      board = await client.boards.get(boardId);
    } else {
      // Find by name
      const boards = await client.boards.list();
      board = boards.find(b => b.title.toLowerCase() === boardId.toLowerCase());
      if (!board) {
        throw new UploadError(`Board not found: ${boardId}`);
      }
      board = await client.boards.get(board.id);
    }
    
    logger.debug('Board details API response:', JSON.stringify(board, null, 2));
    return board;
  } catch (error) {
    logger.debug('Board details API error:', JSON.stringify(error.response?.data || error.message, null, 2));
    throw parseApiError(error, 'Board details');
  }
}

/**
 * Updates board settings
 * @param {string} boardId - Board ID or name
 * @param {Object} updates - Update options
 * @param {Object} credentials - Authentication credentials
 * @returns {Promise<Object>} Updated board
 */
async function updateBoard(boardId, updates, credentials) {
  const client = createClient(credentials);

  try {
    // Find board first if boardId is a name
    let targetBoardId = boardId;
    if (!isValidBoardId(boardId)) {
      const boards = await client.boards.list();
      const board = boards.find(b => b.title.toLowerCase() === boardId.toLowerCase());
      if (!board) {
        throw new UploadError(`Board not found: ${boardId}`);
      }
      targetBoardId = board.id;
    }

    const result = await client.boards.update(targetBoardId, updates);
    logger.debug('Board update API response:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    logger.debug('Board update API error:', JSON.stringify(error.response?.data || error.message, null, 2));
    throw parseApiError(error, 'Board update');
  }
}

/**
 * Deletes a board
 * @param {string} boardId - Board ID or name
 * @param {Object} credentials - Authentication credentials
 * @returns {Promise<Object>} Deletion result
 */
async function deleteBoard(boardId, credentials) {
  const client = createClient(credentials);

  try {
    // Find board first if boardId is a name
    let targetBoardId = boardId;
    if (!isValidBoardId(boardId)) {
      const boards = await client.boards.list();
      const board = boards.find(b => b.title.toLowerCase() === boardId.toLowerCase());
      if (!board) {
        throw new UploadError(`Board not found: ${boardId}`);
      }
      targetBoardId = board.id;
    }

    const result = await client.boards.delete(targetBoardId);
    logger.debug('Board delete API response:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    logger.debug('Board delete API error:', JSON.stringify(error.response?.data || error.message, null, 2));
    throw parseApiError(error, 'Board deletion');
  }
}

/**
 * Subscribes to board notifications
 * @param {string} boardId - Board ID or name
 * @param {Object} credentials - Authentication credentials
 * @returns {Promise<Object>} Subscription result
 */
async function watchBoard(boardId, credentials) {
  const client = createClient(credentials);

  try {
    // Find board first if boardId is a name
    let targetBoardId = boardId;
    if (!isValidBoardId(boardId)) {
      const boards = await client.boards.list();
      const board = boards.find(b => b.title.toLowerCase() === boardId.toLowerCase());
      if (!board) {
        throw new UploadError(`Board not found: ${boardId}`);
      }
      targetBoardId = board.id;
    }

    const result = await client.boards.watch(targetBoardId);
    logger.debug('Board watch API response:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    logger.debug('Board watch API error:', JSON.stringify(error.response?.data || error.message, null, 2));
    throw parseApiError(error, 'Board subscription');
  }
}

/**
 * Finds a board by name or ID
 * @param {string} boardNameOrId - Board name or ID
 * @param {Object} credentials - Authentication credentials
 * @returns {Promise<Object>} Board object
 */
async function findBoard(boardNameOrId, credentials) {
  const client = createClient(credentials);
  
  try {
    // Try to get by ID first
    if (isValidBoardId(boardNameOrId)) {
      return await client.boards.get(boardNameOrId);
    }
    
    // Search by name
    const boards = await client.boards.list();
    const board = boards.find(b => b.title.toLowerCase() === boardNameOrId.toLowerCase());
    
    if (!board) {
      throw new UploadError(`Board not found: ${boardNameOrId}`);
    }
    
    return board;
  } catch (error) {
    logger.debug('Find board API error:', JSON.stringify(error.response?.data || error.message, null, 2));
    throw parseApiError(error, 'Board search');
  }
}

/**
 * Checks if a string looks like a valid board ID (typically UUID format)
 * @param {string} str - String to check
 * @returns {boolean} True if looks like a board ID
 */
function isValidBoardId(str) {
  // Basic UUID pattern check - Droplr board IDs are typically UUIDs
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidPattern.test(str);
}

/**
 * Handles board command parsing and execution
 * @param {string[]} args - Command arguments
 * @param {Object} globalOptions - Global options (porcelain, debug)
 * @returns {Function} Function to be executed by executeCommand
 */
function handleBoardCommand(args, globalOptions) {
  if (args.length === 0) {
    // No arguments - list boards
    return async () => {
      const credentials = requireAuthentication();
      
      logger.log('Fetching boards...');
      const boards = await listBoards(credentials);
      
      if (globalOptions.porcelain) {
        boards.forEach(board => {
          logger.output(`${board.id}\t${board.title}`);
        });
      } else {
        if (boards.length === 0) {
          logger.log('No boards found');
        } else {
          logger.log('Available boards:');
          boards.forEach(board => {
            logger.log(`  ${board.title} (ID: ${board.id})`);
          });
        }
      }
    };
  }

  const subCommand = args[0];
  
  if (subCommand === 'create') {
    const title = args[1];
    if (!title) {
      logger.error('Error: Please specify a board title');
      logger.error('Usage: drplr board create "Board Title"');
      process.exit(1);
    }
    
    return async () => {
      const credentials = requireAuthentication();
      
      logger.log(`Creating board "${title}"...`);
      const board = await createBoard(title, credentials);
      
      if (globalOptions.porcelain) {
        logger.output(`${board.id}\t${board.title}`);
      } else {
        logger.log('✓ Board created successfully!');
        logger.log(`Title: ${board.title}`);
        logger.log(`ID: ${board.id}`);
      }
    };
  }
  
  if (subCommand === 'update') {
    const boardId = args[1];
    const titleFlag = args.indexOf('--title');
    
    if (!boardId) {
      logger.error('Error: Please specify a board ID or name');
      logger.error('Usage: drplr board update <board_id> --title "New Title"');
      process.exit(1);
    }
    
    if (titleFlag === -1 || !args[titleFlag + 1]) {
      logger.error('Error: Please specify --title option');
      logger.error('Usage: drplr board update <board_id> --title "New Title"');
      process.exit(1);
    }
    
    const newTitle = args[titleFlag + 1];
    
    return async () => {
      const credentials = requireAuthentication();
      
      logger.log(`Updating board "${boardId}"...`);
      const board = await updateBoard(boardId, { title: newTitle }, credentials);
      
      if (globalOptions.porcelain) {
        logger.output(`${board.id}\t${board.title}`);
      } else {
        logger.log('✓ Board updated successfully!');
        logger.log(`Title: ${board.title}`);
        logger.log(`ID: ${board.id}`);
      }
    };
  }
  
  if (subCommand === 'delete') {
    const boardId = args[1];
    if (!boardId) {
      logger.error('Error: Please specify a board ID or name');
      logger.error('Usage: drplr board delete <board_id>');
      process.exit(1);
    }
    
    return async () => {
      const credentials = requireAuthentication();
      
      logger.log(`Deleting board "${boardId}"...`);
      await deleteBoard(boardId, credentials);
      
      if (!globalOptions.porcelain) {
        logger.log('✓ Board deleted successfully!');
      }
    };
  }
  
  if (subCommand === 'watch') {
    const boardId = args[1];
    if (!boardId) {
      logger.error('Error: Please specify a board ID or name');
      logger.error('Usage: drplr board watch <board_id>');
      process.exit(1);
    }
    
    return async () => {
      const credentials = requireAuthentication();
      
      logger.log(`Subscribing to board "${boardId}" notifications...`);
      await watchBoard(boardId, credentials);
      
      if (!globalOptions.porcelain) {
        logger.log('✓ Successfully subscribed to board notifications!');
      }
    };
  }
  
  // Default: show board contents
  const boardId = subCommand;
  return async () => {
    const credentials = requireAuthentication();
    
    logger.log(`Fetching board details for "${boardId}"...`);
    const board = await getBoard(boardId, credentials);
    
    if (globalOptions.porcelain) {
      logger.output(`${board.id}\t${board.title}\t${(board.drops || []).length}`);
    } else {
      logger.log(`Board: ${board.title}`);
      logger.log(`ID: ${board.id}`);
      
      const drops = board.drops || [];
      if (drops.length === 0) {
        logger.log('No drops in this board');
      } else {
        logger.log(`\nDrops (${drops.length}):`);
        drops.forEach(drop => {
          logger.log(`  ${drop.title || 'Untitled'} - ${drop.shortlink || drop.link || drop.url}`);
        });
      }
    }
  };
}

module.exports = {
  listBoards,
  createBoard,
  getBoard,
  updateBoard,
  deleteBoard,
  watchBoard,
  findBoard,
  handleBoardCommand
};