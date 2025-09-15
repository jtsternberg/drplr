const {
  handleBoardCommand,
  handleBoardsList,
  handleBoardShow,
  handleBoardCreate,
  handleBoardUpdate,
  handleBoardDelete,
  handleBoardWatch
} = require('../../../lib/commands/board');

// Mock all the dependencies
jest.mock('../../../lib/client', () => ({
  createClient: jest.fn()
}));

jest.mock('../../../lib/command-utils', () => ({
  requireAuthentication: jest.fn()
}));

jest.mock('../../../lib/logger', () => ({
  log: jest.fn(),
  error: jest.fn(),
  output: jest.fn(),
  debug: jest.fn()
}));

jest.mock('../../../lib/api-utils', () => ({
  parseApiError: jest.fn()
}));

const { createClient } = require('../../../lib/client');
const { requireAuthentication } = require('../../../lib/command-utils');
const { parseApiError } = require('../../../lib/api-utils');
const logger = require('../../../lib/logger');

const mockClient = {
  boards: {
    list: jest.fn(),
    get: jest.fn(),
    drops: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    watch: jest.fn()
  }
};

describe('board command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    createClient.mockReturnValue(mockClient);
    requireAuthentication.mockReturnValue({ type: 'jwt', token: 'test-token' });
    parseApiError.mockImplementation(error => error.message || 'API Error');
  });

  describe('handleBoardCommand', () => {
    test('should return boards list function for no arguments', () => {
      const args = [];
      const globalOptions = { porcelain: false, debug: false };
      
      const command = handleBoardCommand(args, globalOptions);
      
      expect(typeof command).toBe('function');
      expect(command.constructor.name).toBe('AsyncFunction');
    });

    test('should handle create command', () => {
      const args = ['create', 'New Board'];
      const globalOptions = { porcelain: false };
      
      const command = handleBoardCommand(args, globalOptions);
      
      expect(typeof command).toBe('function');
    });

    test('should exit with error for create command without name', () => {
      const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit');
      });
      
      const args = ['create'];
      const globalOptions = { porcelain: false };
      
      expect(() => handleBoardCommand(args, globalOptions)).toThrow('process.exit');
      expect(logger.error).toHaveBeenCalledWith('Error: Please specify a board name');
      expect(mockExit).toHaveBeenCalledWith(1);
      
      mockExit.mockRestore();
    });

    test('should handle update command', () => {
      const args = ['update', '12345', '--title', 'New Title'];
      const globalOptions = { porcelain: false };
      
      const command = handleBoardCommand(args, globalOptions);
      
      expect(typeof command).toBe('function');
    });

    test('should exit with error for update command without board ID', () => {
      const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit');
      });
      
      const args = ['update'];
      const globalOptions = { porcelain: false };
      
      expect(() => handleBoardCommand(args, globalOptions)).toThrow('process.exit');
      expect(logger.error).toHaveBeenCalledWith('Error: Please specify a board ID');
      expect(mockExit).toHaveBeenCalledWith(1);
      
      mockExit.mockRestore();
    });

    test('should handle delete command', () => {
      const args = ['delete', '12345'];
      const globalOptions = { porcelain: false };
      
      const command = handleBoardCommand(args, globalOptions);
      
      expect(typeof command).toBe('function');
    });

    test('should handle watch command', () => {
      const args = ['watch', '12345'];
      const globalOptions = { porcelain: false };
      
      const command = handleBoardCommand(args, globalOptions);
      
      expect(typeof command).toBe('function');
    });

    test('should handle board ID as show command', () => {
      const args = ['12345'];
      const globalOptions = { porcelain: false };
      
      const command = handleBoardCommand(args, globalOptions);
      
      expect(typeof command).toBe('function');
    });
  });

  describe('handleBoardsList', () => {
    test('should list boards successfully', async () => {
      const mockBoards = [
        { id: '123', title: 'Project Assets', drops_count: 5 },
        { id: '456', title: 'Website Images', drops_count: 12 }
      ];
      
      mockClient.boards.list.mockResolvedValue(mockBoards);
      
      const command = handleBoardsList();
      await command();
      
      expect(createClient).toHaveBeenCalledWith({ type: 'jwt', token: 'test-token' });
      expect(mockClient.boards.list).toHaveBeenCalled();
      expect(logger.log).toHaveBeenCalledWith('Available boards:');
      expect(logger.log).toHaveBeenCalledWith('  123: Project Assets (5 drops)');
      expect(logger.log).toHaveBeenCalledWith('  456: Website Images (12 drops)');
    });

    test('should handle no boards found', async () => {
      mockClient.boards.list.mockResolvedValue([]);
      
      const command = handleBoardsList();
      await command();
      
      expect(logger.log).toHaveBeenCalledWith('No boards found.');
    });

    test('should handle API error', async () => {
      const error = new Error('API Error');
      mockClient.boards.list.mockRejectedValue(error);
      
      const command = handleBoardsList();
      
      await expect(command()).rejects.toThrow('API Error');
      expect(parseApiError).toHaveBeenCalledWith(error);
    });
  });

  describe('handleBoardShow', () => {
    test('should show board contents successfully', async () => {
      const mockBoard = {
        id: '123',
        title: 'Project Assets',
        created_at: '2023-01-01T00:00:00Z',
        drops_count: 2
      };
      
      const mockDrops = [
        { code: 'abc123', name: 'Image 1', type: 'FILE', shortlink: 'https://d.pr/i/abc123' },
        { code: 'def456', name: null, type: 'LINK', shortlink: 'https://d.pr/l/def456' }
      ];
      
      mockClient.boards.get.mockResolvedValue(mockBoard);
      mockClient.boards.drops.mockResolvedValue(mockDrops);
      
      const command = handleBoardShow('123');
      await command();
      
      expect(createClient).toHaveBeenCalledWith({ type: 'jwt', token: 'test-token' });
      expect(mockClient.boards.get).toHaveBeenCalledWith('123');
      expect(mockClient.boards.drops).toHaveBeenCalledWith('123');
      expect(logger.log).toHaveBeenCalledWith('Board: Project Assets');
      expect(logger.log).toHaveBeenCalledWith('Drops: 2');
      expect(logger.log).toHaveBeenCalledWith('Contents:');
      expect(logger.log).toHaveBeenCalledWith('  abc123: Image 1 (FILE)');
      expect(logger.log).toHaveBeenCalledWith('    https://d.pr/i/abc123');
      expect(logger.log).toHaveBeenCalledWith('  def456: Untitled (LINK)');
      expect(logger.log).toHaveBeenCalledWith('    https://d.pr/l/def456');
    });

    test('should handle board with no drops', async () => {
      const mockBoard = {
        id: '123',
        title: 'Empty Board',
        created_at: '2023-01-01T00:00:00Z',
        drops_count: 0
      };
      
      mockClient.boards.get.mockResolvedValue(mockBoard);
      mockClient.boards.drops.mockResolvedValue([]);
      
      const command = handleBoardShow('123');
      await command();
      
      expect(logger.log).toHaveBeenCalledWith('No drops in this board.');
    });

    test('should handle API error', async () => {
      const error = new Error('Board not found');
      mockClient.boards.get.mockRejectedValue(error);
      
      const command = handleBoardShow('999');
      
      await expect(command()).rejects.toThrow('Board not found');
      expect(parseApiError).toHaveBeenCalledWith(error);
    });
  });

  describe('handleBoardCreate', () => {
    test('should create board successfully', async () => {
      const mockBoard = {
        id: '789',
        title: 'New Board'
      };
      
      mockClient.boards.create.mockResolvedValue(mockBoard);
      
      const command = handleBoardCreate('New Board');
      await command();
      
      expect(createClient).toHaveBeenCalledWith({ type: 'jwt', token: 'test-token' });
      expect(mockClient.boards.create).toHaveBeenCalledWith({ title: 'New Board' });
      expect(logger.log).toHaveBeenCalledWith('Board created: New Board');
      expect(logger.log).toHaveBeenCalledWith('ID: 789');
    });

    test('should handle API error', async () => {
      const error = new Error('Create failed');
      mockClient.boards.create.mockRejectedValue(error);
      
      const command = handleBoardCreate('Failed Board');
      
      await expect(command()).rejects.toThrow('Create failed');
      expect(parseApiError).toHaveBeenCalledWith(error);
    });
  });

  describe('handleBoardUpdate', () => {
    test('should update board successfully', async () => {
      const mockBoard = {
        id: '123',
        title: 'Updated Board'
      };
      
      mockClient.boards.update.mockResolvedValue(mockBoard);
      
      const command = handleBoardUpdate('123', ['--title', 'Updated Board']);
      await command();
      
      expect(createClient).toHaveBeenCalledWith({ type: 'jwt', token: 'test-token' });
      expect(mockClient.boards.update).toHaveBeenCalledWith('123', { title: 'Updated Board' });
      expect(logger.log).toHaveBeenCalledWith('Board updated: Updated Board');
    });

    test('should exit with error for no update parameters', () => {
      const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit');
      });
      
      const command = handleBoardUpdate('123', []);
      
      expect(() => command()).toThrow('process.exit');
      expect(logger.error).toHaveBeenCalledWith('Error: Please specify what to update (--title "New Title")');
      expect(mockExit).toHaveBeenCalledWith(1);
      
      mockExit.mockRestore();
    });

    test('should handle API error', async () => {
      const error = new Error('Update failed');
      mockClient.boards.update.mockRejectedValue(error);
      
      const command = handleBoardUpdate('123', ['--title', 'New Title']);
      
      await expect(command()).rejects.toThrow('Update failed');
      expect(parseApiError).toHaveBeenCalledWith(error);
    });
  });

  describe('handleBoardDelete', () => {
    test('should delete board successfully', async () => {
      mockClient.boards.delete.mockResolvedValue();
      
      const command = handleBoardDelete('123');
      await command();
      
      expect(createClient).toHaveBeenCalledWith({ type: 'jwt', token: 'test-token' });
      expect(mockClient.boards.delete).toHaveBeenCalledWith('123');
      expect(logger.log).toHaveBeenCalledWith('Board deleted: 123');
    });

    test('should handle API error', async () => {
      const error = new Error('Delete failed');
      mockClient.boards.delete.mockRejectedValue(error);
      
      const command = handleBoardDelete('123');
      
      await expect(command()).rejects.toThrow('Delete failed');
      expect(parseApiError).toHaveBeenCalledWith(error);
    });
  });

  describe('handleBoardWatch', () => {
    test('should watch board successfully', async () => {
      mockClient.boards.watch.mockResolvedValue();
      
      const command = handleBoardWatch('123');
      await command();
      
      expect(createClient).toHaveBeenCalledWith({ type: 'jwt', token: 'test-token' });
      expect(mockClient.boards.watch).toHaveBeenCalledWith('123');
      expect(logger.log).toHaveBeenCalledWith('Now watching board: 123');
      expect(logger.log).toHaveBeenCalledWith('You will receive notifications for new drops in this board.');
    });

    test('should handle API error', async () => {
      const error = new Error('Watch failed');
      mockClient.boards.watch.mockRejectedValue(error);
      
      const command = handleBoardWatch('123');
      
      await expect(command()).rejects.toThrow('Watch failed');
      expect(parseApiError).toHaveBeenCalledWith(error);
    });
  });
});