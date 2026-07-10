"use client";

export default function RootError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", flexDirection: "column", gap: "1rem" }}>
      <h2 style={{ fontSize: "1.5rem", fontWeight: 600, color: "#1f2937" }}>Une erreur est survenue</h2>
      <p style={{ color: "#6b7280" }}>{error.message || "Quelque chose s'est mal passé."}</p>
      <button
        onClick={reset}
        style={{
          padding: "0.75rem 1.5rem",
          background: "#7126b6",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          cursor: "pointer",
          fontWeight: 500,
          fontSize: "0.95rem",
        }}
      >
        Réessayer
      </button>
    </div>
  );
}
