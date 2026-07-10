"use client";

export default function DashboardError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh", flexDirection: "column", gap: "1rem" }}>
      <h2 style={{ fontSize: "1.25rem", fontWeight: 600, color: "#1f2937" }}>Erreur du tableau de bord</h2>
      <p style={{ color: "#6b7280", textAlign: "center", maxWidth: 400 }}>
        {error.message || "Impossible de charger le tableau de bord."}
      </p>
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
        }}
      >
        Réessayer
      </button>
    </div>
  );
}
