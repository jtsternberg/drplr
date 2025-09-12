const fs = require('fs');
const path = require('path');
const os = require('os');

const CONFIG_DIR = path.join(os.homedir(), '.drplr');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

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
    console.error('Error loading config:', error.message);
  }
  return {};
}

function saveConfig(config) {
  try {
    ensureConfigDir();
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving config:', error.message);
    return false;
  }
}

function getCredentials() {
  const config = loadConfig();
  
  if (config.username && config.password) {
    return {
      type: 'basic',
      username: config.username,
      password: config.password
    };
  }
  
  if (config.token) {
    return {
      type: 'jwt',
      token: config.token
    };
  }
  
  return {
    type: 'anonymous'
  };
}

function setCredentials(type, ...args) {
  const config = loadConfig();
  
  if (type === 'basic') {
    const [username, password] = args;
    config.username = username;
    config.password = password;
    delete config.token;
  } else if (type === 'jwt') {
    const [token] = args;
    config.token = token;
    delete config.username;
    delete config.password;
  }
  
  return saveConfig(config);
}

module.exports = {
  loadConfig,
  saveConfig,
  getCredentials,
  setCredentials
};