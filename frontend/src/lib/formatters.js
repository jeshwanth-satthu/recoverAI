export function formatCurrency(value, currency = "INR") {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
    }).format(value || 0);
}

export function formatNumber(value) {
    return new Intl.NumberFormat("en-IN").format(value || 0);
}

export function formatPercent(value) {
    return `${Number(value || 0).toFixed(1)}%`;
}

export function shortenId(id = "") {
    if (id.length <= 16) return id;

    return `${id.slice(0, 9)}...${id.slice(-5)}`;
}

export function formatDate(date) {
    if (!date) return "—";

    return new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(date));
}