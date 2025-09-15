const { handleUploadCommand, uploadFile } = require('../../../lib/commands/upload');

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
  handlePrivateDropCreation: jest.fn(),
  parseApiError: jest.fn()
}));

jest.mock('fs', () => ({
  existsSync: jest.fn(),
  createReadStream: jest.fn()
}));

const { createClient } = require('../../../lib/client');
const { requireAuthentication } = require('../../../lib/command-utils');
const { handlePrivateDropCreation } = require('../../../lib/api-utils');
const logger = require('../../../lib/logger');
const fs = require('fs');

const mockClient = {
  drops: {
    create: jest.fn()
  }
};

describe('upload command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    createClient.mockReturnValue(mockClient);
    requireAuthentication.mockReturnValue({ type: 'jwt', token: 'test-token' });
    handlePrivateDropCreation.mockImplementation((client, result, options) => Promise.resolve(result));
  });

  describe('handleUploadCommand', () => {
    test('should return async function for valid file', () => {
      const args = ['test.txt'];
      const globalOptions = { porcelain: false, debug: false };
      
      const command = handleUploadCommand(args, globalOptions);
      
      expect(typeof command).toBe('function');
      expect(command.constructor.name).toBe('AsyncFunction');
    });

    test('should exit with error for no file path', () => {
      const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit');
      });
      
      const args = ['--private'];
      const globalOptions = { porcelain: false };
      
      expect(() => handleUploadCommand(args, globalOptions)).toThrow('process.exit');
      expect(logger.error).toHaveBeenCalledWith('Error: Please specify a file to upload');
      expect(mockExit).toHaveBeenCalledWith(1);
      
      mockExit.mockRestore();
    });

    test('should parse arguments correctly', () => {
      const args = ['test.txt', '--private', '--password', 'secret', '--title', 'My File'];
      const globalOptions = { porcelain: false };
      
      // Mock fs for this test
      fs.existsSync.mockReturnValue(true);
      fs.createReadStream.mockReturnValue('mock-stream');
      mockClient.drops.create.mockResolvedValue({ shortlink: 'http://test.com' });
      
      const command = handleUploadCommand(args, globalOptions);
      
      // Execute the command
      return command().then(() => {
        expect(mockClient.drops.create).toHaveBeenCalledWith(expect.objectContaining({
          title: 'My File'
        }));
        expect(handlePrivateDropCreation).toHaveBeenCalledWith(
          mockClient, 
          { shortlink: 'http://test.com' }, 
          expect.objectContaining({
            privacy: 'PRIVATE',
            password: 'secret',
            title: 'My File'
          })
        );
      });
    });
  });

  describe('uploadFile', () => {
    beforeEach(() => {
      fs.existsSync = jest.fn(() => true);
      fs.createReadStream = jest.fn(() => 'mock-stream');
    });

    test('should upload file successfully', async () => {
      const mockResult = {
        shortlink: 'https://test.com/abc123',
        type: 'FILE',
        title: 'test.txt'
      };
      
      mockClient.drops.create.mockResolvedValue(mockResult);
      handlePrivateDropCreation.mockResolvedValue(mockResult);
      
      const result = await uploadFile('test.txt', { type: 'jwt' }, {});
      
      expect(createClient).toHaveBeenCalledWith({ type: 'jwt' });
      expect(mockClient.drops.create).toHaveBeenCalledWith({
        type: 'FILE',
        variant: 'text/plain',
        title: 'test.txt',
        content: 'mock-stream'
      });
      expect(handlePrivateDropCreation).toHaveBeenCalledWith(mockClient, mockResult, {});
      expect(result).toEqual(mockResult);
    });

    test('should throw error for non-existent file', async () => {
      fs.existsSync.mockReturnValue(false);
      
      await expect(uploadFile('nonexistent.txt', { type: 'jwt' }, {}))
        .rejects
        .toThrow('File not found: nonexistent.txt');
    });

    test('should detect MIME types correctly', async () => {
      const mockResult = { shortlink: 'https://test.com' };
      mockClient.drops.create.mockResolvedValue(mockResult);
      handlePrivateDropCreation.mockResolvedValue(mockResult);

      // Test different file types
      await uploadFile('image.png', { type: 'jwt' }, {});
      expect(mockClient.drops.create).toHaveBeenCalledWith(expect.objectContaining({
        variant: 'image/png'
      }));

      await uploadFile('document.pdf', { type: 'jwt' }, {});
      expect(mockClient.drops.create).toHaveBeenCalledWith(expect.objectContaining({
        variant: 'application/pdf'
      }));

      await uploadFile('script.js', { type: 'jwt' }, {});
      expect(mockClient.drops.create).toHaveBeenCalledWith(expect.objectContaining({
        variant: 'application/octet-stream'
      }));
    });

    test('should handle upload with custom title', async () => {
      const mockResult = { shortlink: 'https://test.com' };
      mockClient.drops.create.mockResolvedValue(mockResult);
      handlePrivateDropCreation.mockResolvedValue(mockResult);

      await uploadFile('test.txt', { type: 'jwt' }, { title: 'Custom Title' });
      
      expect(mockClient.drops.create).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Custom Title'
      }));
    });

    test('should handle private uploads', async () => {
      const mockResult = { shortlink: 'https://test.com' };
      mockClient.drops.create.mockResolvedValue(mockResult);
      handlePrivateDropCreation.mockResolvedValue(mockResult);

      const options = { privacy: 'PRIVATE', password: 'secret' };
      await uploadFile('test.txt', { type: 'jwt' }, options);
      
      expect(mockClient.drops.create).toHaveBeenCalledWith(expect.objectContaining({
        privacy: 'PRIVATE',
        password: 'secret'
      }));
      expect(handlePrivateDropCreation).toHaveBeenCalledWith(mockClient, mockResult, options);
    });
  });
});