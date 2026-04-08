/**
 * Structured Logging System
 *
 * Provides a centralized logging interface with different log levels
 * and structured output for debugging and monitoring.
 */

/**
 * Log levels in order of severity
 */
export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3,
}

/**
 * Log entry interface
 */
interface LogEntry {
    level: LogLevel;
    timestamp: string;
    message: string;
    context?: Record<string, unknown>;
    error?: Error;
}

/**
 * Logger configuration
 */
interface LoggerConfig {
    level: LogLevel;
    enableConsole: boolean;
    enableTimestamps: boolean;
}

/**
 * Get log level name from enum value
 */
function getLevelName(level: LogLevel): string {
    switch (level) {
        case LogLevel.DEBUG:
            return "DEBUG";
        case LogLevel.INFO:
            return "INFO";
        case LogLevel.WARN:
            return "WARN";
        case LogLevel.ERROR:
            return "ERROR";
        default:
            return "UNKNOWN";
    }
}

/**
 * Get console method for log level
 */
function getConsoleMethod(level: LogLevel) {
    switch (level) {
        case LogLevel.DEBUG:
            return console.debug;
        case LogLevel.INFO:
            return console.info;
        case LogLevel.WARN:
            return console.warn;
        case LogLevel.ERROR:
            return console.error;
        default:
            return console.log;
    }
}

/**
 * Format timestamp
 */
function formatTimestamp(): string {
    return new Date().toISOString();
}

/**
 * Format log entry for console output
 */
function formatLogEntry(entry: LogEntry): string {
    const timestamp = entry.timestamp;
    const level = getLevelName(entry.level);
    const message = entry.message;

    let formatted = `[${timestamp}] [${level}] ${message}`;

    if (entry.context) {
        formatted += ` ${JSON.stringify(entry.context)}`;
    }

    if (entry.error) {
        formatted += ` | Error: ${entry.error.message}`;
        if (entry.error.stack) {
            formatted += `\n${entry.error.stack}`;
        }
    }

    return formatted;
}

/**
 * Global logger configuration
 */
let config: LoggerConfig = {
    level: LogLevel.DEBUG,
    enableConsole: true,
    enableTimestamps: true,
};

/**
 * Set logger configuration
 */
export function setLoggerConfig(newConfig: Partial<LoggerConfig>): void {
    config = { ...config, ...newConfig };
}

/**
 * Get current logger configuration
 */
export function getLoggerConfig(): LoggerConfig {
    return { ...config };
}

/**
 * Check if a log level should be logged
 */
function shouldLog(level: LogLevel): boolean {
    return level >= config.level;
}

/**
 * Create and log an entry
 */
function log(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    error?: Error
): void {
    if (!config.enableConsole || !shouldLog(level)) {
        return;
    }

    const entry: LogEntry = {
        level,
        timestamp: config.enableTimestamps ? formatTimestamp() : "",
        message,
        context,
        error,
    };

    const consoleMethod = getConsoleMethod(level);
    const formatted = formatLogEntry(entry);

    consoleMethod(formatted);
}

/**
 * Logger class for creating context-aware loggers
 */
export class Logger {
    private context: Record<string, unknown>;

    constructor(context: Record<string, unknown> = {}) {
        this.context = context;
    }

    /**
     * Create a child logger with additional context
     */
    child(additionalContext: Record<string, unknown>): Logger {
        return new Logger({ ...this.context, ...additionalContext });
    }

    /**
     * Log debug message
     */
    debug(message: string, additionalContext?: Record<string, unknown>): void {
        log(LogLevel.DEBUG, message, { ...this.context, ...additionalContext });
    }

    /**
     * Log info message
     */
    info(message: string, additionalContext?: Record<string, unknown>): void {
        log(LogLevel.INFO, message, { ...this.context, ...additionalContext });
    }

    /**
     * Log warning message
     */
    warn(message: string, additionalContext?: Record<string, unknown>): void {
        log(LogLevel.WARN, message, { ...this.context, ...additionalContext });
    }

    /**
     * Log error message
     */
    error(message: string, error?: Error, additionalContext?: Record<string, unknown>): void {
        log(LogLevel.ERROR, message, { ...this.context, ...additionalContext }, error);
    }

    /**
     * Log HTTP request
     */
    logRequest(request: {
        method: string;
        url: string;
        headers?: Record<string, string>;
        body?: string;
    }): void {
        this.info(`HTTP Request: ${request.method} ${request.url}`, {
            method: request.method,
            url: request.url,
            hasHeaders: !!request.headers && Object.keys(request.headers).length > 0,
            hasBody: !!request.body && request.body.length > 0,
        });
    }

    /**
     * Log HTTP response
     */
    logResponse(response: {
        status: number;
        statusText: string;
        headers?: Record<string, string>;
        timing?: number;
        size?: number;
    }): void {
        this.info(`HTTP Response: ${response.status} ${response.statusText}`, {
            status: response.status,
            statusText: response.statusText,
            timing: response.timing,
            size: response.size,
        });
    }

    /**
     * Log HTTP error
     */
    logHttpError(error: Error, request: {
        method: string;
        url: string;
    }): void {
        this.error(`HTTP Error: ${request.method} ${request.url}`, error, {
            method: request.method,
            url: request.url,
        });
    }
}

/**
 * Create a default logger instance
 */
export const logger = new Logger();

/**
 * Create a logger with a specific context
 */
export function createLogger(context: Record<string, unknown>): Logger {
    return new Logger(context);
}

/**
 * Convenience functions for direct logging
 */
export const logDebug = (message: string, context?: Record<string, unknown>): void => {
    logger.debug(message, context);
};

export const logInfo = (message: string, context?: Record<string, unknown>): void => {
    logger.info(message, context);
};

export const logWarn = (message: string, context?: Record<string, unknown>): void => {
    logger.warn(message, context);
};

export const logError = (message: string, error?: Error, context?: Record<string, unknown>): void => {
    logger.error(message, error, context);
};

/**
 * Parse log level from string
 */
export function parseLogLevel(level: string): LogLevel {
    const upperLevel = level.toUpperCase();
    switch (upperLevel) {
        case "DEBUG":
            return LogLevel.DEBUG;
        case "INFO":
            return LogLevel.INFO;
        case "WARN":
        case "WARNING":
            return LogLevel.WARN;
        case "ERROR":
            return LogLevel.ERROR;
        default:
            return LogLevel.INFO;
    }
}

/**
 * Initialize logger from environment
 */
export function initializeLoggerFromConfig(): void {
    const logLevelStr = import.meta.env.VITE_LOG_LEVEL;
    if (logLevelStr) {
        const level = parseLogLevel(logLevelStr);
        setLoggerConfig({ level });
    }
}

// Initialize logger on import
initializeLoggerFromConfig();
