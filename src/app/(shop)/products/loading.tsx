"use client";

export default function ProductsLoading() {
  return (
    <div style={{ padding: "2rem", maxWidth: 1200, margin: "0 auto" }}>
      <div
        style={{
          height: 32,
          width: 200,
          background: "#e5e7eb",
          borderRadius: 8,
          marginBottom: "2rem",
          animation: "pulse 1.5s ease-in-out infinite",
        }}
      />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "1.5rem" }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            style={{
              background: "#f3f4f6",
              borderRadius: 12,
              padding: "1rem",
              animation: "pulse 1.5s ease-in-out infinite",
            }}
          >
            <div style={{ height: 180, background: "#e5e7eb", borderRadius: 8, marginBottom: "1rem" }} />
            <div style={{ height: 20, background: "#e5e7eb", borderRadius: 4, marginBottom: 8, width: "70%" }} />
            <div style={{ height: 16, background: "#e5e7eb", borderRadius: 4, width: "50%" }} />
          </div>
        ))}
      </div>
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
    </div>
  );
}
