import { useState } from "react";
import { HttpMethod, ResponseData, AuthConfig, Environment } from "../types";
import { executeHttpRequest, formatError } from "../utils/httpClient";

interface UseRequestExecutionResult {
    loading: boolean;
    error: string | null;
    response: ResponseData | null;
    executeRequest: (
        method: HttpMethod,
        url: string,
        headers: Record<string, string>,
        body: string,
        auth: AuthConfig,
        activeEnv: Environment | null
    ) => Promise<void>;
    clearError: () => void;
    clearResponse: () => void;
}

export function useRequestExecution(): UseRequestExecutionResult {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [response, setResponse] = useState<ResponseData | null>(null);

    const executeRequest = async (
        method: HttpMethod,
        url: string,
        headers: Record<string, string>,
        body: string,
        auth: AuthConfig,
        activeEnv: Environment | null
    ): Promise<void> => {
        setLoading(true);
        setError(null);
        setResponse(null);

        try {
            const responseData = await executeHttpRequest(
                method,
                url,
                headers,
                body,
                auth,
                activeEnv
            );
            setResponse(responseData);
        } catch (err) {
            const errorMessage = formatError(err);
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const clearError = (error: string | null = null): void => {
        setError(error);
    };

    const clearResponse = (response: ResponseData | null = null): void => {
        setResponse(response);
    };

    return {
        loading,
        error,
        response,
        executeRequest,
        clearError,
        clearResponse,
    };
}
