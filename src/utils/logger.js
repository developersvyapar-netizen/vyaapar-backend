/**
 * Simple logger utility
 * In production, consider using a proper logging library like Winston or Pino
 */

const logLevels = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
};

const currentLogLevel = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'INFO' : 'DEBUG');

const shouldLog = (level) => {
  return logLevels[level] <= logLevels[currentLogLevel];
};

const formatMessage = (level, message, data = {}) => {
  const timestamp = new Date().toISOString();
  return {
    timestamp,
    level,
    message,
    ...data,
  };
};

export const logger = {
  error: (message, data) => {
    if (shouldLog('ERROR')) {
      console.error(JSON.stringify(formatMessage('ERROR', message, data)));
    }
  },
  warn: (message, data) => {
    if (shouldLog('WARN')) {
      console.warn(JSON.stringify(formatMessage('WARN', message, data)));
    }
  },
  info: (message, data) => {
    if (shouldLog('INFO')) {
      console.info(JSON.stringify(formatMessage('INFO', message, data)));
    }
  },
  debug: (message, data) => {
    if (shouldLog('DEBUG')) {
      console.debug(JSON.stringify(formatMessage('DEBUG', message, data)));
    }
  },
};
