const crypto = require('crypto');

function generateHMACSignature(method, uri, date, publicKey, privateKey) {
  const stringToSign = [
    method.toUpperCase(),
    '',
    '',
    date,
    uri
  ].join('\n');
  
  const hmac = crypto.createHmac('sha1', privateKey);
  hmac.update(stringToSign);
  const signature = hmac.digest('base64');
  
  return `droplr ${publicKey}:${signature}`;
}

function getCurrentDate() {
  return new Date().toUTCString();
}

module.exports = {
  generateHMACSignature,
  getCurrentDate
};