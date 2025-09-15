const { parseUploadArgs, parseLinkArgs, parseNoteArgs } = require('../../../lib/arg-parser');
const { handleUploadCommand } = require('../../../lib/commands/upload');
const { handleLinkCommand } = require('../../../lib/commands/link');
const { handleNoteCommand } = require('../../../lib/commands/note');

// Mock all the dependencies at the module level
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

jest.mock('fs', () => ({
  existsSync: jest.fn(() => false),
  createReadStream: jest.fn(),
  readFileSync: jest.fn()
}));

describe('Simplified Command Tests', () => {
  describe('Command Handler Types', () => {
    test('handleUploadCommand should return async function', () => {
      const command = handleUploadCommand(['test.txt'], {});
      expect(typeof command).toBe('function');
      expect(command.constructor.name).toBe('AsyncFunction');
    });

    test('handleLinkCommand should return async function', () => {
      const command = handleLinkCommand(['https://example.com'], {});
      expect(typeof command).toBe('function');
      expect(command.constructor.name).toBe('AsyncFunction');
    });

    test('handleNoteCommand should return async function', () => {
      const command = handleNoteCommand(['Hello world'], {});
      expect(typeof command).toBe('function');
      expect(command.constructor.name).toBe('AsyncFunction');
    });
  });

  describe('Argument Parsing Integration', () => {
    test('parseUploadArgs should work with real upload command', () => {
      const result = parseUploadArgs(['file.txt', '--private', '--title', 'My File']);
      expect(result.filePath).toBe('file.txt');
      expect(result.options.privacy).toBe('PRIVATE');
      expect(result.options.title).toBe('My File');
    });

    test('parseLinkArgs should work with real link command', () => {
      const result = parseLinkArgs(['https://example.com', '--private']);
      expect(result.url).toBe('https://example.com');
      expect(result.options.privacy).toBe('PRIVATE');
    });

    test('parseNoteArgs should work with real note command', () => {
      const result = parseNoteArgs(['Hello world', '--title', 'My Note']);
      expect(result.text).toBe('Hello world');
      expect(result.options.title).toBe('My Note');
    });
  });

  describe('Error Handling', () => {
    test('handleUploadCommand should exit for no file path', () => {
      const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit');
      });
      
      expect(() => handleUploadCommand(['--private'], {})).toThrow('process.exit');
      expect(mockExit).toHaveBeenCalledWith(1);
      
      mockExit.mockRestore();
    });

    test('handleLinkCommand should exit for no URL', () => {
      const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit');
      });
      
      expect(() => handleLinkCommand(['--private'], {})).toThrow('process.exit');
      expect(mockExit).toHaveBeenCalledWith(1);
      
      mockExit.mockRestore();
    });

    test('handleNoteCommand should exit for no content', () => {
      const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit');
      });
      
      expect(() => handleNoteCommand([], {})).toThrow('process.exit');
      expect(mockExit).toHaveBeenCalledWith(1);
      
      mockExit.mockRestore();
    });
  });
});