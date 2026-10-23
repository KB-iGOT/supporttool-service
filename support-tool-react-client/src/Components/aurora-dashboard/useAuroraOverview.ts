import { useCallback, useEffect, useRef, useState } from "react";
import { auroraService } from "../../services/aurora.service";
import { AuroraOverview, AuroraOverviewParams, LoadOptions } from "./aurora.model";

/**
 * Loads the Aurora dashboard overview. Only the most recent request updates
 * state, so fast clicks through months or days never show stale data.
 */
export const useAuroraOverview = () => {
  const [overview, setOverview] = useState<AuroraOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const latestRequestId = useRef(0);
  const lastParams = useRef<AuroraOverviewParams>({});

  const loadOverview = useCallback(async (params: AuroraOverviewParams, { keepCurrentData = false }: LoadOptions = {}) => {
    const requestId = ++latestRequestId.current;
    lastParams.current = params;
    if (keepCurrentData) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const response = await auroraService.getDashboardOverview(params);
      if (requestId === latestRequestId.current) {
        setOverview(response);
      }
    } catch (err: any) {
      if (requestId === latestRequestId.current) {
        console.error("Error fetching Aurora dashboard:", err);
        const responseBody = err?.response?.data;
        setError(responseBody?.error?.error?.message || responseBody?.responseMessage || err?.message || "Failed to load the Aurora AI dashboard.");
      }
    } finally {
      if (requestId === latestRequestId.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, []);

  const retry = useCallback(() => loadOverview(lastParams.current), [loadOverview]);
  const clearError = useCallback(() => setError(null), []);

  useEffect(() => {
    loadOverview({});
  }, [loadOverview]);

  return { overview, isLoading, isRefreshing, error, loadOverview, retry, clearError };
};
