"use client";

export default function DashboardLoading() {
  return (
    <div style={{ padding: "2rem", maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            style={{
              height: 100,
              background: "#f3f4f6",
              borderRadius: 12,
              animation: "pulse 1.5s ease-in-out infinite",
            }}
          />
        ))}
      </div>
      <div style={{ height: 320, background: "#f3f4f6", borderRadius: 12, animation: "pulse 1.5s ease-in-out infinite" }} />
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
    </div>
  );
}
