import { FormEvent, useState } from "react";
import "./App.css";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD";

function App() {
  const [url, setUrl] = useState(
    "https://jsonplaceholder.typicode.com/todos/1",
  );
  const [method, setMethod] = useState<HttpMethod>("GET");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [responseText, setResponseText] = useState<string | null>(null);

  const canHaveBody = method !== "GET" && method !== "HEAD";

  async function sendRequest(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setStatus(null);
    setResponseText(null);

    try {
      const init: RequestInit = { method };

      if (canHaveBody && body.trim()) {
        init.body = body;
        init.headers = {
          "Content-Type": "application/json",
        };
      }

      const res = await fetch(url, init);
      setStatus(`${res.status} ${res.statusText}`);

      const text = await res.text();
      let pretty = text;

      try {
        const json = JSON.parse(text);
        pretty = JSON.stringify(json, null, 2);
      } catch {
        // response is not JSON, show raw text
      }

      setResponseText(pretty);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
      <div className="w-full max-w-3xl p-6 space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Kordix</h1>
          <p className="text-sm text-muted-foreground">
            Minimal REST client — step 1: send a request and see the response.
          </p>
        </header>

        <form onSubmit={sendRequest} className="space-y-4">
          <div className="flex gap-2">
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as HttpMethod)}
              className="h-10 rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD"].map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>

            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://api.example.com/resource"
              className="flex-1 h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              required
            />

            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Sending..." : "Send"}
            </button>
          </div>

          {canHaveBody && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Request body (JSON)
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={4}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder='{"title": "New item"}'
              />
            </div>
          )}
        </form>

        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">Response</h2>
            {status && (
              <span className="text-xs rounded-full bg-secondary px-2 py-0.5 text-secondary-foreground">
                {status}
              </span>
            )}
          </div>
          <div className="rounded-md border border-border bg-card p-3">
            {error && (
              <p className="text-sm text-destructive whitespace-pre-wrap">
                {error}
              </p>
            )}

            {!error && responseText && (
              <pre className="text-xs whitespace-pre-wrap font-mono">
                {responseText}
              </pre>
            )}

            {!error && !responseText && !loading && (
              <p className="text-xs text-muted-foreground">
                Send a request to see the response here.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default App;
