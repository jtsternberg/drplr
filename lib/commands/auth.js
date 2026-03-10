const { execSync } = require('child_process');
const readline = require('readline');
const { setCredentials, set1PasswordItem } = require('../config');
const logger = require('../logger');

function prompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stderr });
  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function fetchLoginItems() {
  try {
    const result = execSync('op item list --categories Login --format json', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      maxBuffer: 10 * 1024 * 1024
    });
    return JSON.parse(result);
  } catch (error) {
    const msg = error.stderr ? error.stderr.toString().trim() : error.message;
    logger.error('Failed to list 1Password items:', msg);
    return null;
  }
}

function filterItems(items, query) {
  const q = query.toLowerCase();
  return items.filter(item =>
    item.title.toLowerCase().includes(q) ||
    (item.additional_information || '').toLowerCase().includes(q) ||
    (item.urls || []).some(u => (u.href || '').toLowerCase().includes(q))
  );
}

function formatItem(item) {
  const info = item.additional_information ? ` (${item.additional_information})` : '';
  return `${item.title}${info}`;
}

async function presentChoices(items, includeSearch) {
  items.sort((a, b) => a.title.localeCompare(b.title));

  logger.error('');
  items.forEach((item, i) => {
    logger.error(`  ${i + 1}. ${formatItem(item)}`);
  });
  if (includeSearch) {
    logger.error(`  ${items.length + 1}. Search for something else...`);
  }
  logger.error('');

  const answer = await prompt('Enter number (or q to cancel): ');
  if (!answer || answer.toLowerCase() === 'q') {
    logger.error('Cancelled.');
    return null;
  }

  const num = parseInt(answer, 10);
  if (isNaN(num) || num < 1 || num > items.length + (includeSearch ? 1 : 0)) {
    logger.error('Invalid selection.');
    return null;
  }

  // "Search" option selected
  if (includeSearch && num === items.length + 1) {
    return 'SEARCH';
  }

  return items[num - 1].title;
}

async function searchAndPick(allItems) {
  const search = await prompt('Search 1Password items: ');
  if (!search) {
    logger.error('Cancelled.');
    return null;
  }

  const matches = filterItems(allItems, search);
  if (matches.length === 0) {
    logger.error(`No login items matching "${search}".`);
    return null;
  }

  if (matches.length === 1) {
    logger.log(`Found: ${formatItem(matches[0])}`);
    return matches[0].title;
  }

  logger.error(`Found ${matches.length} items matching "${search}":`);
  return presentChoices(matches, false);
}

async function pick1PasswordItem() {
  const allItems = fetchLoginItems();
  if (!allItems || allItems.length === 0) {
    logger.error('No login items found in 1Password.');
    return null;
  }

  // Auto-search for obvious terms related to this tool
  const autoSearchTerms = ['droplr', 'drplr', 'd.pr'];
  let autoMatches = [];
  for (const term of autoSearchTerms) {
    autoMatches = filterItems(allItems, term);
    if (autoMatches.length > 0) break;
  }

  if (autoMatches.length === 1) {
    logger.log(`Found: ${formatItem(autoMatches[0])}`);
    return autoMatches[0].title;
  }

  if (autoMatches.length > 1) {
    logger.error('Found possible Droplr items:');
    const choice = await presentChoices(autoMatches, true);
    if (choice === 'SEARCH') {
      return searchAndPick(allItems);
    }
    return choice;
  }

  // No auto-matches, go straight to search
  logger.error('No Droplr items found automatically.');
  return searchAndPick(allItems);
}

/**
 * Handles authentication commands (token, login, 1password)
 * @param {string[]} args - Command arguments
 */
async function handleAuthCommand(args) {
  if (args[0] === 'token') {
    if (args.length !== 2) {
      logger.error('Usage: drplr auth token <jwt_token>');
      process.exit(1);
    }

    const token = args[1];

    if (setCredentials('jwt', token)) {
      logger.log('✓ JWT token saved successfully');
    } else {
      logger.error('✗ Failed to save JWT token');
      process.exit(1);
    }
    return;
  }

  if (args[0] === 'login') {
    if (args.length !== 3) {
      logger.error('Usage: drplr auth login <username> <password>');
      process.exit(1);
    }

    const [, username, password] = args;

    if (setCredentials('basic', username, password)) {
      logger.log('✓ Login credentials saved successfully');
    } else {
      logger.error('✗ Failed to save login credentials');
      process.exit(1);
    }
    return;
  }

  if (args[0] === '1password' || args[0] === 'op') {
    let item = args[1];

    if (!item) {
      item = await pick1PasswordItem();
      if (!item) {
        process.exit(1);
      }
    }

    const autoPicked = !args[1];
    logger.log('Verifying 1Password item...');
    if (set1PasswordItem(item)) {
      logger.log('✓ 1Password item configured successfully');
      logger.log('  Credentials will be fetched from 1Password at runtime.');
      if (autoPicked) {
        logger.log('');
        logger.log('  tip: Wrong account? Use "op signin" to switch.');
      }
    } else {
      logger.error('✗ Failed to configure 1Password item');
      logger.error('  Make sure the item exists and has username/password fields.');
      process.exit(1);
    }
    return;
  }

  logger.error('Usage: drplr auth [token|login|1password] ...');
  logger.error('Run "drplr help" for more information');
  process.exit(1);
}

module.exports = { handleAuthCommand };