import { useState } from "react";
import { Download, Upload, Trash2, X, Check, AlertCircle } from "lucide-react";
import {
    exportAll,
    exportEnvironments,
    exportHistory,
    triggerFileImport,
    clearAllData,
    type ImportResult,
} from "../utils/importExport";

interface SettingsProps {
    onClose: () => void;
}

export function Settings({ onClose }: SettingsProps) {
    const [importResult, setImportResult] = useState<ImportResult | null>(null);
    const [showClearConfirm, setShowClearConfirm] = useState(false);

    const handleImport = (result: ImportResult) => {
        setImportResult(result);
        if (result.success) {
            // Auto-close after successful import
            setTimeout(() => {
                onClose();
            }, 1500);
        }
    };

    const handleClearAll = () => {
        clearAllData();
        setShowClearConfirm(false);
        setImportResult({
            success: true,
            message: "All data cleared successfully",
            imported: {
                environments: 0,
                historyItems: 0,
            },
        });
        setTimeout(() => {
            onClose();
        }, 1500);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-background border border-border rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <h2 className="text-xl font-semibold">Settings</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-accent rounded-md transition-colors"
                        aria-label="Close settings"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-8">
                    {/* Import/Export Section */}
                    <section>
                        <h3 className="text-lg font-semibold mb-4">Import & Export</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Export your environments and request history, or import data from a file.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Export Actions */}
                            <div className="space-y-2">
                                <h4 className="text-sm font-medium">Export</h4>
                                <div className="space-y-2">
                                    <button
                                        onClick={exportAll}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                                    >
                                        <Download className="h-4 w-4" />
                                        Export All
                                    </button>
                                    <button
                                        onClick={exportEnvironments}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
                                    >
                                        <Download className="h-4 w-4" />
                                        Export Environments
                                    </button>
                                    <button
                                        onClick={exportHistory}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
                                    >
                                        <Download className="h-4 w-4" />
                                        Export History
                                    </button>
                                </div>
                            </div>

                            {/* Import Actions */}
                            <div className="space-y-2">
                                <h4 className="text-sm font-medium">Import</h4>
                                <div className="space-y-2">
                                    <button
                                        onClick={() =>
                                            triggerFileImport(handleImport, {
                                                overwriteEnvironments: true,
                                                overwriteHistory: true,
                                            })
                                        }
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
                                    >
                                        <Upload className="h-4 w-4" />
                                        Import All
                                    </button>
                                    <button
                                        onClick={() =>
                                            triggerFileImport(handleImport, {
                                                overwriteEnvironments: true,
                                                overwriteHistory: false,
                                            })
                                        }
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
                                    >
                                        <Upload className="h-4 w-4" />
                                        Import Environments
                                    </button>
                                    <button
                                        onClick={() =>
                                            triggerFileImport(handleImport, {
                                                overwriteEnvironments: false,
                                                overwriteHistory: true,
                                            })
                                        }
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
                                    >
                                        <Upload className="h-4 w-4" />
                                        Import History
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Clear Data Section */}
                    <section>
                        <h3 className="text-lg font-semibold mb-4">Clear Data</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Permanently delete all environments, request history, and settings.
                        </p>

                        {showClearConfirm ? (
                            <div className="bg-destructive/10 border border-destructive rounded-md p-4 space-y-3">
                                <div className="flex items-start gap-2 text-sm">
                                    <AlertCircle className="h-4 w-4 mt-0.5 text-destructive flex-shrink-0" />
                                    <p className="text-destructive">
                                        Are you sure you want to delete all data? This action cannot be undone.
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleClearAll}
                                        className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors text-sm"
                                    >
                                        Yes, Delete All
                                    </button>
                                    <button
                                        onClick={() => setShowClearConfirm(false)}
                                        className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors text-sm"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowClearConfirm(true)}
                                className="flex items-center justify-center gap-2 px-4 py-2 bg-destructive/10 text-destructive border border-destructive/20 rounded-md hover:bg-destructive/20 transition-colors"
                            >
                                <Trash2 className="h-4 w-4" />
                                Clear All Data
                            </button>
                        )}
                    </section>
                </div>

                {/* Import Result Alert */}
                {importResult && (
                    <div
                        className={`mx-6 mb-6 p-4 rounded-md flex items-start gap-3 ${
                            importResult.success
                                ? "bg-green-500/10 text-green-500 border border-green-500/20"
                                : "bg-destructive/10 text-destructive border border-destructive/20"
                        }`}
                    >
                        {importResult.success ? (
                            <Check className="h-5 w-5 flex-shrink-0 mt-0.5" />
                        ) : (
                            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
                            <p className="text-sm font-medium">
                                {importResult.success ? "Import Successful" : "Import Failed"}
                            </p>
                            <p className="text-sm mt-1">{importResult.message}</p>
                            {importResult.success && (
                                <p className="text-sm mt-1 text-muted-foreground">
                                    {importResult.imported.environments > 0 && (
                                        <span>{importResult.imported.environments} environments imported. </span>
                                    )}
                                    {importResult.imported.historyItems > 0 && (
                                        <span>{importResult.imported.historyItems} history items imported.</span>
                                    )}
                                </p>
                            )}
                        </div>
                        <button
                            onClick={() => setImportResult(null)}
                            className="p-1 hover:opacity-70 transition-opacity"
                            aria-label="Close alert"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
