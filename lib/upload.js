const fs = require('fs');
const path = require('path');
const Droplr = require('droplr-api');

function createClient(credentials) {
  if (credentials.type === 'basic') {
    return new Droplr.Client({
      auth: new Droplr.BasicAuth(credentials.username, credentials.password)
    });
  } else if (credentials.type === 'jwt') {
    return new Droplr.Client({
      auth: new Droplr.JwtAuth(credentials.token)
    });
  }
  
  return new Droplr.Client();
}

async function uploadFile(filePath, credentials, options = {}) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  
  const client = createClient(credentials);
  const fileName = path.basename(filePath);
  const fileStream = fs.createReadStream(filePath);
  const fileStats = fs.statSync(filePath);
  
  const mimeType = getMimeType(fileName);
  
  const dropOptions = {
    type: 'FILE',
    variant: mimeType,
    title: fileName,
    content: fileStream
  };
  
  if (options.privacy === 'PRIVATE') {
    dropOptions.privacy = 'PRIVATE';
    dropOptions.filePrivacy = 'PRIVATE';
  }
  
  if (options.password) {
    dropOptions.password = options.password;
  }
  
  try {
    const result = await client.drops.create(dropOptions);
    
    // If privacy was requested, try to update the drop with privacy settings
    if (options.privacy === 'PRIVATE') {
      try {
        const updateData = {
          privacy: 'PRIVATE'
        };
        
        const updatedResult = await client.drops.update(result.code, updateData);
        return updatedResult;
      } catch (updateError) {
        console.warn('Warning: Failed to set privacy after upload:', updateError.message);
        return result;
      }
    }
    
    return result;
  } catch (error) {
    if (error.response) {
      const message = error.response.data?.message || error.response.statusText;
      throw new Error(`Upload failed (${error.response.status}): ${message}`);
    } else if (error.request) {
      throw new Error('Upload failed: No response from server');
    } else {
      throw new Error(`Upload failed: ${error.message}`);
    }
  }
}

function getMimeType(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.pdf': 'application/pdf',
    '.txt': 'text/plain',
    '.md': 'text/markdown',
    '.json': 'application/json',
    '.mp4': 'video/mp4',
    '.mov': 'video/quicktime',
    '.avi': 'video/avi',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav'
  };
  
  return mimeTypes[ext] || 'application/octet-stream';
}

module.exports = {
  uploadFile
};