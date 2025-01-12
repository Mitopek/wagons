const fs = require('fs');
const path = require('path');
const LogLevelType = require("../constants/LogLevelType.js");

class LoggerService {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '../../');
    this.errorLogPath = path.join(this.projectRoot, 'error.log');
    this.warnLogPath = path.join(this.projectRoot, 'warn.log');
    this.infoLogPath = path.join(this.projectRoot, 'info.log');

    this.environment = process.env.NODE_ENV || 'development';
    this.logLevel = this.environment === 'production' ? LogLevelType.WARN : LogLevelType.INFO;
  }

  error(message) {
    const logMessage = `[${new Date().toISOString()}] ERROR: ${message}\n`;
    fs.appendFileSync(this.errorLogPath, logMessage);
    if (this.logLevel === LogLevelType.INFO || this.logLevel === LogLevelType.WARN) {
      console.error(logMessage.trim());
    }
  }

  warn(message) {
    const logMessage = `[${new Date().toISOString()}] WARN: ${message}\n`;
    fs.appendFileSync(this.warnLogPath, logMessage);
    if (this.logLevel === LogLevelType.INFO) {
      console.warn(logMessage.trim());
    }
  }

  info(message) {
    if (this.logLevel === LogLevelType.INFO) {
      const logMessage = `[${new Date().toISOString()}] INFO: ${message}\n`;
      fs.appendFileSync(this.infoLogPath, logMessage);
      console.log(logMessage.trim());
    }
  }
}

module.exports = LoggerService;