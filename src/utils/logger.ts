// utils/logger.ts - Production-safe logging utility
// In production builds (__DEV__ = false), logs are disabled

const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : true;

export const logger = {
    log: (...args: any[]) => {
        if (isDev) console.log(...args);
    },
    warn: (...args: any[]) => {
        if (isDev) console.warn(...args);
    },
    error: (...args: any[]) => {
        // Errors are always logged for debugging critical issues
        console.error(...args);
    },
    info: (...args: any[]) => {
        if (isDev) console.info(...args);
    },
    debug: (...args: any[]) => {
        if (isDev) console.debug(...args);
    },
};

export default logger;
