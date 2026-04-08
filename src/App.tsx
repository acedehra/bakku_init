import { useEffect, useState } from "react";
import "./App.css";
import { HistorySidebar } from "./components/HistorySidebar";
import { RequestPane } from "./components/RequestPane";
import { ResponsePane } from "./components/ResponsePane";
import { ResizeHandle } from "./components/ResizeHandle";
import {
  HttpMethod,
  RequestData,
  RequestHistoryItem,
  AuthConfig,
} from "./types";
import { usePanelResize } from "./hooks/usePanelResize";
import { useRequestHistory } from "./hooks/useRequestHistory";
import { useUrlParams } from "./hooks/useUrlParams";
import { useRequestExecution } from "./hooks/useRequestExecution";
import { useRequestHistoryManager } from "./hooks/useRequestHistoryManager";
import { getBaseUrl } from "./utils/urlParser";
import { useEnvironments } from "./hooks/useEnvironments";
import { EnvironmentManager } from "./components/EnvironmentManager";


function App() {
  useEffect(() => {
    // Force dark theme globally while the app is mounted
    document.documentElement.classList.add("dark");
    return () => {
      document.documentElement.classList.remove("dark");
    };
  }, []);

  const {
    sidebarWidth,
    responseWidth,
    handleSidebarResize,
    handleResponseResize,
  } = usePanelResize();

  const {
    history,
    addToHistory
  } = useRequestHistory();

  const {
    url,
    setUrl,
    params,
    setParams,
    updateFromHistory
  } = useUrlParams("https://jsonplaceholder.typicode.com/todos/1");

  const {
    environments,
    activeEnvId,
    activeEnv,
    setActiveEnvId,
    addEnvironment,
    updateEnvironment,
    deleteEnvironment,
  } = useEnvironments();

  const [isEnvManagerOpen, setIsEnvManagerOpen] = useState(false);

  const [method, setMethod] = useState<HttpMethod>("GET");
  const [headers, setHeaders] = useState<Record<string, string>>({});
  const [body, setBody] = useState("");
  const [auth, setAuth] = useState<AuthConfig>({ type: "None" });

  const {
    loading,
    error,
    response,
    executeRequest,
    clearError,
    clearResponse,
  } = useRequestExecution();

  const {
    selectedHistoryId,
    handleHistorySelect,
    clearHistorySelection,
  } = useRequestHistoryManager({
    setMethod,
    updateFromHistory,
    setHeaders,
    setBody,
    setAuth,
    clearResponse,
    clearError,
  });

  async function sendRequest() {
    clearHistorySelection();
    await executeRequest(method, url, headers, body, auth, activeEnv);

    // Save to history after request completes (success or failure)
    const baseUrl = getBaseUrl(url);
    const requestData: RequestData = {
      method,
      url: baseUrl,
      headers,
      params,
      body,
      auth,
    };

    const historyItem: RequestHistoryItem = {
      id: `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      method,
      url,
      timestamp: Date.now(),
      status: response?.status ?? null,
      statusText: response?.statusText ?? null,
      requestData,
      responseData: response ?? null,
    };

    addToHistory(historyItem);
  }

  return (
    <div className="h-screen bg-background text-foreground flex overflow-hidden">
      <div style={{ width: `${sidebarWidth}px` }} className="h-screen flex-shrink-0">
        <HistorySidebar
          history={history}
          selectedId={selectedHistoryId}
          onSelect={handleHistorySelect}
        />
      </div>
      <ResizeHandle onResize={handleSidebarResize} />
      <RequestPane
        method={method}
        url={url}
        headers={headers}
        params={params}
        body={body}
        auth={auth}
        onMethodChange={setMethod}
        onUrlChange={setUrl}
        onHeadersChange={setHeaders}
        onParamsChange={setParams}
        onBodyChange={setBody}
        onAuthChange={setAuth}
        onSend={sendRequest}
        loading={loading}
        environments={environments}
        activeEnvId={activeEnvId}
        onActiveEnvChange={setActiveEnvId}
        onOpenEnvManager={() => setIsEnvManagerOpen(true)}
      />
      <ResizeHandle onResize={handleResponseResize} />
      <div style={{ width: `${responseWidth}px` }} className="h-screen flex-shrink-0">
        <ResponsePane response={response} error={error} loading={loading} />
      </div>

      {isEnvManagerOpen && (
        <EnvironmentManager
          environments={environments}
          onAdd={addEnvironment}
          onUpdate={updateEnvironment}
          onDelete={deleteEnvironment}
          onClose={() => setIsEnvManagerOpen(false)}
        />
      )}
    </div>
  );
}

export default App;
