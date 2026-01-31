export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD";

export type AuthType = "None" | "Basic" | "Bearer" | "Custom";

export interface AuthConfig {
  type: AuthType;
  username?: string;
  password?: string;
  token?: string;
  headerName?: string;
  headerValue?: string;
}

export interface RequestData {
  method: HttpMethod;
  url: string;
  headers: Record<string, string>;
  params: Record<string, string>;
  body: string;
  auth: AuthConfig;
}

export interface ResponseData {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  timing: number; // milliseconds
  size: number; // bytes
}

export interface EnvironmentVariable {
  key: string;
  value: string;
  enabled: boolean;
}

export interface Environment {
  id: string;
  name: string;
  variables: EnvironmentVariable[];
}

export interface RequestHistoryItem {
  id: string;
  method: HttpMethod;
  url: string;
  timestamp: number;
  status: number | null;
  statusText: string | null;
  requestData: RequestData;
  responseData: ResponseData | null;
  folder?: string;
}
