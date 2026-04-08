import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import { AuthConfig, HttpMethod, ResponseData, Environment } from "../types";

export const substituteVariables = (
    text: string,
    environment: Environment | null
): string => {
    if (!environment || !text) return text;

    let result = text;
    environment.variables.forEach((v) => {
        if (v.enabled && v.key) {
            // Escape special regex characters in the key
            const escapedKey = v.key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`{{${escapedKey}}}`, "g");
            result = result.replace(regex, v.value);
        }
    });
    return result;
};

export const buildAuthHeaders = (authConfig: AuthConfig, activeEnv: Environment | null = null): Record<string, string> => {
    const authHeaders: Record<string, string> = {};
    if (authConfig.type === "Basic" && authConfig.username && authConfig.password) {
        const substitutedUsername = substituteVariables(authConfig.username, activeEnv);
        const substitutedPassword = substituteVariables(authConfig.password, activeEnv);
        const credentials = btoa(`${substitutedUsername}:${substitutedPassword}`);
        authHeaders["Authorization"] = `Basic ${credentials}`;
    } else if (authConfig.type === "Bearer" && authConfig.token) {
        const substitutedToken = substituteVariables(authConfig.token, activeEnv);
        authHeaders["Authorization"] = `Bearer ${substitutedToken}`;
    } else if (
        authConfig.type === "Custom" &&
        authConfig.headerName &&
        authConfig.headerValue
    ) {
        const substitutedHeaderName = substituteVariables(authConfig.headerName, activeEnv);
        const substitutedHeaderValue = substituteVariables(authConfig.headerValue, activeEnv);
        authHeaders[substitutedHeaderName] = substitutedHeaderValue;
    }
    return authHeaders;
};

export async function executeHttpRequest(
    method: HttpMethod,
    url: string,
    headers: Record<string, string>,
    body: string,
    auth: AuthConfig,
    activeEnv: Environment | null = null
): Promise<ResponseData> {
    const startTime = performance.now();

    const substitutedUrl = substituteVariables(url, activeEnv);
    const substitutedBody = substituteVariables(body, activeEnv);

    // Validate URL format before making the request
    try {
        new URL(substitutedUrl);
    } catch {
        throw new Error("Invalid URL format. Please enter a valid URL (e.g., https://example.com)");
    }

    const substitutedHeaders: Record<string, string> = {};
    Object.entries(headers).forEach(([key, value]) => {
        substitutedHeaders[substituteVariables(key, activeEnv)] = substituteVariables(value, activeEnv);
    });

    const authHeaders = buildAuthHeaders(auth, activeEnv);

    const allHeaders = { ...substitutedHeaders, ...authHeaders };

    const options: {
        method: string;
        headers?: Record<string, string>;
        body?: string;
    } = { method };

    if (Object.keys(allHeaders).length > 0) {
        options.headers = allHeaders;
    }

    const canHaveBody = method !== "GET" && method !== "HEAD";
    if (canHaveBody && substitutedBody.trim()) {
        options.body = substitutedBody;
        if (!options.headers) {
            options.headers = {};
        }
        if (!options.headers["Content-Type"]) {
            options.headers["Content-Type"] = "application/json";
        }
    }

    const res = await tauriFetch(substitutedUrl, options);
    const endTime = performance.now();
    const timing = endTime - startTime;

    const contentType = res.headers.get("content-type") ?? "";
    const text = await res.text();
    const responseSize = new Blob([text]).size;

    // Convert response headers to object
    const responseHeaders: Record<string, string> = {};
    res.headers.forEach((value, key) => {
        responseHeaders[key] = value;
    });

    // Format response body
    let formattedBody = text;
    if (contentType.includes("application/json")) {
        try {
            const json = text ? JSON.parse(text) : null;
            formattedBody =
                json !== null ? JSON.stringify(json, null, 2) : "(empty JSON)";
        } catch {
            formattedBody = text || "(empty response)";
        }
    } else {
        formattedBody = text || "(empty response)";
    }

    return {
        status: res.status,
        statusText: res.statusText,
        headers: responseHeaders,
        body: formattedBody,
        timing,
        size: responseSize,
    };
}

export function formatError(err: unknown): string {
    if (err instanceof Error) {
        const message = err.message.toLowerCase();

        // Check for DNS/domain resolution errors
        if (
            message.includes("failed to resolve") ||
            message.includes("name resolution") ||
            message.includes("dns") ||
            message.includes("not found") ||
            message.includes("no such host") ||
            message.includes("cannot resolve")
        ) {
            return `Domain not found: Unable to resolve the domain name. Please check if the URL is correct.`;
        }
        // Check for invalid URL errors
        else if (
            message.includes("invalid url") ||
            message.includes("invalid uri") ||
            message.includes("parse error")
        ) {
            return `Invalid URL: The URL format is incorrect. Please check the URL and try again.`;
        }
        // Check for connection errors
        else if (
            message.includes("connection") ||
            message.includes("timeout") ||
            message.includes("network")
        ) {
            return `Connection error: ${err.message}`;
        }
        // Check for SSL/TLS errors
        else if (
            message.includes("ssl") ||
            message.includes("tls") ||
            message.includes("certificate")
        ) {
            return `SSL/TLS error: ${err.message}`;
        }
        // Use the original error message if it's descriptive
        else if (err.message && err.message.trim() !== "") {
            return err.message;
        }
    } else if (typeof err === "string") {
        return err;
    }
    return "Unknown error";
}
