"use client";

export default function RootLoading() {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
      <div
        style={{
          width: 48,
          height: 48,
          border: "4px solid #e5e7eb",
          borderTopColor: "#7126b6",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
