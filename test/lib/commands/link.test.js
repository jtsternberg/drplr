const { handleLinkCommand, createLink } = require('../../../lib/commands/link');

// Mock all the dependencies
jest.mock('../../../lib/client');
jest.mock('../../../lib/command-utils');
jest.mock('../../../lib/logger');
jest.mock('../../../lib/api-utils');

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

describe('link command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('handleLinkCommand', () => {
    test('should return async function for valid URL', () => {
      const args = ['https://example.com'];
      const globalOptions = { porcelain: false, debug: false };
      
      const command = handleLinkCommand(args, globalOptions);
      
      expect(typeof command).toBe('function');
      expect(command.constructor.name).toBe('AsyncFunction');
    });

    test('should exit with error for no arguments', () => {
      const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit');
      });
      
      const args = [];
      const globalOptions = { porcelain: false };
      
      expect(() => handleLinkCommand(args, globalOptions)).toThrow('process.exit');
      expect(mockLogger.error).toHaveBeenCalledWith('Error: Please specify a URL to shorten');
      expect(mockExit).toHaveBeenCalledWith(1);
      
      mockExit.mockRestore();
    });

    test('should exit with error for no URL', () => {
      const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit');
      });
      
      const args = ['--private'];
      const globalOptions = { porcelain: false };
      
      expect(() => handleLinkCommand(args, globalOptions)).toThrow('process.exit');
      expect(mockLogger.error).toHaveBeenCalledWith('Error: Please specify a URL to shorten');
      expect(mockExit).toHaveBeenCalledWith(1);
      
      mockExit.mockRestore();
    });

    test('should parse arguments correctly', () => {
      const args = ['https://example.com', '--private', '--password', 'secret', '--title', 'My Link'];
      const globalOptions = { porcelain: false };
      
      // Mock createLink to capture the options
      let capturedUrl, capturedOptions;
      const originalCreateLink = require('../../../lib/commands/link').createLink;
      require('../../../lib/commands/link').createLink = jest.fn((url, credentials, options) => {
        capturedUrl = url;
        capturedOptions = options;
        return Promise.resolve({ shortlink: 'http://test.com' });
      });
      
      const command = handleLinkCommand(args, globalOptions);
      
      // Execute the command
      return command().then(() => {
        expect(capturedUrl).toBe('https://example.com');
        expect(capturedOptions).toEqual({
          privacy: 'PRIVATE',
          password: 'secret',
          title: 'My Link'
        });
      });
    });
  });

  describe('createLink', () => {
    test('should create link successfully', async () => {
      const mockResult = {
        shortlink: 'https://a.supportally.com/abc123',
        type: 'LINK',
        title: ''
      };
      
      mockClient.drops.create.mockResolvedValue(mockResult);
      mockHandlePrivateDropCreation.mockResolvedValue(mockResult);
      
      const result = await createLink('https://example.com', { type: 'jwt' }, {});
      
      expect(mockCreateClient).toHaveBeenCalledWith({ type: 'jwt' });
      expect(mockClient.drops.create).toHaveBeenCalledWith({
        type: 'LINK',
        content: 'https://example.com'
      });
      expect(mockHandlePrivateDropCreation).toHaveBeenCalledWith(mockClient, mockResult, {});
      expect(result).toEqual(mockResult);
    });

    test('should throw error for invalid URL', async () => {
      await expect(createLink('not-a-url', { type: 'jwt' }, {}))
        .rejects
        .toThrow('Invalid URL format: not-a-url');
    });

    test('should handle link with title', async () => {
      const mockResult = { shortlink: 'https://test.com', title: '' };
      mockClient.drops.create.mockResolvedValue(mockResult);
      mockHandlePrivateDropCreation.mockResolvedValue(mockResult);

      await createLink('https://example.com', { type: 'jwt' }, { title: 'My Link' });
      
      expect(mockClient.drops.create).toHaveBeenCalledWith({
        type: 'LINK',
        content: 'https://example.com',
        title: 'My Link'
      });
    });

    test('should handle private links', async () => {
      const mockResult = { shortlink: 'https://test.com' };
      mockClient.drops.create.mockResolvedValue(mockResult);
      mockHandlePrivateDropCreation.mockResolvedValue(mockResult);

      const options = { privacy: 'PRIVATE', password: 'secret' };
      await createLink('https://example.com', { type: 'jwt' }, options);
      
      expect(mockHandlePrivateDropCreation).toHaveBeenCalledWith(mockClient, mockResult, options);
    });

    test('should validate URL format', async () => {
      const invalidUrls = [
        'invalid-url',
        'ftp://example.com', // Valid URL but not http/https
        '',
        'javascript:alert("xss")'
      ];

      for (const invalidUrl of invalidUrls) {
        await expect(createLink(invalidUrl, { type: 'jwt' }, {}))
          .rejects
          .toThrow(`Invalid URL format: ${invalidUrl}`);
      }
    });

    test('should accept valid URLs', async () => {
      const mockResult = { shortlink: 'https://test.com' };
      mockClient.drops.create.mockResolvedValue(mockResult);
      mockHandlePrivateDropCreation.mockResolvedValue(mockResult);

      const validUrls = [
        'https://example.com',
        'http://example.com',
        'https://sub.example.com/path?query=value#hash',
        'http://localhost:3000'
      ];

      for (const validUrl of validUrls) {
        await expect(createLink(validUrl, { type: 'jwt' }, {}))
          .resolves
          .toEqual(mockResult);
      }
    });
  });
});