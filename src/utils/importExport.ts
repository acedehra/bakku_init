/**
 * Import/Export Utilities
 *
 * Provides functionality to export and import application data
 * including collections (saved requests & folders), environments, and request history.
 */

import { isTauri } from '@tauri-apps/api/core';
import * as savedLibrary from '../api/savedLibrary';
import { Environment, RequestHistoryItem, RequestFolder, SavedRequest } from '../types';
import {
  ENVIRONMENTS_STORAGE_KEY,
  HISTORY_STORAGE_KEY,
  ACTIVE_ENV_ID_STORAGE_KEY,
  PANEL_WIDTHS_STORAGE_KEY,
  SAVED_REQUESTS_STORAGE_KEY,
} from '../constants';

/**
 * Export data structure
 */
export interface ExportData {
  version: string;
  exportedAt: string;
  environments?: Environment[];
  history?: RequestHistoryItem[];
  folders?: RequestFolder[];
  requests?: SavedRequest[];
}

/**
 * Export options
 */
export interface ExportOptions {
  includeEnvironments?: boolean;
  includeHistory?: boolean;
  includeCollections?: boolean;
}

/**
 * Import result
 */
export interface ImportResult {
  success: boolean;
  message: string;
  imported: {
    environments: number;
    historyItems: number;
    folders: number;
    requests: number;
  };
}

/**
 * Validation result for import data
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Current export schema version
 */
export const CURRENT_SCHEMA_VERSION = '1.0.0';

/**
 * Validate import data structure
 */
export function validateImportData(data: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if data is an object
  if (typeof data !== 'object' || data === null) {
    return {
      isValid: false,
      errors: ['Import data must be a valid object'],
      warnings: [],
    };
  }

  const importData = data as Record<string, unknown>;

  // Check version
  if (!importData.version || typeof importData.version !== 'string') {
    errors.push('Missing or invalid version');
  } else if (importData.version !== CURRENT_SCHEMA_VERSION) {
    warnings.push(
      `Import data version ${importData.version} differs from current version ${CURRENT_SCHEMA_VERSION}`
    );
  }

  // Check exportedAt
  if (!importData.exportedAt || typeof importData.exportedAt !== 'string') {
    errors.push('Missing or invalid exportedAt timestamp');
  }

  // Validate environments if present
  if (importData.environments) {
    if (!Array.isArray(importData.environments)) {
      errors.push('Environments must be an array');
    } else {
      importData.environments.forEach((env: unknown, index: number) => {
        if (typeof env !== 'object' || env === null) {
          errors.push(`Environment at index ${index} is invalid`);
        } else {
          const envObj = env as Record<string, unknown>;
          if (!envObj.id || typeof envObj.id !== 'string') {
            errors.push(`Environment at index ${index} missing id`);
          }
          if (!envObj.name || typeof envObj.name !== 'string') {
            errors.push(`Environment at index ${index} missing name`);
          }
          if (!Array.isArray(envObj.variables)) {
            errors.push(`Environment at index ${index} has invalid variables`);
          }
        }
      });
    }
  }

  // Validate history if present
  if (importData.history) {
    if (!Array.isArray(importData.history)) {
      errors.push('History must be an array');
    } else {
      importData.history.forEach((item: unknown, index: number) => {
        if (typeof item !== 'object' || item === null) {
          errors.push(`History item at index ${index} is invalid`);
        } else {
          const itemObj = item as Record<string, unknown>;
          if (!itemObj.id || typeof itemObj.id !== 'string') {
            errors.push(`History item at index ${index} missing id`);
          }
          if (!itemObj.method || typeof itemObj.method !== 'string') {
            errors.push(`History item at index ${index} missing method`);
          }
          if (!itemObj.url || typeof itemObj.url !== 'string') {
            errors.push(`History item at index ${index} missing url`);
          }
        }
      });
    }
  }

  // Validate folders if present
  if (importData.folders) {
    if (!Array.isArray(importData.folders)) {
      errors.push('Folders must be an array');
    } else {
      importData.folders.forEach((folder: unknown, index: number) => {
        if (typeof folder !== 'object' || folder === null) {
          errors.push(`Folder at index ${index} is invalid`);
        } else {
          const folderObj = folder as Record<string, unknown>;
          if (!folderObj.id || typeof folderObj.id !== 'string') {
            errors.push(`Folder at index ${index} missing id`);
          }
          if (!folderObj.name || typeof folderObj.name !== 'string') {
            errors.push(`Folder at index ${index} missing name`);
          }
        }
      });
    }
  }

  // Validate requests if present
  if (importData.requests) {
    if (!Array.isArray(importData.requests)) {
      errors.push('Requests must be an array');
    } else {
      importData.requests.forEach((req: unknown, index: number) => {
        if (typeof req !== 'object' || req === null) {
          errors.push(`Request at index ${index} is invalid`);
        } else {
          const reqObj = req as Record<string, unknown>;
          if (!reqObj.id || typeof reqObj.id !== 'string') {
            errors.push(`Request at index ${index} missing id`);
          }
          if (!reqObj.name || typeof reqObj.name !== 'string') {
            errors.push(`Request at index ${index} missing name`);
          }
          if (!reqObj.method || typeof reqObj.method !== 'string') {
            errors.push(`Request at index ${index} missing method`);
          }
        }
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Export application data to JSON string
 */
export async function exportData(options: ExportOptions = {}): Promise<string> {
  const exportPayload: ExportData = {
    version: CURRENT_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
  };

  // Export environments
  if (options.includeEnvironments !== false) {
    try {
      const envData = localStorage.getItem(ENVIRONMENTS_STORAGE_KEY);
      if (envData) {
        exportPayload.environments = JSON.parse(envData);
      }
    } catch (error) {
      console.error('Failed to export environments:', error);
    }
  }

  // Export history
  if (options.includeHistory !== false) {
    try {
      const historyData = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (historyData) {
        exportPayload.history = JSON.parse(historyData);
      }
    } catch (error) {
      console.error('Failed to export history:', error);
    }
  }

  // Export collections (folders & saved requests)
  if (options.includeCollections !== false) {
    try {
      if (isTauri()) {
        const lib = await savedLibrary.getLibrary();
        exportPayload.folders = lib.folders;
        exportPayload.requests = lib.requests;
      } else {
        const stored = localStorage.getItem(SAVED_REQUESTS_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          exportPayload.folders = parsed.folders || [];
          exportPayload.requests = parsed.requests || [];
        }
      }
    } catch (error) {
      console.error('Failed to export collections:', error);
    }
  }

  return JSON.stringify(exportPayload, null, 2);
}

/**
 * Download export data as a file
 */
export function downloadExport(data: string, filename?: string): void {
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `bakku-export-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export and download application data
 */
export async function exportAndDownload(
  options: ExportOptions = {},
  filename?: string
): Promise<void> {
  try {
    const data = await exportData(options);
    downloadExport(data, filename);
  } catch (error) {
    console.error('Failed to export data:', error);
    throw new Error('Failed to export data. Please try again.');
  }
}

/**
 * Import data from JSON string
 */
export async function importData(
  jsonString: string,
  options: {
    overwriteEnvironments?: boolean;
    overwriteHistory?: boolean;
    overwriteCollections?: boolean;
  } = {}
): Promise<ImportResult> {
  try {
    const data = JSON.parse(jsonString);
    const validation = validateImportData(data);
    if (!validation.isValid) {
      return {
        success: false,
        message: `Invalid import data: ${validation.errors.join(', ')}`,
        imported: {
          environments: 0,
          historyItems: 0,
          folders: 0,
          requests: 0,
        },
      };
    }

    const importPayload = data as ExportData;
    let importedEnvironments = 0;
    let importedHistoryItems = 0;
    let importedFolders = 0;
    let importedRequests = 0;

    // Import environments
    if (importPayload.environments && options.overwriteEnvironments !== false) {
      try {
        const envsWithNewIds = importPayload.environments.map((env) => ({
          ...env,
          id: `env-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        }));

        localStorage.setItem(ENVIRONMENTS_STORAGE_KEY, JSON.stringify(envsWithNewIds));
        importedEnvironments = envsWithNewIds.length;
      } catch (error) {
        console.error('Failed to import environments:', error);
      }
    }

    // Import history
    if (importPayload.history && options.overwriteHistory !== false) {
      try {
        const historyWithNewIds = importPayload.history.map((item) => ({
          ...item,
          id: `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        }));

        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(historyWithNewIds));
        importedHistoryItems = historyWithNewIds.length;
      } catch (error) {
        console.error('Failed to import history:', error);
      }
    }

    // Import collections (folders & saved requests)
    if (
      (importPayload.folders || importPayload.requests) &&
      options.overwriteCollections !== false
    ) {
      const foldersToImport = importPayload.folders || [];
      const requestsToImport = importPayload.requests || [];

      try {
        if (isTauri()) {
          await savedLibrary.importLibrary(foldersToImport, requestsToImport);
        } else {
          const stored = localStorage.getItem(SAVED_REQUESTS_STORAGE_KEY);
          let currentFolders: RequestFolder[] = [];
          let currentRequests: SavedRequest[] = [];
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              currentFolders = parsed.folders || [];
              currentRequests = parsed.requests || [];
            } catch {
              // ignore parse error
            }
          }
          localStorage.setItem(
            SAVED_REQUESTS_STORAGE_KEY,
            JSON.stringify({
              folders: [...currentFolders, ...foldersToImport],
              requests: [...currentRequests, ...requestsToImport],
            })
          );
        }
        importedFolders = foldersToImport.length;
        importedRequests = requestsToImport.length;
      } catch (error) {
        console.error('Failed to import collections:', error);
      }
    }

    const messageParts = [];
    if (importedCollectionsCount(importedFolders, importedRequests)) {
      messageParts.push(`${importedFolders} folders, ${importedRequests} requests`);
    }
    if (importedEnvironments) {
      messageParts.push(`${importedEnvironments} environments`);
    }
    if (importedHistoryItems) {
      messageParts.push(`${importedHistoryItems} history items`);
    }

    const summary = messageParts.length > 0 ? messageParts.join(', ') : '0 items';

    return {
      success: true,
      message: `Successfully imported ${summary}`,
      imported: {
        environments: importedEnvironments,
        historyItems: importedHistoryItems,
        folders: importedFolders,
        requests: importedRequests,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to parse import data: ${error instanceof Error ? error.message : 'Unknown error'}`,
      imported: {
        environments: 0,
        historyItems: 0,
        folders: 0,
        requests: 0,
      },
    };
  }
}

function importedCollectionsCount(folders: number, requests: number): boolean {
  return folders > 0 || requests > 0;
}

/**
 * Read and import data from a file
 */
export function importFromFile(
  file: File,
  options?: {
    overwriteEnvironments?: boolean;
    overwriteHistory?: boolean;
    overwriteCollections?: boolean;
  }
): Promise<ImportResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const jsonString = event.target?.result as string;
        const result = await importData(jsonString, options);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
}

/**
 * Trigger file picker for import
 */
export function triggerFileImport(
  onImport: (result: ImportResult) => void,
  options?: {
    overwriteEnvironments?: boolean;
    overwriteHistory?: boolean;
    overwriteCollections?: boolean;
  }
): void {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';

  input.onchange = async (event) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      try {
        const result = await importFromFile(file, options);
        onImport(result);
      } catch (error) {
        onImport({
          success: false,
          message: `Failed to import file: ${error instanceof Error ? error.message : 'Unknown error'}`,
          imported: {
            environments: 0,
            historyItems: 0,
            folders: 0,
            requests: 0,
          },
        });
      }
    }
  };

  input.click();
}

/**
 * Export environments only
 */
export async function exportEnvironments(): Promise<void> {
  await exportAndDownload(
    { includeEnvironments: true, includeHistory: false, includeCollections: false },
    `bakku-environments-${new Date().toISOString().split('T')[0]}.json`
  );
}

/**
 * Export history only
 */
export async function exportHistory(): Promise<void> {
  await exportAndDownload(
    { includeEnvironments: false, includeHistory: true, includeCollections: false },
    `bakku-history-${new Date().toISOString().split('T')[0]}.json`
  );
}

/**
 * Export collections only (folders and saved requests)
 */
export async function exportCollections(): Promise<void> {
  await exportAndDownload(
    { includeEnvironments: false, includeHistory: false, includeCollections: true },
    `bakku-collections-${new Date().toISOString().split('T')[0]}.json`
  );
}

/**
 * Export everything (environments, collections, history)
 */
export async function exportAll(): Promise<void> {
  await exportAndDownload(
    { includeEnvironments: true, includeHistory: true, includeCollections: true },
    `bakku-all-${new Date().toISOString().split('T')[0]}.json`
  );
}

/**
 * Clear all data from localStorage
 */
export function clearAllData(): void {
  localStorage.removeItem(ENVIRONMENTS_STORAGE_KEY);
  localStorage.removeItem(HISTORY_STORAGE_KEY);
  localStorage.removeItem(ACTIVE_ENV_ID_STORAGE_KEY);
  localStorage.removeItem(PANEL_WIDTHS_STORAGE_KEY);
  localStorage.removeItem(SAVED_REQUESTS_STORAGE_KEY);
}
