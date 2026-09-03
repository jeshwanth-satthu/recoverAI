export default function StatusDot({
    status = "online",
    pulse = true,
}) {
    return (
        <span
            className={`status-dot status-${status} ${pulse ? "status-pulse" : ""
                }`}
        />
    );
}