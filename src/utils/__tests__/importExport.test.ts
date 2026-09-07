import { describe, it, expect, beforeEach } from 'vitest';
import {
  validateImportData,
  exportData,
  importData,
  CURRENT_SCHEMA_VERSION,
} from '../importExport';

describe('importExport', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('validateImportData', () => {
    it('should reject non-object data', () => {
      const result = validateImportData('not an object');
      expect(result.isValid).toBe(false);
    });

    it('should validate a valid export payload with collections', () => {
      const valid = {
        version: CURRENT_SCHEMA_VERSION,
        exportedAt: new Date().toISOString(),
        environments: [{ id: 'env-1', name: 'Dev', variables: [] }],
        folders: [{ id: 'f-1', name: 'Folder 1', createdAt: 1, updatedAt: 1 }],
        requests: [
          {
            id: 'r-1',
            name: 'Req 1',
            method: 'GET',
            url: 'https://example.com',
            headers: [],
            body: '',
            auth: { type: 'None' },
            folderId: 'f-1',
            createdAt: 1,
            updatedAt: 1,
          },
        ],
      };

      const result = validateImportData(valid);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });

  describe('exportData and importData', () => {
    it('should export and import environments and history in localStorage mode', async () => {
      localStorage.setItem(
        'bakku_environments',
        JSON.stringify([{ id: 'env-1', name: 'Test Env', variables: [] }])
      );

      const exportedJson = await exportData({ includeCollections: false });
      const parsed = JSON.parse(exportedJson);
      expect(parsed.version).toBe(CURRENT_SCHEMA_VERSION);
      expect(parsed.environments).toHaveLength(1);

      localStorage.clear();

      const importResult = await importData(exportedJson);
      expect(importResult.success).toBe(true);
      expect(importResult.imported.environments).toBe(1);

      const storedEnvs = JSON.parse(localStorage.getItem('bakku_environments') || '[]');
      expect(storedEnvs).toHaveLength(1);
      expect(storedEnvs[0].name).toBe('Test Env');
    });
  });
});
