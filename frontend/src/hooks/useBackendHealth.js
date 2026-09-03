import { useCallback, useEffect, useState } from "react";
import { getDatabaseHealth } from "../services/api";

export function useBackendHealth() {
    const [health, setHealth] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const refresh = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const result = await getDatabaseHealth();
            setHealth(result);
        } catch (err) {
            console.error("Backend health error:", err);
            setError(err.message || "Backend unavailable");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    return {
        health,
        loading,
        error,
        refresh,
    };
}