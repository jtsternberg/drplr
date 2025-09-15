const { handleNoteCommand, createNote, createNoteFromFile } = require('../../../lib/commands/note');

// Mock all the dependencies
jest.mock('../../../lib/client');
jest.mock('../../../lib/command-utils');
jest.mock('../../../lib/logger');
jest.mock('../../../lib/api-utils');
jest.mock('fs');

const mockClient = {
  drops: {
    create: jest.fn()
  }
};

const mockCreateClient = jest.fn(() => mockClient);
const mockRequireAuthentication = jest.fn(() => ({ type: 'jwt', token: 'test-token' }));
const mockHandlePrivateDropCreation = jest.fn();
const mockLogger = {
  log: jest.fn(),
  error: jest.fn(),
  output: jest.fn()
};

// Set up mocks
require('../../../lib/client').createClient = mockCreateClient;
require('../../../lib/command-utils').requireAuthentication = mockRequireAuthentication;
require('../../../lib/api-utils').handlePrivateDropCreation = mockHandlePrivateDropCreation;
require('../../../lib/logger').log = mockLogger.log;
require('../../../lib/logger').error = mockLogger.error;
require('../../../lib/logger').output = mockLogger.output;

const fs = require('fs');

describe('note command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('handleNoteCommand', () => {
    test('should return async function for valid text', () => {
      const args = ['Hello world'];
      const globalOptions = { porcelain: false, debug: false };
      
      const command = handleNoteCommand(args, globalOptions);
      
      expect(typeof command).toBe('function');
      expect(command.constructor.name).toBe('AsyncFunction');
    });

    test('should exit with error for no arguments', () => {
      const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit');
      });
      
      const args = [];
      const globalOptions = { porcelain: false };
      
      expect(() => handleNoteCommand(args, globalOptions)).toThrow('process.exit');
      expect(mockLogger.error).toHaveBeenCalledWith('Error: Please specify text content or use --file option');
      expect(mockExit).toHaveBeenCalledWith(1);
      
      mockExit.mockRestore();
    });

    test('should parse text note arguments correctly', async () => {
      const args = ['Hello world', '--private', '--password', 'secret', '--title', 'My Note'];
      const globalOptions = { porcelain: false };
      
      // Mock the dependencies
      mockClient.drops.create.mockResolvedValue({ shortlink: 'http://test.com', title: 'My Note' });
      mockHandlePrivateDropCreation.mockResolvedValue({ shortlink: 'http://test.com', title: 'My Note' });
      
      const command = handleNoteCommand(args, globalOptions);
      
      // Execute the command
      await command();
      
      expect(mockClient.drops.create).toHaveBeenCalledWith({
        type: 'NOTE',
        content: 'Hello world',
        variant: 'text/plain'
      });
      expect(mockHandlePrivateDropCreation).toHaveBeenCalledWith(
        mockClient,
        { shortlink: 'http://test.com', title: 'My Note' },
        {
          privacy: 'PRIVATE',
          password: 'secret',
          title: 'My Note',
          lang: null,
          isCode: false
        }
      );
    });

    test('should parse file note arguments correctly', () => {
      const args = ['--file', 'notes.txt', '--private', '--title', 'File Note'];
      const globalOptions = { porcelain: false };
      
      // Mock createNoteFromFile to capture the arguments
      let capturedFilePath, capturedOptions;
      const originalCreateNoteFromFile = require('../../../lib/commands/note').createNoteFromFile;
      require('../../../lib/commands/note').createNoteFromFile = jest.fn((filePath, credentials, options) => {
        capturedFilePath = filePath;
        capturedOptions = options;
        return Promise.resolve({ shortlink: 'http://test.com', title: 'File Note' });
      });
      
      const command = handleNoteCommand(args, globalOptions);
      
      // Execute the command
      return command().then(() => {
        expect(capturedFilePath).toBe('notes.txt');
        expect(capturedOptions).toEqual({
          privacy: 'PRIVATE',
          password: null,
          title: 'File Note',
          lang: null,
          isCode: false
        });
      });
    });

    test('should parse code snippet arguments correctly', () => {
      const args = ['--code', 'console.log("hello")', '--lang', 'javascript', '--title', 'JS Code'];
      const globalOptions = { porcelain: false };
      
      // Mock createNote to capture the arguments
      let capturedText, capturedOptions;
      const originalCreateNote = require('../../../lib/commands/note').createNote;
      require('../../../lib/commands/note').createNote = jest.fn((text, credentials, options) => {
        capturedText = text;
        capturedOptions = options;
        return Promise.resolve({ shortlink: 'http://test.com', title: 'JS Code' });
      });
      
      const command = handleNoteCommand(args, globalOptions);
      
      // Execute the command
      return command().then(() => {
        expect(capturedText).toBe('console.log("hello")');
        expect(capturedOptions).toEqual({
          privacy: 'PUBLIC',
          password: null,
          title: 'JS Code',
          lang: 'javascript',
          isCode: true
        });
      });
    });
  });

  describe('createNote', () => {
    test('should create note successfully', async () => {
      const mockResult = {
        shortlink: 'https://a.supportally.com/n/abc123',
        type: 'NOTE',
        title: 'Test Note',
        variant: 'plain'
      };
      
      mockClient.drops.create.mockResolvedValue(mockResult);
      mockHandlePrivateDropCreation.mockResolvedValue(mockResult);
      
      const result = await createNote('Hello world', { type: 'jwt' }, { title: 'Test Note' });
      
      expect(mockCreateClient).toHaveBeenCalledWith({ type: 'jwt' });
      expect(mockClient.drops.create).toHaveBeenCalledWith({
        type: 'NOTE',
        content: 'Hello world',
        variant: 'text/plain',
        title: 'Test Note'
      });
      expect(mockHandlePrivateDropCreation).toHaveBeenCalledWith(mockClient, mockResult, { title: 'Test Note' });
      expect(result).toEqual(mockResult);
    });

    test('should throw error for empty content', async () => {
      await expect(createNote('', { type: 'jwt' }, {}))
        .rejects
        .toThrow('Note content cannot be empty');

      await expect(createNote('   ', { type: 'jwt' }, {}))
        .rejects
        .toThrow('Note content cannot be empty');
    });

    test('should trim whitespace from content', async () => {
      const mockResult = { shortlink: 'https://test.com' };
      mockClient.drops.create.mockResolvedValue(mockResult);
      mockHandlePrivateDropCreation.mockResolvedValue(mockResult);

      await createNote('  Hello world  ', { type: 'jwt' }, {});
      
      expect(mockClient.drops.create).toHaveBeenCalledWith({
        type: 'NOTE',
        content: 'Hello world',
        variant: 'text/plain'
      });
    });

    test('should use text/code variant for code snippets', async () => {
      const mockResult = { shortlink: 'https://test.com' };
      mockClient.drops.create.mockResolvedValue(mockResult);
      mockHandlePrivateDropCreation.mockResolvedValue(mockResult);

      await createNote('console.log("test")', { type: 'jwt' }, { isCode: true, lang: 'javascript' });
      
      expect(mockClient.drops.create).toHaveBeenCalledWith({
        type: 'NOTE',
        content: 'console.log("test")',
        variant: 'text/code'
      });
    });

    test('should handle private notes', async () => {
      const mockResult = { shortlink: 'https://test.com' };
      mockClient.drops.create.mockResolvedValue(mockResult);
      mockHandlePrivateDropCreation.mockResolvedValue(mockResult);

      const options = { privacy: 'PRIVATE', password: 'secret' };
      await createNote('Private note', { type: 'jwt' }, options);
      
      expect(mockHandlePrivateDropCreation).toHaveBeenCalledWith(mockClient, mockResult, options);
    });
  });

  describe('createNoteFromFile', () => {
    beforeEach(() => {
      fs.existsSync = jest.fn(() => true);
      fs.readFileSync = jest.fn(() => 'File content');
    });

    test('should create note from file successfully', async () => {
      const mockResult = {
        shortlink: 'https://test.com',
        title: 'test.txt'
      };
      
      mockClient.drops.create.mockResolvedValue(mockResult);
      mockHandlePrivateDropCreation.mockResolvedValue(mockResult);
      
      const result = await createNoteFromFile('test.txt', { type: 'jwt' }, {});
      
      expect(fs.readFileSync).toHaveBeenCalledWith('test.txt', 'utf8');
      expect(mockClient.drops.create).toHaveBeenCalledWith({
        type: 'NOTE',
        content: 'File content',
        variant: 'text/plain',
        title: 'test.txt'
      });
      expect(result).toEqual(mockResult);
    });

    test('should throw error for non-existent file', async () => {
      fs.existsSync.mockReturnValue(false);
      
      await expect(createNoteFromFile('nonexistent.txt', { type: 'jwt' }, {}))
        .rejects
        .toThrow('File not found: nonexistent.txt');
    });

    test('should use filename as default title', async () => {
      const mockResult = { shortlink: 'https://test.com' };
      mockClient.drops.create.mockResolvedValue(mockResult);
      mockHandlePrivateDropCreation.mockResolvedValue(mockResult);

      await createNoteFromFile('/path/to/script.js', { type: 'jwt' }, {});
      
      expect(mockClient.drops.create).toHaveBeenCalledWith(expect.objectContaining({
        title: 'script.js'
      }));
    });

    test('should override filename with custom title', async () => {
      const mockResult = { shortlink: 'https://test.com' };
      mockClient.drops.create.mockResolvedValue(mockResult);
      mockHandlePrivateDropCreation.mockResolvedValue(mockResult);

      await createNoteFromFile('script.js', { type: 'jwt' }, { title: 'Custom Title' });
      
      expect(mockClient.drops.create).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Custom Title'
      }));
    });

    test('should detect language from file extension', async () => {
      const mockResult = { shortlink: 'https://test.com' };
      mockClient.drops.create.mockResolvedValue(mockResult);
      mockHandlePrivateDropCreation.mockResolvedValue(mockResult);

      await createNoteFromFile('script.js', { type: 'jwt' }, {});
      
      // Should use text/code variant for JavaScript files
      expect(mockClient.drops.create).toHaveBeenCalledWith(expect.objectContaining({
        variant: 'text/code'
      }));
    });

    test('should override auto-detected language', async () => {
      const mockResult = { shortlink: 'https://test.com' };
      mockClient.drops.create.mockResolvedValue(mockResult);
      mockHandlePrivateDropCreation.mockResolvedValue(mockResult);

      await createNoteFromFile('script.js', { type: 'jwt' }, { lang: 'typescript' });
      
      expect(mockClient.drops.create).toHaveBeenCalledWith(expect.objectContaining({
        variant: 'text/code'
      }));
    });

    test('should handle file read errors', async () => {
      fs.readFileSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      await expect(createNoteFromFile('test.txt', { type: 'jwt' }, {}))
        .rejects
        .toThrow('Failed to read file: Permission denied');
    });
  });
});