import { describe, it, expect } from 'vitest';
import { isCurlCommand, parseCurl, tokenizeShellArgs } from '../curlParser';

describe('curlParser', () => {
  describe('isCurlCommand', () => {
    it('should return true for curl commands', () => {
      expect(isCurlCommand('curl https://example.com')).toBe(true);
      expect(isCurlCommand('curl -X POST https://example.com')).toBe(true);
      expect(isCurlCommand("  curl 'http://api.test' ")).toBe(true);
      expect(isCurlCommand('curl\nhttps://example.com')).toBe(true);
    });

    it('should return false for non-curl strings', () => {
      expect(isCurlCommand('https://example.com')).toBe(false);
      expect(isCurlCommand('get /users')).toBe(false);
      expect(isCurlCommand('')).toBe(false);
    });
  });

  describe('tokenizeShellArgs', () => {
    it('should correctly handle single and double quotes', () => {
      const tokens = tokenizeShellArgs(
        'curl -H \'Content-Type: application/json\' -d "{\\"a\\": 1}"'
      );
      expect(tokens).toEqual(['curl', '-H', 'Content-Type: application/json', '-d', '{"a": 1}']);
    });

    it('should handle line continuations', () => {
      const cmd = `curl 'https://api.example.com' \\\n  -H 'Authorization: Bearer test' \\\n  --data-raw '{"ok":true}'`;
      const tokens = tokenizeShellArgs(cmd);
      expect(tokens).toEqual([
        'curl',
        'https://api.example.com',
        '-H',
        'Authorization: Bearer test',
        '--data-raw',
        '{"ok":true}',
      ]);
    });
  });

  describe('parseCurl', () => {
    it('should parse simple GET request', () => {
      const parsed = parseCurl('curl https://api.example.com/users?page=1');
      expect(parsed).not.toBeNull();
      expect(parsed?.url).toBe('https://api.example.com/users?page=1');
      expect(parsed?.method).toBe('GET');
      expect(parsed?.headers).toEqual([]);
      expect(parsed?.body).toBe('');
      expect(parsed?.auth).toEqual({ type: 'None' });
    });

    it('should parse POST request with headers, body, and Bearer auth', () => {
      const cmd = `curl -X POST https://api.example.com/login \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer secret-token-123" \\
  -d '{"user":"alice"}'`;

      const parsed = parseCurl(cmd);
      expect(parsed).not.toBeNull();
      expect(parsed?.url).toBe('https://api.example.com/login');
      expect(parsed?.method).toBe('POST');
      expect(parsed?.body).toBe('{"user":"alice"}');
      expect(parsed?.auth).toEqual({
        type: 'Bearer',
        token: 'secret-token-123',
      });
      expect(
        parsed?.headers.some((h) => h.key === 'Content-Type' && h.value === 'application/json')
      ).toBe(true);
    });

    it('should infer POST when body is present without explicit -X', () => {
      const cmd = `curl https://api.example.com/items --data '{"name":"item"}'`;
      const parsed = parseCurl(cmd);
      expect(parsed?.method).toBe('POST');
      expect(parsed?.body).toBe('{"name":"item"}');
    });

    it('should parse Basic auth with -u', () => {
      const cmd = `curl -u myuser:mypass https://api.example.com/secret`;
      const parsed = parseCurl(cmd);
      expect(parsed?.auth).toEqual({
        type: 'Basic',
        username: 'myuser',
        password: 'mypass',
      });
    });

    it('should parse cookies and ignore non-parameter flags', () => {
      const cmd = `curl -k -s -L https://api.example.com/secure -b "session=xyz123"`;
      const parsed = parseCurl(cmd);
      expect(parsed?.url).toBe('https://api.example.com/secure');
      expect(parsed?.headers.some((h) => h.key === 'Cookie' && h.value === 'session=xyz123')).toBe(
        true
      );
    });

    it('should return null for invalid curl string', () => {
      expect(parseCurl('not a curl command')).toBeNull();
    });
  });
});
