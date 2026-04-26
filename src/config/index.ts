/**
 * Bakku Application Configuration
 *
 * This module centralizes all application configuration,
 * with support for environment variable overrides.
 */

/**
 * Get an environment variable with a default value
 */
function getEnvVar(key: string, defaultValue: string): string {
    const value = import.meta.env[key];
    return value ?? defaultValue;
}

/**
 * Get a boolean environment variable
 */
function getEnvBool(key: string, defaultValue: boolean): boolean {
    const value = import.meta.env[key];
    if (value === undefined) return defaultValue;
    return value === "true" || value === "1";
}

/**
 * Get a numeric environment variable
 */
function getEnvNumber(key: string, defaultValue: number): number {
    const value = import.meta.env[key];
    if (value === undefined) return defaultValue;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * API Configuration
 */
export const apiConfig = {
    url: getEnvVar("VITE_API_URL", "http://localhost:3000"),
} as const;

/**
 * Feature Flags
 */
export const featureFlags = {
    requestCaching: getEnvBool("VITE_ENABLE_REQUEST_CACHING", true),
    performanceMonitoring: getEnvBool("VITE_ENABLE_PERFORMANCE_MONITORING", true),
    analytics: getEnvBool("VITE_ANALYTICS_ENABLED", false),
} as const;

/**
 * Cache Configuration
 */
export const cacheConfig = {
    ttlMs: getEnvNumber("VITE_CACHE_TTL_MS", 300000), // 5 minutes default
    requestCaching: getEnvBool("VITE_ENABLE_REQUEST_CACHING", true),
} as const;

/**
 * Request Configuration
 */
export const requestConfig = {
    maxRetries: getEnvNumber("VITE_MAX_RETRIES", 3),
    retryDelayMs: 1000,
    retryBackoffMultiplier: 2,
} as const;

/**
 * Storage Limits
 */
export const storageLimits = {
    maxHistoryItems: getEnvNumber("VITE_MAX_HISTORY_ITEMS", 100),
    maxEnvironments: getEnvNumber("VITE_MAX_ENVIRONMENTS", 50),
    maxVariablesPerEnv: getEnvNumber("VITE_MAX_VARIABLES_PER_ENV", 100),
} as const;

/**
 * Development Settings
 */
export const devConfig = {
    isDevMode: getEnvBool("VITE_DEV_MODE", import.meta.env.DEV),
    logLevel: getEnvVar("VITE_LOG_LEVEL", import.meta.env.DEV ? "debug" : "info"),
} as const;

/**
 * Analytics Configuration (if enabled)
 */
export const analyticsConfig = {
    enabled: featureFlags.analytics,
    key: getEnvVar("VITE_ANALYTICS_KEY", ""),
} as const;

/**
 * Application Metadata
 */
export const appConfig = {
    name: "Bakku",
    version: "0.1.0",
    repository: "https://github.com/acedehra/bakku",
} as const;
