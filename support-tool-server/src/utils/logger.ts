import winston from 'winston';
import fs from 'fs';
import path from 'path';

// Get today's date folder (e.g. 2025-04-22)
const getLogDirForToday = (): string => {
  const dateStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const logDir = path.join(__dirname, '../../logs', dateStr);

  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  return logDir;
};

const createLoggerForLevel = (level: 'info' | 'warn' | 'error' | 'debug') => {
    return winston.createLogger({
      level,
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(
          (info) => `${info.timestamp} [${info.level.toUpperCase()}]: ${info.message}`
        )
      ),
      transports: [
        // ✅ File transport
        new winston.transports.File({
          filename: path.join(getLogDirForToday(), `${level}.log`),
          level,
        }),
  
        
        // ✅ Console transport
        new winston.transports.Console({
          level,
          format: winston.format.combine(
            winston.format.colorize(), // adds colors
            winston.format.printf(
              (info) => `${info.timestamp} [${info.level}]: ${info.message}`
            )
          ),
        }),
      ],
    });
  };
  
const infoLogger = createLoggerForLevel('info');
const warnLogger = createLoggerForLevel('warn');
const errorLogger = createLoggerForLevel('error');
const debugLogger = createLoggerForLevel('debug');

// Expose a unified logger interface
const logger = {
  info: (msg: string) => infoLogger.info(msg),
  warn: (msg: string) => warnLogger.warn(msg),
  error: (msg: string) => errorLogger.error(msg),
  debug: (msg: string) => debugLogger.debug(msg),
};

export default logger;
