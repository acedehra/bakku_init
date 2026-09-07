/**
 * cURL Command Parser
 *
 * Parses cURL command lines into structured request data:
 * Method, URL, Query Params, Headers, Auth, and Body.
 */

import { HttpMethod, AuthConfig, KVEntry } from '../types';

export interface ParsedCurl {
  url: string;
  method: HttpMethod;
  headers: KVEntry[];
  body: string;
  auth: AuthConfig;
}

/**
 * Tokenize a shell command line respecting single and double quotes and escaped characters.
 */
export function tokenizeShellArgs(command: string): string[] {
  // Remove line continuations (backslash at end of line)
  const cleaned = command.replace(/\\\r?\n/g, ' ');

  const tokens: string[] = [];
  let current = '';
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let isEscaped = false;

  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i];

    if (isEscaped) {
      current += char;
      isEscaped = false;
      continue;
    }

    if (char === '\\') {
      if (inSingleQuote) {
        current += char;
      } else {
        isEscaped = true;
      }
      continue;
    }

    if (char === "'" && !inDoubleQuote) {
      inSingleQuote = !inSingleQuote;
      continue;
    }

    if (char === '"' && !inSingleQuote) {
      inDoubleQuote = !inDoubleQuote;
      continue;
    }

    if (/\s/.test(char) && !inSingleQuote && !inDoubleQuote) {
      if (current.length > 0) {
        tokens.push(current);
        current = '';
      }
      continue;
    }

    current += char;
  }

  if (current.length > 0) {
    tokens.push(current);
  }

  return tokens;
}

/**
 * Detect whether a given string is a cURL command.
 */
export function isCurlCommand(text: string): boolean {
  if (!text) return false;
  const trimmed = text.trim();
  return /^curl(\s|\r|\n|$)/i.test(trimmed);
}

/**
 * Parse a cURL command string into structured request components.
 */
export function parseCurl(command: string): ParsedCurl | null {
  if (!isCurlCommand(command)) {
    return null;
  }

  const tokens = tokenizeShellArgs(command);
  if (tokens.length === 0) return null;

  // First token should be 'curl'
  if (tokens[0].toLowerCase() !== 'curl') {
    return null;
  }

  let method: HttpMethod | null = null;
  let url = '';
  const headers: KVEntry[] = [];
  const bodyParts: string[] = [];
  let auth: AuthConfig = { type: 'None' };

  for (let i = 1; i < tokens.length; i++) {
    const token = tokens[i];

    // Method flags
    if (token === '-X' || token === '--request') {
      const next = tokens[++i];
      if (next) {
        const upper = next.toUpperCase();
        if (['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD'].includes(upper)) {
          method = upper as HttpMethod;
        }
      }
      continue;
    }

    // URL flag
    if (token === '--url') {
      const next = tokens[++i];
      if (next) url = next;
      continue;
    }

    // Header flags
    if (token === '-H' || token === '--header') {
      const next = tokens[++i];
      if (next) {
        const colonIndex = next.indexOf(':');
        if (colonIndex !== -1) {
          const key = next.slice(0, colonIndex).trim();
          const value = next.slice(colonIndex + 1).trim();

          // Check for Authorization header
          if (key.toLowerCase() === 'authorization') {
            if (value.toLowerCase().startsWith('bearer ')) {
              auth = {
                type: 'Bearer',
                token: value.slice(7).trim(),
              };
            } else if (value.toLowerCase().startsWith('basic ')) {
              try {
                const decoded = atob(value.slice(6).trim());
                const [u, ...p] = decoded.split(':');
                auth = {
                  type: 'Basic',
                  username: u || '',
                  password: p.join(':') || '',
                };
              } catch {
                // fallback to custom header
              }
            }
          }

          headers.push({
            id: `h-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            key,
            value,
            enabled: true,
          });
        }
      }
      continue;
    }

    // User / Basic auth flag
    if (token === '-u' || token === '--user') {
      const next = tokens[++i];
      if (next) {
        const [username, ...passParts] = next.split(':');
        auth = {
          type: 'Basic',
          username: username || '',
          password: passParts.join(':') || '',
        };
      }
      continue;
    }

    // Cookie flag
    if (token === '-b' || token === '--cookie') {
      const next = tokens[++i];
      if (next) {
        headers.push({
          id: `h-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          key: 'Cookie',
          value: next,
          enabled: true,
        });
      }
      continue;
    }

    // Data / Body flags
    if (
      token === '-d' ||
      token === '--data' ||
      token === '--data-raw' ||
      token === '--data-binary' ||
      token === '--data-ascii'
    ) {
      const next = tokens[++i];
      if (next !== undefined) {
        bodyParts.push(next);
      }
      continue;
    }

    // Ignore common flags that don't change request parameters
    if (
      token === '-k' ||
      token === '--insecure' ||
      token === '-L' ||
      token === '--location' ||
      token === '-s' ||
      token === '--silent' ||
      token === '-v' ||
      token === '--verbose' ||
      token === '--compressed' ||
      token === '-i' ||
      token === '--include'
    ) {
      continue;
    }

    // Any other non-flag token starting with http or plausible URL
    if (!token.startsWith('-') && !url) {
      url = token;
    }
  }

  const body = bodyParts.join('&');

  // If method was not explicitly defined via -X / --request:
  // Default to POST if body is provided, otherwise GET
  if (!method) {
    method = body ? 'POST' : 'GET';
  }

  return {
    url,
    method,
    headers,
    body,
    auth,
  };
}
