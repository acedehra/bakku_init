import { useEffect, useState, useCallback } from 'react';
import {
  HttpMethod,
  SavedRequest,
  RequestFolder,
  AuthConfig,
  KVEntry,
  Environment,
} from '../../types';
import { usePanelResize } from '../usePanelResize';
import { useSavedRequests } from '../useSavedRequests';
import { useUrl } from '../useUrlParams';
import { useRequestExecution } from '../useRequestExecution';
import { useSavedRequestsManager } from '../useSavedRequestsManager';
import { useEnvironments } from '../useEnvironments';
import { AppContextValue } from '../../contexts/AppContext';
import { ParsedCurl } from '../../utils/curlParser';

export function useAppState(): AppContextValue {
  // Panel resize state
  const { sidebarWidth, responseWidth, handleSidebarResize, handleResponseResize } =
    usePanelResize();

  // Saved requests state
  const {
    savedRequests,
    folders,
    createRequest,
    updateRequest,
    deleteRequest,
    createFolder,
    updateFolder,
    deleteFolder,
    autoSaveRequest,
    refreshLibrary,
  } = useSavedRequests();

  // URL state
  const { url, setUrl, paramEntries, setParamEntries } = useUrl(
    'https://jsonplaceholder.typicode.com/todos/1'
  );

  // Environment state
  const {
    environments,
    activeEnvId,
    activeEnv,
    setActiveEnvId,
    addEnvironment,
    updateEnvironment,
    deleteEnvironment,
    reloadEnvironments,
  } = useEnvironments();

  // UI state
  const [isEnvManagerOpen, setIsEnvManagerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCurlImportOpen, setIsCurlImportOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  // Request state
  const [method, setMethod] = useState<HttpMethod>('GET');
  const [headers, setHeaders] = useState<KVEntry[]>([]);
  const [body, setBody] = useState('');
  const [auth, setAuth] = useState<AuthConfig>({ type: 'None' });

  // Request execution state
  const { loading, error, response, executeRequest, clearError, clearResponse } =
    useRequestExecution();

  // Saved request selection
  const { selectedSavedRequestId, handleSavedRequestSelect } = useSavedRequestsManager({
    setMethod,
    setUrl,
    setHeaders,
    setBody,
    setAuth,
    clearResponse,
    clearError,
  });

  // Apply dark theme
  useEffect(() => {
    document.documentElement.classList.add('dark');
    return () => {
      document.documentElement.classList.remove('dark');
    };
  }, []);

  // Action handlers
  const handleCreateRequest = useCallback(async () => {
    const newRequest = await createRequest('New Request');
    handleSavedRequestSelect(newRequest);
  }, [createRequest, handleSavedRequestSelect]);

  const handleCreateRequestInFolder = useCallback(
    async (folderId: string) => {
      const newRequest = await createRequest('New Request', folderId);
      handleSavedRequestSelect(newRequest);
      // Auto-expand the folder
      setExpandedFolders((prev) => {
        const next = new Set(prev);
        next.add(folderId);
        return next;
      });
    },
    [createRequest, handleSavedRequestSelect]
  );

  const handleMoveRequestToFolder = useCallback(
    (requestId: string, folderId: string | null) => {
      const request = savedRequests.find((req) => req.id === requestId);
      if (request && request.folderId !== folderId) {
        void updateRequest({ ...request, folderId });
      }
    },
    [savedRequests, updateRequest]
  );

  // Dialog state
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);

  const handleCreateFolder = useCallback(() => {
    setFolderDialogOpen(true);
  }, []);

  const handleConfirmFolderName = useCallback(
    (name: string) => {
      setFolderDialogOpen(false);
      void createFolder(name);
    },
    [createFolder]
  );

  const handleCancelFolderName = useCallback(() => {
    setFolderDialogOpen(false);
  }, []);

  const handleRenameFolder = useCallback(
    (folder: RequestFolder, newName: string) => {
      void updateFolder({ ...folder, name: newName });
    },
    [updateFolder]
  );

  const handleRenameRequest = useCallback(
    (request: SavedRequest, newName: string) => {
      void updateRequest({ ...request, name: newName });
    },
    [updateRequest]
  );

  const handleDeleteRequest = useCallback(
    (id: string) => {
      void deleteRequest(id);
    },
    [deleteRequest]
  );

  const handleDeleteFolder = useCallback(
    (id: string) => {
      void deleteFolder(id);
    },
    [deleteFolder]
  );

  const handleToggleFolder = useCallback((folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  }, []);

  const handleExecuteRequest = useCallback(async () => {
    const responseData = await executeRequest(method, url, headers, body, auth, activeEnv ?? null);

    if (selectedSavedRequestId) {
      if (responseData) {
        await autoSaveRequest(
          selectedSavedRequestId,
          {
            method,
            url,
            headers,
            body,
            auth,
          },
          responseData
        );
      } else {
        await autoSaveRequest(selectedSavedRequestId, {
          method,
          url,
          headers,
          body,
          auth,
        });
      }
    }
  }, [
    method,
    url,
    headers,
    body,
    auth,
    activeEnv,
    selectedSavedRequestId,
    executeRequest,
    autoSaveRequest,
  ]);

  const handleOpenEnvManager = useCallback(() => {
    setIsEnvManagerOpen(true);
  }, []);

  const handleCloseEnvManager = useCallback(() => {
    setIsEnvManagerOpen(false);
  }, []);

  const handleAddEnvironment = useCallback(
    (name: string): Environment => {
      return addEnvironment(name);
    },
    [addEnvironment]
  );

  const handleUpdateEnvironment = useCallback(
    (env: Environment) => {
      updateEnvironment(env);
    },
    [updateEnvironment]
  );

  const handleDeleteEnvironment = useCallback(
    (id: string) => {
      deleteEnvironment(id);
    },
    [deleteEnvironment]
  );

  const handleOpenSettings = useCallback(() => {
    setIsSettingsOpen(true);
  }, []);

  const handleCloseSettings = useCallback(() => {
    setIsSettingsOpen(false);
  }, []);

  const handleSettingsImportSuccess = useCallback(() => {
    void refreshLibrary();
    reloadEnvironments();
  }, [refreshLibrary, reloadEnvironments]);

  const handleOpenCurlImport = useCallback(() => {
    setIsCurlImportOpen(true);
  }, []);

  const handleCloseCurlImport = useCallback(() => {
    setIsCurlImportOpen(false);
  }, []);

  const handleLoadCurlIntoCurrent = useCallback(
    (parsed: ParsedCurl) => {
      setMethod(parsed.method);
      setUrl(parsed.url);
      setHeaders(parsed.headers);
      setBody(parsed.body);
      setAuth(parsed.auth);
    },
    [setMethod, setUrl, setHeaders, setBody, setAuth]
  );

  const handleSaveCurlAsNewRequest = useCallback(
    async (parsed: ParsedCurl, name: string) => {
      const newRequest = await createRequest(name, null, {
        method: parsed.method,
        url: parsed.url,
        headers: parsed.headers,
        body: parsed.body,
        auth: parsed.auth,
      });
      handleSavedRequestSelect(newRequest);
    },
    [createRequest, handleSavedRequestSelect]
  );

  return {
    // State
    method,
    url,
    headers,
    body,
    auth,
    loading,
    error,
    response,
    selectedSavedRequestId,
    activeEnvId,
    searchQuery,
    expandedFolders,
    isEnvManagerOpen,
    isSettingsOpen,
    isCurlImportOpen,
    savedRequests,
    folders,
    environments,
    paramEntries,
    sidebarWidth,
    responseWidth,
    handleSidebarResize,
    handleResponseResize,
    // Actions
    setMethod,
    setUrl,
    setHeaders,
    setBody,
    setAuth,
    setParamEntries,
    executeRequest: handleExecuteRequest,
    clearError,
    clearResponse,
    handleSavedRequestSelect,
    handleCreateRequest,
    handleCreateFolder,
    handleConfirmFolderName,
    handleCancelFolderName,
    handleRenameFolder,
    handleRenameRequest,
    handleDeleteRequest,
    handleDeleteFolder,
    handleToggleFolder,
    handleCreateRequestInFolder,
    handleMoveRequestToFolder,
    setActiveEnvId,
    handleOpenEnvManager,
    handleCloseEnvManager,
    handleUpdateEnvironment,
    handleDeleteEnvironment,
    handleAddEnvironment,
    handleOpenSettings,
    handleCloseSettings,
    handleSettingsImportSuccess,
    handleOpenCurlImport,
    handleCloseCurlImport,
    handleLoadCurlIntoCurrent,
    handleSaveCurlAsNewRequest,
    setSearchQuery,
    // Dialog state
    folderDialogOpen,
    setFolderDialogOpen,
  };
}
