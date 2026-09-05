const API_BASE_URL =
    import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

async function request(endpoint, options = {}) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            ...(options.headers || {}),
        },
        ...options,
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data?.detail?.error ||
            data?.detail?.message ||
            data?.detail ||
            `Request failed: ${response.status}`
        );
    }

    return data;
}

export function getDashboard() {
    return request("/api/dashboard");
}

export function getTransactions() {
    return request("/api/mongodb/transactions");
}

export function getRecoveryCases() {
    return request("/api/recovery-cases");
}

export function getAuditLogs() {
    return request("/api/audit");
}

export function getDatabaseHealth() {
    return request("/health/database");
}

export function recoverTransaction(transactionId) {
    return request(`/api/recovery/${transactionId}`, {
        method: "POST",
    });
}

export function approveRecovery(transactionId) {
    return request(`/api/recovery/${transactionId}/approve`, {
        method: "POST",
    });
}

export function recoverBatch() {
    return request("/api/batch/recover", {
        method: "POST",
    });
}
export async function createRazorpayOrder(transactionId) {
    return request(
        `/api/razorpay/create-order/${transactionId}`,
        {
            method: "POST",
        }
    );
}

export function verifyRazorpayPayment(payload) {
    return request("/api/razorpay/verify-payment", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export function resetDemoData() {
    return request("/api/demo/reset", {
        method: "POST",
    });
}

export function getRecoveryAnomaly() {
    return request("/api/recovery-anomaly");
}

export function getMLStatus() {
    return request("/api/ml/status");
}

export function getRecoveryPriority() {
    return request("/api/recovery-priority");
}

export function submitRecoveryFeedback(transactionId, { action, feedback }) {
    return request(`/api/recovery/${transactionId}/feedback`, {
        method: "POST",
        body: JSON.stringify({ action, feedback }),
    });
}

export { API_BASE_URL };