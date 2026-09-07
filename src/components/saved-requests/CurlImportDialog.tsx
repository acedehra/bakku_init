import { useState, useMemo } from 'react';
import { X, Terminal, ArrowRight, Save } from 'lucide-react';
import { parseCurl, ParsedCurl } from '../../utils/curlParser';

interface CurlImportDialogProps {
  open: boolean;
  onClose: () => void;
  onLoadIntoCurrent: (parsed: ParsedCurl) => void;
  onSaveAsNew: (parsed: ParsedCurl, name: string) => Promise<void>;
}

export function CurlImportDialog({
  open,
  onClose,
  onLoadIntoCurrent,
  onSaveAsNew,
}: CurlImportDialogProps) {
  const [curlText, setCurlText] = useState('');
  const [requestName, setRequestName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const parsed = useMemo<ParsedCurl | null>(() => {
    if (!curlText.trim()) return null;
    return parseCurl(curlText);
  }, [curlText]);

  if (!open) return null;

  const handleLoad = () => {
    if (!parsed) return;
    onLoadIntoCurrent(parsed);
    onClose();
  };

  const handleSave = async () => {
    if (!parsed) return;
    try {
      setIsSaving(true);
      const name =
        requestName.trim() ||
        `${parsed.method} ${parsed.url.replace(/^https?:\/\//, '').split('?')[0] || 'Request'}`;
      await onSaveAsNew(parsed, name);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const getMethodBadgeClass = (method: string) => {
    switch (method) {
      case 'GET':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'POST':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'PUT':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'PATCH':
        return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'DELETE':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background border border-border rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Terminal size={18} className="text-primary" />
            <h2 className="text-lg font-semibold">Import cURL Command</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-accent rounded-md transition-colors text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 flex-1 overflow-y-auto">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Paste your cURL command below:
            </label>
            <textarea
              value={curlText}
              onChange={(e) => setCurlText(e.target.value)}
              placeholder={
                "curl 'https://api.example.com/data' -H 'Authorization: Bearer token' -d '{\"key\":\"value\"}'"
              }
              rows={6}
              className="w-full font-mono text-xs p-3 rounded-md bg-accent/20 border border-border focus:outline-none focus:ring-1 focus:ring-primary resize-y"
              autoFocus
            />
          </div>

          {/* Parsed Preview */}
          {parsed ? (
            <div className="p-3.5 rounded-lg border border-border bg-card/60 space-y-3">
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded border ${getMethodBadgeClass(
                    parsed.method
                  )}`}
                >
                  {parsed.method}
                </span>
                <span
                  className="text-xs font-mono text-foreground truncate flex-1"
                  title={parsed.url}
                >
                  {parsed.url || '(No URL specified)'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div>
                  <span className="font-medium text-foreground">Headers:</span>{' '}
                  {parsed.headers.length} detected
                </div>
                <div>
                  <span className="font-medium text-foreground">Auth:</span> {parsed.auth.type}
                </div>
                {parsed.body && (
                  <div className="col-span-2">
                    <span className="font-medium text-foreground">Body:</span>{' '}
                    <span className="font-mono text-[11px] text-muted-foreground truncate inline-block max-w-full">
                      {parsed.body.slice(0, 80)}
                      {parsed.body.length > 80 ? '...' : ''}
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-border">
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Request Name (optional, for saving):
                </label>
                <input
                  type="text"
                  value={requestName}
                  onChange={(e) => setRequestName(e.target.value)}
                  placeholder={`${parsed.method} Request`}
                  className="w-full text-xs px-2.5 py-1.5 rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          ) : curlText.trim() ? (
            <div className="text-xs text-destructive p-3 rounded-md bg-destructive/10 border border-destructive/20">
              Could not parse as a valid cURL command. Ensure it starts with <code>curl</code>.
            </div>
          ) : null}
        </div>

        {/* Actions Footer */}
        <div className="p-4 border-t border-border flex items-center justify-end gap-2 bg-accent/5">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-medium rounded-md border border-border hover:bg-accent transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!parsed}
            onClick={handleLoad}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowRight size={14} />
            Load into Active Request
          </button>
          <button
            type="button"
            disabled={!parsed || isSaving}
            onClick={handleSave}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={14} />
            {isSaving ? 'Saving...' : 'Save as New Request'}
          </button>
        </div>
      </div>
    </div>
  );
}
