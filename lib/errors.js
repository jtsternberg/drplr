class UploadError extends Error {
  constructor(message, statusCode = null) {
    super(message);
    this.name = 'UploadError';
    this.statusCode = statusCode;
  }
}

module.exports = {
  UploadError
};