/**
 * Simple logger utility
 * In production, consider using a proper logging library like Winston or Pino
 */

type LogLevel = 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';

const logLevels: Record<LogLevel, number> = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
};

const currentLogLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 
  (process.env.NODE_ENV === 'production' ? 'INFO' : 'DEBUG');

const shouldLog = (level: LogLevel): boolean => {
  return logLevels[level] <= logLevels[currentLogLevel];
};

const formatMessage = (level: LogLevel, message: string, data: Record<string, unknown> = {}): Record<string, unknown> => {
  const timestamp = new Date().toISOString();
  return {
    timestamp,
    level,
    message,
    ...data,
  };
};

export const logger = {
  error: (message: string, data?: Record<string, unknown>): void => {
    if (shouldLog('ERROR')) {
      console.error(JSON.stringify(formatMessage('ERROR', message, data)));
    }
  },
  warn: (message: string, data?: Record<string, unknown>): void => {
    if (shouldLog('WARN')) {
      console.warn(JSON.stringify(formatMessage('WARN', message, data)));
    }
  },
  info: (message: string, data?: Record<string, unknown>): void => {
    if (shouldLog('INFO')) {
      console.info(JSON.stringify(formatMessage('INFO', message, data)));
    }
  },
  debug: (message: string, data?: Record<string, unknown>): void => {
    if (shouldLog('DEBUG')) {
      console.debug(JSON.stringify(formatMessage('DEBUG', message, data)));
    }
  },
};
