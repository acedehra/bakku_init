import { useState, useMemo, useRef, useEffect } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { SavedRequest, RequestFolder, HttpMethod } from "../types";

interface SavedRequestsSidebarProps {
  savedRequests: SavedRequest[];
  folders: RequestFolder[];
  selectedRequestId: string | null;
  expandedFolders: Set<string>;
  searchQuery: string;
  onSelectRequest: (request: SavedRequest) => void;
  onCreateRequest: () => void;
  onCreateFolder: () => void;
  onDeleteRequest: (id: string) => void;
  onDeleteFolder: (id: string) => void;
  onToggleFolder: (folderId: string) => void;
  onSearchChange: (query: string) => void;
  onRenameFolder?: (folder: RequestFolder, newName: string) => void;
  onRenameRequest?: (request: SavedRequest, newName: string) => void;
}

export function SavedRequestsSidebar({
  savedRequests,
  folders,
  selectedRequestId,
  expandedFolders,
  searchQuery,
  onSelectRequest,
  onCreateRequest,
  onCreateFolder,
  onDeleteRequest,
  onDeleteFolder,
  onToggleFolder,
  onSearchChange,
  onRenameFolder,
  onRenameRequest,
}: SavedRequestsSidebarProps) {
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const createMenuRef = useRef<HTMLDivElement>(null);
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const [renamingRequestId, setRenamingRequestId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  useEffect(() => {
    if (!createMenuOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (createMenuRef.current?.contains(e.target as Node)) return;
      setCreateMenuOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCreateMenuOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [createMenuOpen]);

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) {
      return { folders, requests: savedRequests };
    }

    const query = searchQuery.toLowerCase();
    const filteredRequests = savedRequests.filter(
      (req) =>
        req.name.toLowerCase().includes(query) ||
        req.url.toLowerCase().includes(query) ||
        req.method.toLowerCase().includes(query)
    );

    const folderIdsWithMatches = new Set(filteredRequests.map((req) => req.folderId).filter(Boolean) as string[]);
    const filteredFolders = folders.filter((folder) =>
      folder.name.toLowerCase().includes(query) || folderIdsWithMatches.has(folder.id)
    );

    return { folders: filteredFolders, requests: filteredRequests };
  }, [savedRequests, folders, searchQuery]);

  const getMethodColor = (method: HttpMethod) => {
    switch (method) {
      case "GET":
        return "text-green-500";
      case "POST":
        return "text-blue-500";
      case "PUT":
        return "text-yellow-500";
      case "PATCH":
        return "text-orange-500";
      case "DELETE":
        return "text-red-500";
      case "HEAD":
        return "text-purple-500";
      default:
        return "text-muted-foreground";
    }
  };

  const truncateName = (name: string, maxLength: number = 25) => {
    if (name.length <= maxLength) return name;
    return name.substring(0, maxLength) + "...";
  };

  const handleStartRenameFolder = (folder: RequestFolder, e: React.MouseEvent) => {
    e.stopPropagation();
    setRenamingFolderId(folder.id);
    setRenameValue(folder.name);
  };

  const handleStartRenameRequest = (request: SavedRequest, e: React.MouseEvent) => {
    e.stopPropagation();
    setRenamingRequestId(request.id);
    setRenameValue(request.name);
  };

  const handleSaveRename = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && renameValue.trim()) {
      if (renamingFolderId && onRenameFolder) {
        const folder = folders.find((f) => f.id === renamingFolderId);
        if (folder) {
          onRenameFolder(folder, renameValue.trim());
        }
      } else if (renamingRequestId && onRenameRequest) {
        const request = savedRequests.find((r) => r.id === renamingRequestId);
        if (request) {
          onRenameRequest(request, renameValue.trim());
        }
      }
      setRenamingFolderId(null);
      setRenamingRequestId(null);
      setRenameValue("");
    } else if (e.key === "Escape") {
      setRenamingFolderId(null);
      setRenamingRequestId(null);
      setRenameValue("");
    }
  };

  const handleBlurRename = () => {
    setTimeout(() => {
      setRenamingFolderId(null);
      setRenamingRequestId(null);
      setRenameValue("");
    }, 100);
  };

  const handleDeleteFolder = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Delete this folder and move all its requests to root?")) {
      onDeleteFolder(id);
    }
  };

  const handleDeleteRequest = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Delete this request?")) {
      onDeleteRequest(id);
    }
  };

  return (
    <div className="w-full h-screen flex flex-col bg-background border-r border-border">
      {/* Search */}
      <div className="p-3 border-b border-border">
        <input
          type="text"
          placeholder="Search requests..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full h-8 px-2 rounded-md border border-input bg-background text-foreground text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {/* Create menu (+) */}
      <div ref={createMenuRef} className="relative border-b border-border p-2">
        <button
          type="button"
          onClick={() => setCreateMenuOpen((open) => !open)}
          aria-expanded={createMenuOpen}
          aria-haspopup="menu"
          aria-label="Create new"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border/50 bg-background text-foreground transition-colors hover:bg-primary/5 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Plus className="size-4 shrink-0 text-foreground" strokeWidth={2} aria-hidden />
        </button>
        {createMenuOpen && (
          <div
            role="menu"
            className="absolute left-2 top-full z-50 mt-1 min-w-[11rem] overflow-hidden rounded-md border border-border bg-popover py-1 text-sm text-popover-foreground shadow-md"
          >
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-accent hover:text-accent-foreground"
              onClick={() => {
                setCreateMenuOpen(false);
                onCreateRequest();
              }}
            >
              <span className="flex w-4 shrink-0 justify-center font-light text-muted-foreground" aria-hidden>
                +
              </span>
              Request
            </button>
            <div className="my-1 h-px bg-border" role="separator" />
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-accent hover:text-accent-foreground"
              onClick={() => {
                setCreateMenuOpen(false);
                onCreateFolder();
              }}
            >
              <span className="flex w-4 shrink-0 justify-center font-light text-muted-foreground" aria-hidden>
                +
              </span>
              Folder
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {filteredData.requests.length === 0 && filteredData.folders.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            {searchQuery ? "No results found" : "No saved requests yet"}
          </div>
        ) : (
          <div className="p-2">
            {/* Render folders */}
            {filteredData.folders.map((folder) => (
              <div key={folder.id} className="mb-1">
                {/* Folder header */}
                <div
                  className="flex items-center gap-1 p-1 rounded-md hover:bg-accent/30 cursor-pointer group"
                  onClick={() => onToggleFolder(folder.id)}
                >
                  <span className="text-xs text-muted-foreground w-4">
                    {expandedFolders.has(folder.id) ? "▼" : "▶"}
                  </span>
                  {renamingFolderId === folder.id ? (
                    <input
                      type="text"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={handleSaveRename}
                      onBlur={handleBlurRename}
                      onClick={(e) => e.stopPropagation()}
                      autoFocus
                      className="flex-1 h-6 px-1 text-xs bg-background border border-input rounded focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  ) : (
                    <>
                      <span className="text-xs font-medium text-foreground flex-1 truncate">
                        📁 {truncateName(folder.name)}
                      </span>
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {onRenameFolder && (
                          <button
                            type="button"
                            onClick={(e) => handleStartRenameFolder(folder, e)}
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            title="Rename"
                          >
                            <Pencil className="size-4 shrink-0" strokeWidth={2} aria-hidden />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => handleDeleteFolder(folder.id, e)}
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          title="Delete"
                        >
                          <Trash2 className="size-4 shrink-0" strokeWidth={2} aria-hidden />
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* Folder requests */}
                {expandedFolders.has(folder.id) && (
                  <div className="ml-4">
                    {filteredData.requests
                      .filter((req) => req.folderId === folder.id)
                      .map((request) => (
                        <div
                          key={request.id}
                          onClick={() => onSelectRequest(request)}
                          className={`flex items-center gap-2 p-2 mb-1 rounded-md cursor-pointer transition-colors group ${
                            selectedRequestId === request.id
                              ? "bg-accent text-accent-foreground"
                              : "hover:bg-accent/30"
                          }`}
                        >
                          <span className={`text-xs font-medium ${getMethodColor(request.method)} w-10 shrink-0`}>
                            {request.method}
                          </span>
                          {renamingRequestId === request.id ? (
                            <input
                              type="text"
                              value={renameValue}
                              onChange={(e) => setRenameValue(e.target.value)}
                              onKeyDown={handleSaveRename}
                              onBlur={handleBlurRename}
                              onClick={(e) => e.stopPropagation()}
                              autoFocus
                              className="flex-1 h-6 px-1 text-xs bg-background border border-input rounded focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                          ) : (
                            <>
                              <span className="text-xs font-medium text-foreground flex-1 truncate">
                                {truncateName(request.name)}
                              </span>
                              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                {onRenameRequest && (
                                  <button
                                    type="button"
                                    onClick={(e) => handleStartRenameRequest(request, e)}
                                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    title="Rename"
                                  >
                                    <Pencil className="size-4 shrink-0" strokeWidth={2} aria-hidden />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={(e) => handleDeleteRequest(request.id, e)}
                                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                  title="Delete"
                                >
                                  <Trash2 className="size-4 shrink-0" strokeWidth={2} aria-hidden />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    {expandedFolders.has(folder.id) &&
                      filteredData.requests.filter((req) => req.folderId === folder.id).length === 0 && (
                        <div className="p-2 text-xs text-muted-foreground">No requests in this folder</div>
                      )}
                  </div>
                )}
              </div>
            ))}

            {/* Root level requests */}
            {filteredData.requests.filter((req) => !req.folderId).length > 0 && (
              <div className="mt-2">
                {searchQuery && filteredData.folders.length > 0 && (
                  <div className="px-2 py-1 text-xs font-medium text-muted-foreground">Uncategorized</div>
                )}
                {filteredData.requests
                  .filter((req) => !req.folderId)
                  .map((request) => (
                    <div
                      key={request.id}
                      onClick={() => onSelectRequest(request)}
                      className={`flex items-center gap-2 p-2 mb-1 rounded-md cursor-pointer transition-colors group ${
                        selectedRequestId === request.id
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-accent/30"
                      }`}
                    >
                      <span className={`text-xs font-medium ${getMethodColor(request.method)} w-10 shrink-0`}>
                        {request.method}
                      </span>
                      {renamingRequestId === request.id ? (
                        <input
                          type="text"
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={handleSaveRename}
                          onBlur={handleBlurRename}
                          onClick={(e) => e.stopPropagation()}
                          autoFocus
                          className="flex-1 h-6 px-1 text-xs bg-background border border-input rounded focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      ) : (
                        <>
                          <span className="text-xs font-medium text-foreground flex-1 truncate">
                            {truncateName(request.name)}
                          </span>
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            {onRenameRequest && (
                              <button
                                type="button"
                                onClick={(e) => handleStartRenameRequest(request, e)}
                                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                title="Rename"
                              >
                                <Pencil className="size-4 shrink-0" strokeWidth={2} aria-hidden />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={(e) => handleDeleteRequest(request.id, e)}
                              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              title="Delete"
                            >
                              <Trash2 className="size-4 shrink-0" strokeWidth={2} aria-hidden />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
