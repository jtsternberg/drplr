const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const logger = require('./logger');

// Use XDG Base Directory specification
// https://specifications.freedesktop.org/basedir-spec/latest/
const getConfigDir = () => {
  const xdgConfigHome = process.env.XDG_CONFIG_HOME;
  if (xdgConfigHome) {
    return path.join(xdgConfigHome, 'drplr');
  }
  return path.join(os.homedir(), '.config', 'drplr');
};

const CONFIG_DIR = getConfigDir();
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

// Simple encryption using machine-specific key
function getMachineKey() {
  const machineId = os.hostname() + os.platform() + os.arch();
  return crypto.createHash('sha256').update(machineId).digest();
}

function encrypt(text) {
  const key = getMachineKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(encryptedText) {
  try {
    const key = getMachineKey();
    const [ivHex, encrypted] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    throw new Error('Failed to decrypt credentials');
  }
}

function ensureConfigDir() {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
      return config;
    }
  } catch (error) {
    logger.error('Error loading config:', error.message);
  }
  return {};
}

function saveConfig(config) {
  try {
    ensureConfigDir();
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    return true;
  } catch (error) {
    logger.error('Error saving config:', error.message);
    return false;
  }
}

function getCredentials() {
  const config = loadConfig();

  try {
    if (config.encryptedUsername && config.encryptedPassword) {
      return {
        type: 'basic',
        username: decrypt(config.encryptedUsername),
        password: decrypt(config.encryptedPassword)
      };
    }

    if (config.encryptedToken) {
      return {
        type: 'jwt',
        token: decrypt(config.encryptedToken)
      };
    }
  } catch (error) {
    logger.error('Error decrypting credentials:', error.message);
    logger.error('You may need to reconfigure your credentials.');
  }

  return {
    type: 'anonymous'
  };
}

function setCredentials(type, ...args) {
  const config = loadConfig();

  if (type === 'basic') {
    const [username, password] = args;
    config.encryptedUsername = encrypt(username);
    config.encryptedPassword = encrypt(password);
    delete config.encryptedToken;
  } else if (type === 'jwt') {
    const [token] = args;
    config.encryptedToken = encrypt(token);
    delete config.encryptedUsername;
    delete config.encryptedPassword;
  }

  return saveConfig(config);
}

module.exports = {
  getCredentials,
  setCredentials
};