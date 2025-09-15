/**
 * Integration tests for the CLI functionality
 * These test the full command flow without making real API calls
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test timeout for CLI commands
const CLI_TIMEOUT = 10000;

function runCLI(args, options = {}) {
  return new Promise((resolve) => {
    const child = spawn('node', ['./drplr.js', ...args], {
      cwd: path.join(__dirname, '..'),
      ...options
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      resolve({ code, stdout, stderr });
    });

    // Kill process after timeout to prevent hanging
    setTimeout(() => {
      child.kill('SIGTERM');
      resolve({ code: 124, stdout, stderr, timeout: true });
    }, CLI_TIMEOUT);
  });
}

describe('CLI Integration Tests', () => {
  describe('Help and Usage', () => {
    test('should display help with help command', async () => {
      const result = await runCLI(['help']);
      
      expect(result.stdout).toContain('drplr - Droplr CLI tool');
      expect(result.stdout).toContain('Examples:');
    });

    test('should show usage info when no arguments', async () => {
      const result = await runCLI([]);
      
      expect(result.stdout).toContain('drplr - Droplr CLI tool');
      expect(result.stdout).toContain('Usage:');
    });

    test('should show error and usage info with --help flag', async () => {
      const result = await runCLI(['--help']);
      
      expect(result.stderr).toContain('Please specify a file to upload');
      expect(result.stderr).toContain('Use "drplr help" for usage information');
    });
  });

  describe('Error Handling', () => {
    test('should show error for missing file', async () => {
      const result = await runCLI(['nonexistent.txt']);
      
      expect(result.code).not.toBe(0);
      expect(result.stderr).toContain('File not found: nonexistent.txt');
    });

    test('should show error for missing URL in link command', async () => {
      const result = await runCLI(['link']);
      
      expect(result.code).toBe(1);
      expect(result.stderr).toContain('Please specify a URL to shorten');
    });

    test('should show error for missing text in note command', async () => {
      const result = await runCLI(['note']);
      
      expect(result.code).toBe(1);
      expect(result.stderr).toContain('Please specify text content or use --file option');
    });

    test('should show error for invalid link arguments', async () => {
      const result = await runCLI(['link', '--private']);
      
      expect(result.code).toBe(1);
      expect(result.stderr).toContain('Please specify a URL to shorten');
    });
  });

  describe('Argument Parsing', () => {
    test('should handle global flags correctly', async () => {
      // Test porcelain mode with help (should not affect help output location)
      const result = await runCLI(['--porcelain', 'help']);
      expect(result.stderr).toContain('drplr - Droplr CLI tool');
    });

    test('should handle debug flag', async () => {
      // Debug flag should be parsed but won\'t show effect without auth
      const result = await runCLI(['--debug', 'help']);
      expect(result.stdout).toContain('drplr - Droplr CLI tool');
    });

    test('should preserve command order with global flags', async () => {
      const result = await runCLI(['--debug', 'note']);
      expect(result.stderr).toContain('Please specify text content or use --file option');
    });
  });

  describe('Command Structure', () => {
    test('should recognize upload command (file as first arg)', async () => {
      const result = await runCLI(['test.txt']);
      
      // Should fail due to file not existing, but recognize it as upload command
      expect(result.stderr).toContain('File not found: test.txt');
    });

    test('should recognize link command', async () => {
      const result = await runCLI(['link', 'https://example.com']);
      
      // Should either succeed (if auth configured) or fail with auth error
      // But should not fail with argument parsing error
      if (result.code !== 0) {
        expect(result.stderr).not.toContain('Please specify a URL to shorten');
      } else {
        expect(result.stdout).toContain('Link created successfully');
      }
    });

    test('should recognize note command', async () => {
      const result = await runCLI(['note', 'hello world']);
      
      // Should either succeed (if auth configured) or fail with auth error  
      // But should not fail with argument parsing error
      if (result.code !== 0) {
        expect(result.stderr).not.toContain('Please specify text content');
      } else {
        expect(result.stdout).toContain('Note created successfully');
      }
    });

    test('should recognize auth command', async () => {
      const result = await runCLI(['auth']);
      
      expect(result.code).toBe(1);
      expect(result.stderr).toContain('Usage: drplr auth [token|login]');
    });

    test('should recognize config command (alias for auth)', async () => {
      const result = await runCLI(['config']);
      
      expect(result.code).toBe(1);
      expect(result.stderr).toContain('Usage: drplr auth [token|login]');
    });
  });

  describe('File Operations', () => {
    test('should detect missing files properly', async () => {
      const result = await runCLI(['definitely-does-not-exist.txt']);
      
      expect(result.code).not.toBe(0);
      // Should fail with file not found error
      expect(result.stderr).toContain('File not found: definitely-does-not-exist.txt');
    });

    test('should handle file note command', async () => {
      const result = await runCLI(['note', '--file', 'nonexistent.txt']);
      
      expect(result.code).not.toBe(0);
      expect(result.stderr).toContain('File not found: nonexistent.txt');
    });
  });

  describe('Flag Combinations', () => {
    test('should handle multiple flags on upload', async () => {
      const result = await runCLI(['test.txt', '--private', '--password', 'secret', '--title', 'Test']);
      
      expect(result.stderr).toContain('File not found: test.txt');
    });

    test('should handle multiple flags on link', async () => {
      const result = await runCLI(['link', 'https://example.com', '--private', '--title', 'Test Link']);
      
      // Should either succeed or fail with auth error, not argument parsing error
      if (result.code !== 0) {
        expect(result.stderr).not.toContain('Please specify a URL to shorten');
      } else {
        expect(result.stdout).toContain('Link created successfully');
      }
    });

    test('should handle complex note flags', async () => {
      const result = await runCLI(['note', '--code', 'console.log("test")', '--lang', 'javascript', '--title', 'Code Test']);
      
      // Should either succeed or fail with auth error, not argument parsing error
      if (result.code !== 0) {
        expect(result.stderr).not.toContain('Please specify text content');
      } else {
        expect(result.stdout).toContain('Note created successfully');
      }
    });
  });
});

describe('Argument Parser Unit Tests (Integration Style)', () => {
  // These test that our CLI correctly parses different argument combinations
  // by checking that we get past argument parsing to file/auth checks
  
  test('should parse note command with file correctly', async () => {
    const result = await runCLI(['note', '--file', 'test.md', '--private']);
    
    // If parsing worked, we'd get file error, not argument error
    expect(result.stderr).toContain('File not found: test.md');
    expect(result.stderr).not.toContain('Please specify text content');
  });

  test('should parse note command with code correctly', async () => {
    const result = await runCLI(['note', '--code', 'print("hello")', '--lang', 'python']);
    
    expect(result.stderr).not.toContain('Please specify text content');
    // Should either succeed or fail with auth error, not argument parsing error
    if (result.code === 0) {
      expect(result.stdout).toContain('Note created successfully');
    }
  });

  test('should parse upload command with all flags', async () => {
    const result = await runCLI(['file.txt', '--private', '--password', 'secret', '--title', 'My File']);
    
    expect(result.stderr).toContain('File not found: file.txt');
    // If we got here, argument parsing succeeded
  });
});