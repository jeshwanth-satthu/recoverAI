import { useCallback, useEffect, useState } from "react";
import { getRecoveryCases } from "../services/api";

export function useRecoveryCases() {
    const [cases, setCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const refresh = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const result = await getRecoveryCases();

            setCases(result?.cases || []);
        } catch (err) {
            console.error("Recovery cases API error:", err);
            setError(err.message || "Failed to load recovery cases");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    return {
        cases,
        loading,
        error,
        refresh,
    };
}