import { useState, useEffect } from "react";
import { SavedRequest, RequestFolder, HttpMethod, AuthConfig } from "../types";
import { SAVED_REQUESTS_STORAGE_KEY } from "../constants";
import { HISTORY_STORAGE_KEY } from "../constants";
import { RequestHistoryItem } from "../types";

export function useSavedRequests() {
  const [savedRequests, setSavedRequests] = useState<SavedRequest[]>([]);
  const [folders, setFolders] = useState<RequestFolder[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SAVED_REQUESTS_STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored) as { requests: SavedRequest[]; folders: RequestFolder[] };
        setSavedRequests(data.requests || []);
        setFolders(data.folders || []);
      } else {
        // Migration: if no saved requests exist but history does, migrate it
        migrateHistoryToSavedRequests();
      }
    } catch (err) {
      console.error("Failed to load saved requests from localStorage", err);
    }
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    try {
      localStorage.setItem(
        SAVED_REQUESTS_STORAGE_KEY,
        JSON.stringify({ requests: savedRequests, folders })
      );
    } catch (err) {
      console.error("Failed to save saved requests to localStorage", err);
    }
  }, [savedRequests, folders]);

  const migrateHistoryToSavedRequests = () => {
    try {
      const storedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (storedHistory) {
        const history = JSON.parse(storedHistory) as RequestHistoryItem[];
        if (history.length > 0) {
          // Create a "Migrated History" folder
          const folder: RequestFolder = {
            id: `folder-${Date.now()}`,
            name: "Migrated History",
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };

          // Convert history items to saved requests
          const requests: SavedRequest[] = history
            .slice()
            .reverse()
            .map((item) => ({
              id: `saved-${item.id}`,
              name: `${item.method} ${new Date(item.timestamp).toLocaleString()}`,
              method: item.method,
              url: item.requestData.url,
              headers: item.requestData.headers,
              params: item.requestData.params,
              body: item.requestData.body,
              auth: item.requestData.auth,
              folderId: folder.id,
              createdAt: item.timestamp,
              updatedAt: item.timestamp,
            }));

          setFolders([folder]);
          setSavedRequests(requests);
        }
      }
    } catch (err) {
      console.error("Failed to migrate history to saved requests", err);
    }
  };

  const createRequest = (name: string, folderId: string | null = null): SavedRequest => {
    const newRequest: SavedRequest = {
      id: `saved-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name,
      method: "GET",
      url: "",
      headers: {},
      params: {},
      body: "",
      auth: { type: "None" },
      folderId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setSavedRequests((prev) => [...prev, newRequest]);
    return newRequest;
  };

  const updateRequest = (updatedRequest: SavedRequest) => {
    setSavedRequests((prev) =>
      prev.map((req) => (req.id === updatedRequest.id ? { ...updatedRequest, updatedAt: Date.now() } : req))
    );
  };

  const deleteRequest = (id: string) => {
    setSavedRequests((prev) => prev.filter((req) => req.id !== id));
  };

  const createFolder = (name: string): RequestFolder => {
    const newFolder: RequestFolder = {
      id: `folder-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setFolders((prev) => [...prev, newFolder]);
    return newFolder;
  };

  const updateFolder = (updatedFolder: RequestFolder) => {
    setFolders((prev) =>
      prev.map((folder) =>
        folder.id === updatedFolder.id ? { ...updatedFolder, updatedAt: Date.now() } : folder
      )
    );
  };

  const deleteFolder = (id: string) => {
    setFolders((prev) => prev.filter((folder) => folder.id !== id));
    // Also remove or unassign all requests in this folder
    setSavedRequests((prev) =>
      prev.map((req) => (req.folderId === id ? { ...req, folderId: null } : req))
    );
  };

  const getRequestById = (id: string): SavedRequest | undefined => {
    return savedRequests.find((req) => req.id === id);
  };

  const autoSaveRequest = (
    id: string,
    data: {
      method: HttpMethod;
      url: string;
      headers: Record<string, string>;
      params: Record<string, string>;
      body: string;
      auth: AuthConfig;
    }
  ) => {
    const existingRequest = getRequestById(id);
    if (existingRequest) {
      updateRequest({
        ...existingRequest,
        ...data,
        updatedAt: Date.now(),
      });
    }
  };

  return {
    savedRequests,
    folders,
    createRequest,
    updateRequest,
    deleteRequest,
    createFolder,
    updateFolder,
    deleteFolder,
    getRequestById,
    autoSaveRequest,
  };
}
