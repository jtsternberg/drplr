const { 
  parseCommonArgs, 
  parseUploadArgs, 
  parseLinkArgs, 
  parseNoteArgs 
} = require('../../lib/arg-parser');

describe('arg-parser', () => {
  describe('parseCommonArgs', () => {
    test('should parse basic arguments', () => {
      const args = ['--private', '--password', 'secret123', '--title', 'My Title'];
      const result = parseCommonArgs(args);
      
      expect(result.options).toEqual({
        privacy: 'PRIVATE',
        password: 'secret123',
        title: 'My Title',
        board: null
      });
      expect(result.remainingArgs).toEqual([]);
    });

    test('should handle short flag -p for private', () => {
      const args = ['-p', 'somearg'];
      const result = parseCommonArgs(args);
      
      expect(result.options.privacy).toBe('PRIVATE');
      expect(result.remainingArgs).toEqual(['somearg']);
    });

    test('should preserve non-flag arguments', () => {
      const args = ['file.txt', '--private', 'https://example.com'];
      const result = parseCommonArgs(args);
      
      expect(result.options.privacy).toBe('PRIVATE');
      expect(result.remainingArgs).toEqual(['file.txt', 'https://example.com']);
    });

    test('should handle help flag', () => {
      const args = ['--help', 'file.txt'];
      const result = parseCommonArgs(args);
      
      expect(result.options.showHelp).toBe(true);
      expect(result.remainingArgs).toEqual(['--help', 'file.txt']);
    });

    test('should set default values', () => {
      const args = ['file.txt'];
      const result = parseCommonArgs(args);
      
      expect(result.options).toEqual({
        privacy: 'PUBLIC',
        password: null,
        title: null,
        board: null
      });
      expect(result.remainingArgs).toEqual(['file.txt']);
    });

    test('should parse board argument', () => {
      const args = ['--board', 'Project Assets', 'file.txt'];
      const result = parseCommonArgs(args);
      
      expect(result.options.board).toBe('Project Assets');
      expect(result.remainingArgs).toEqual(['file.txt']);
    });
  });

  describe('parseUploadArgs', () => {
    test('should parse file upload arguments', () => {
      const args = ['file.txt', '--private', '--title', 'My File'];
      const result = parseUploadArgs(args);
      
      expect(result.filePath).toBe('file.txt');
      expect(result.options.privacy).toBe('PRIVATE');
      expect(result.options.title).toBe('My File');
    });

    test('should handle no file path', () => {
      const args = ['--private'];
      const result = parseUploadArgs(args);
      
      expect(result.filePath).toBeNull();
      expect(result.options.privacy).toBe('PRIVATE');
    });

    test('should ignore flags as file paths', () => {
      const args = ['--private', '--password', 'secret', 'actual-file.txt'];
      const result = parseUploadArgs(args);
      
      expect(result.filePath).toBe('actual-file.txt');
      expect(result.options.password).toBe('secret');
    });

    test('should handle board option in upload', () => {
      const args = ['image.png', '--board', 'My Board', '--private'];
      const result = parseUploadArgs(args);
      
      expect(result.filePath).toBe('image.png');
      expect(result.options.board).toBe('My Board');
      expect(result.options.privacy).toBe('PRIVATE');
    });
  });

  describe('parseLinkArgs', () => {
    test('should parse link arguments', () => {
      const args = ['https://example.com', '--private', '--title', 'My Link'];
      const result = parseLinkArgs(args);
      
      expect(result.url).toBe('https://example.com');
      expect(result.options.privacy).toBe('PRIVATE');
      expect(result.options.title).toBe('My Link');
    });

    test('should handle no URL', () => {
      const args = ['--private'];
      const result = parseLinkArgs(args);
      
      expect(result.url).toBe('');
      expect(result.options.privacy).toBe('PRIVATE');
    });

    test('should pick first non-flag as URL', () => {
      const args = ['--private', 'https://first.com', 'https://second.com'];
      const result = parseLinkArgs(args);
      
      expect(result.url).toBe('https://first.com');
    });
  });

  describe('parseNoteArgs', () => {
    test('should parse basic note text', () => {
      const args = ['Hello world', '--private', '--title', 'My Note'];
      const result = parseNoteArgs(args);
      
      expect(result.text).toBe('Hello world');
      expect(result.filePath).toBe('');
      expect(result.options.privacy).toBe('PRIVATE');
      expect(result.options.title).toBe('My Note');
      expect(result.options.isCode).toBe(false);
      expect(result.options.lang).toBeNull();
    });

    test('should parse file-based note', () => {
      const args = ['--file', 'notes.txt', '--private'];
      const result = parseNoteArgs(args);
      
      expect(result.text).toBe('');
      expect(result.filePath).toBe('notes.txt');
      expect(result.options.privacy).toBe('PRIVATE');
    });

    test('should parse code snippet', () => {
      const args = ['--code', 'console.log("hello")', '--lang', 'javascript', '--title', 'JS Code'];
      const result = parseNoteArgs(args);
      
      expect(result.text).toBe('console.log("hello")');
      expect(result.filePath).toBe('');
      expect(result.options.isCode).toBe(true);
      expect(result.options.lang).toBe('javascript');
      expect(result.options.title).toBe('JS Code');
    });

    test('should handle complex mixed arguments', () => {
      const args = ['--private', '--code', 'print("test")', '--lang', 'python', '--password', 'secret', '--title', 'Python Script'];
      const result = parseNoteArgs(args);
      
      expect(result.text).toBe('print("test")');
      expect(result.options).toEqual({
        privacy: 'PRIVATE',
        password: 'secret',
        title: 'Python Script',
        lang: 'python',
        isCode: true
      });
    });

    test('should prioritize --code over regular text', () => {
      const args = ['regular text', '--code', 'code text'];
      const result = parseNoteArgs(args);
      
      expect(result.text).toBe('code text');
      expect(result.options.isCode).toBe(true);
    });

    test('should prioritize --file over regular text', () => {
      const args = ['regular text', '--file', 'file.txt'];
      const result = parseNoteArgs(args);
      
      expect(result.text).toBe('regular text');
      expect(result.filePath).toBe('file.txt');
    });
  });
});