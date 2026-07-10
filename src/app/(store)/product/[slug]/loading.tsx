"use client";

export default function ProductDetailLoading() {
  return (
    <div style={{ padding: "2rem", maxWidth: 900, margin: "0 auto", display: "flex", gap: "2rem", flexWrap: "wrap" as const }}>
      <div style={{ flex: "1 1 400px" }}>
        <div
          style={{
            height: 400,
            background: "#e5e7eb",
            borderRadius: 12,
            animation: "pulse 1.5s ease-in-out infinite",
          }}
        />
      </div>
      <div style={{ flex: "1 1 300px" }}>
        <div style={{ height: 36, background: "#e5e7eb", borderRadius: 4, marginBottom: 16, width: "80%", animation: "pulse 1.5s ease-in-out infinite" }} />
        <div style={{ height: 24, background: "#e5e7eb", borderRadius: 4, marginBottom: 12, width: "40%", animation: "pulse 1.5s ease-in-out infinite" }} />
        <div style={{ height: 16, background: "#e5e7eb", borderRadius: 4, marginBottom: 8, animation: "pulse 1.5s ease-in-out infinite" }} />
        <div style={{ height: 16, background: "#e5e7eb", borderRadius: 4, marginBottom: 8, width: "90%", animation: "pulse 1.5s ease-in-out infinite" }} />
        <div style={{ height: 16, background: "#e5e7eb", borderRadius: 4, width: "75%", animation: "pulse 1.5s ease-in-out infinite", marginBottom: 24 }} />
        <div style={{ height: 48, background: "#7126b6", borderRadius: 8, opacity: 0.4, animation: "pulse 1.5s ease-in-out infinite" }} />
      </div>
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
    </div>
  );
}
