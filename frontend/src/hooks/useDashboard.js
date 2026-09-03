import { useCallback, useEffect, useState } from "react";
import { getDashboard } from "../services/api";

export function useDashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const refresh = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const result = await getDashboard();
            setData(result);
        } catch (err) {
            console.error("Dashboard API error:", err);
            setError(err.message || "Failed to load dashboard");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    return {
        data,
        loading,
        error,
        refresh,
    };
}