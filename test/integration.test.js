/**
 * Integration tests for the CLI functionality
 * These test the full command flow without making real API calls
 */

const { spawn } = require('child_process');
const os = require('os');
const path = require('path');

// Test timeout for CLI commands
const CLI_TIMEOUT = 10000;

// Use an isolated config dir so tests never trigger real auth (e.g. 1Password)
const TEST_CONFIG_HOME = path.join(os.tmpdir(), 'drplr-test-config');

function runCLI(args, options = {}) {
  return new Promise((resolve) => {
    const child = spawn('node', ['./drplr.js', ...args], {
      cwd: path.join(__dirname, '..'),
      env: { ...process.env, XDG_CONFIG_HOME: TEST_CONFIG_HOME },
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

    test('should show help with --help flag', async () => {
      const result = await runCLI(['--help']);

      expect(result.stdout).toContain('drplr - Droplr CLI tool');
      expect(result.stdout).toContain('Usage:');
    });
  });

  describe('Error Handling', () => {
    test('should show error for missing file or auth', async () => {
      const result = await runCLI(['nonexistent.txt']);

      expect(result.code).not.toBe(0);
      // Without auth configured, auth error comes first; with auth, file-not-found
      expect(result.stderr).toMatch(/File not found|No authentication configured/);
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

      // Recognized as upload — fails with auth or file error, not argument error
      expect(result.code).not.toBe(0);
      expect(result.stderr).toMatch(/File not found|No authentication configured/);
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
      expect(result.stderr).toContain('Usage: drplr auth [token|login|1password]');
    });

    test('should recognize config command (alias for auth)', async () => {
      const result = await runCLI(['config']);
      
      expect(result.code).toBe(1);
      expect(result.stderr).toContain('Usage: drplr auth [token|login|1password]');
    });
  });

  describe('File Operations', () => {
    test('should detect missing files properly', async () => {
      const result = await runCLI(['definitely-does-not-exist.txt']);

      expect(result.code).not.toBe(0);
      // Auth check runs before file check when no credentials configured
      expect(result.stderr).toMatch(/File not found|No authentication configured/);
    });

    test('should handle file note command', async () => {
      const result = await runCLI(['note', '--file', 'nonexistent.txt']);

      expect(result.code).not.toBe(0);
      expect(result.stderr).toMatch(/File not found|No authentication configured/);
    });
  });

  describe('Flag Combinations', () => {
    test('should handle multiple flags on upload', async () => {
      const result = await runCLI(['test.txt', '--private', '--password', 'secret', '--title', 'Test']);

      // Flags parsed correctly — fails at auth or file check, not arg parsing
      expect(result.stderr).toMatch(/File not found|No authentication configured/);
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

    // Parsing worked — get file or auth error, not argument error
    expect(result.stderr).toMatch(/File not found|No authentication configured/);
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

    // Argument parsing succeeded — fails at auth or file check
    expect(result.stderr).toMatch(/File not found|No authentication configured/);
  });
});